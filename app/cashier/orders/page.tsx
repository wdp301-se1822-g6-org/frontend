'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminCreateWorkOrder, adminGetWorkOrders } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Camera,
  Plus,
  Trash2,
  Eye,
  X,
  Calendar,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ShiftInfo {
  _id?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  timeSlot?: string;
}

export interface OrderData {
  _id?: string;
  id?: string;
  userId?: { fullName?: string; email?: string; phone?: string };
  customerName?: string;
  vehicleId?: { licensePlate?: string; model?: string; brand?: string };
  licensePlate?: string;
  serviceTypeId?: { name?: string; price?: number };
  serviceName?: string;
  shiftId?: ShiftInfo | string;
  bookingDate?: string;
  scheduledAt?: string;
  createdAt?: string;
  amount?: number | string;
  totalPrice?: number | string;
  status?: string;
  [key: string]: unknown;
}

const statusConfig: Record<string, { label: string; cls: string; iconBg: string }> = {
  completed:       { label: 'Hoàn thành',       cls: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30', iconBg: 'bg-emerald-500' },
  in_progress:     { label: 'Đang rửa xe',      cls: 'bg-blue-500/10 text-blue-600 border border-blue-500/30 font-semibold animate-pulse', iconBg: 'bg-blue-500' },
  confirmed:       { label: 'Chờ Check-in',     cls: 'bg-amber-500/10 text-amber-700 border border-amber-500/30', iconBg: 'bg-amber-500' },
  checked_in:      { label: 'Đã check-in',      cls: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/30', iconBg: 'bg-cyan-500' },
  pending_payment: { label: 'Chờ thanh toán',   cls: 'bg-purple-500/10 text-purple-600 border border-purple-500/30', iconBg: 'bg-purple-500' },
  cancelled:       { label: 'Đã hủy',           cls: 'bg-rose-500/10 text-rose-600 border border-rose-500/30', iconBg: 'bg-rose-500' },
  no_show:         { label: 'Vắng mặt',         cls: 'bg-slate-500/10 text-slate-600 border border-slate-500/30', iconBg: 'bg-slate-500' },
};

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'confirmed', label: 'Chờ Check-in (Đã xác nhận)' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'in_progress', label: 'Đang rửa xe' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'pending_payment', label: 'Chờ thanh toán' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'no_show', label: 'Vắng mặt' },
];

export const formatShiftDetails = (shift?: ShiftInfo | string, dateStr?: string) => {
  if (shift) {
    if (typeof shift === 'string') return { name: shift, time: null };
    if (shift.name) {
      const time = (shift.startTime && shift.endTime)
        ? `${shift.startTime} - ${shift.endTime}`
        : shift.timeSlot || null;
      return { name: shift.name, time };
    }
  }

  // Tự động suy luận Ca trực từ giờ hẹn nếu shiftId chưa có sẵn
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const hour = d.getHours();
        if (hour >= 6 && hour < 12) {
          return { name: 'Ca sáng', time: '08:00 - 12:00' };
        }
        if (hour >= 12 && hour < 17) {
          return { name: 'Ca chiều', time: '12:00 - 17:00' };
        }
        if (hour >= 17 && hour < 22) {
          return { name: 'Ca tối', time: '17:00 - 21:00' };
        }
      }
    } catch {
      // ignore parsing error
    }
  }

  return { name: 'Ca làm việc', time: null };
};

export const formatBookingTime = (dateStr?: string) => {
  if (!dateStr) return { dateText: '-', timeText: null, isToday: false, isTomorrow: false };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { dateText: dateStr, timeText: null, isToday: false, isTomorrow: false };

    const todayStr = new Date().toDateString();
    const isToday = d.toDateString() === todayStr;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeText = (hours !== '00' || minutes !== '00') ? `${hours}:${minutes}` : null;
    const dateText = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return { dateText, timeText, isToday, isTomorrow };
  } catch {
    return { dateText: '-', timeText: null, isToday: false, isTomorrow: false };
  }
};

export default function CashierOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'scheduled_desc'>('newest');
  const [page, setPage] = useState(1);

  // Check-in kèm ảnh hiện trạng
  const [checkInTarget, setCheckInTarget] = useState<OrderData | null>(null);
  const [checkInPhotos, setCheckInPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const openCheckIn = (o: OrderData) => {
    setCheckInTarget(o);
    setCheckInPhotos([]);
  };

  const handleUploadCheckIn = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh hiện trạng lên server...');
    try {
      const { uploadImages } = await import('@/lib/upload-api');
      const res = await uploadImages(files);
      const urls = res.data.urls;
      setCheckInPhotos((prev) => [...prev, ...urls]);
      toast.success(`Đã tải lên thành công ${urls.length} ảnh hiện trạng.`, { id: toastId });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải ảnh lên.';
      toast.error(`Lỗi tải ảnh: ${errMsg}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cashier-orders', page, statusFilter],
    queryFn: () => adminGetOrders({
      page, limit: 20,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
  });

  const { data: workOrdersRes } = useQuery({
    queryKey: ['cashier-work-orders-all'],
    queryFn: () => adminGetWorkOrders(),
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ orderId, photos }: { orderId: string; photos: string[] }) => {
      await adminCreateWorkOrder(orderId, photos);
    },
    onSuccess: () => {
      toast.success('Check-in thành công! Đã gửi đơn vào danh sách điều phối bàn rửa.');
      setCheckInTarget(null);
      setCheckInPhotos([]);
      qc.invalidateQueries({ queryKey: ['cashier-orders'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi check-in.';
      toast.error(`Check-in thất bại: ${errMsg}`);
    }
  });

  const rawOrders: OrderData[] = useMemo(() => data?.data?.data ?? data?.data ?? [], [data]);
  const total: number = data?.data?.total ?? rawOrders.length;

  // Lọc và Sắp xếp MỚI NHẤT LÊN ĐẦU
  const processedOrders = useMemo(() => {
    let list = [...rawOrders];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => {
        const orderId = (o._id ?? o.id ?? '').toLowerCase();
        const customer = (o.userId?.fullName ?? o.customerName ?? '').toLowerCase();
        const plate = (o.vehicleId?.licensePlate ?? o.licensePlate ?? '').toLowerCase();
        const service = (o.serviceTypeId?.name ?? o.serviceName ?? '').toLowerCase();
        return orderId.includes(q) || customer.includes(q) || plate.includes(q) || service.includes(q);
      });
    }

    // Sort: default newest first (Mới nhất lên trên)
    list.sort((a, b) => {
      if (sortOrder === 'newest') {
        const tA = new Date(a.createdAt ?? a.bookingDate ?? a.scheduledAt ?? 0).getTime();
        const tB = new Date(b.createdAt ?? b.bookingDate ?? b.scheduledAt ?? 0).getTime();
        return tB - tA;
      }
      if (sortOrder === 'oldest') {
        const tA = new Date(a.createdAt ?? a.bookingDate ?? a.scheduledAt ?? 0).getTime();
        const tB = new Date(b.createdAt ?? b.bookingDate ?? b.scheduledAt ?? 0).getTime();
        return tA - tB;
      }
      if (sortOrder === 'scheduled_desc') {
        const tA = new Date(a.scheduledAt ?? a.bookingDate ?? 0).getTime();
        const tB = new Date(b.scheduledAt ?? b.bookingDate ?? 0).getTime();
        return tB - tA;
      }
      return 0;
    });

    return list;
  }, [rawOrders, search, sortOrder]);

  return (
    <>
      <AdminTopbar title='Quản lý Lịch hẹn đặt xe' subtitle='Theo dõi ca trực, xem đơn mới nhất và tiếp nhận Check-in vào xưởng' />
      <main className='flex-1 p-6 md:p-8 overflow-y-auto bg-muted/40'>
        <div className='max-w-7xl mx-auto space-y-6'>



          {/* Filters & Control Toolbar */}
          <div className='flex flex-wrap items-center gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs'>
            {/* Input tìm kiếm có nút Xóa */}
            <div className='relative flex-1 min-w-[240px]'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Tìm theo tên khách, biển số, tên dịch vụ hoặc mã đơn...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-10 pr-9 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:border-primary focus:bg-card transition-all font-medium'
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full text-muted-foreground'
                  title='Xóa tìm kiếm'
                >
                  <X className='w-3.5 h-3.5' />
                </button>
              )}
            </div>

            {/* Trạng thái Dropdown */}
            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-muted/30 border border-border rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold focus:outline-none focus:border-primary transition-all cursor-pointer shadow-xs text-foreground'
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
            </div>

            {/* Bộ chọn Sắp xếp (Mới nhất mặc định) */}
            <div className='relative'>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'scheduled_desc')}
                className='appearance-none bg-muted/30 border border-border rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold focus:outline-none focus:border-primary transition-all cursor-pointer shadow-xs text-foreground'
              >
                <option value='newest'>Đơn mới nhất lên trên</option>
                <option value='scheduled_desc'>Ngày hẹn mới nhất</option>
                <option value='oldest'>Đơn cũ nhất trước</option>
              </select>
              <ArrowUpDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted/40 text-sm font-semibold transition-all shadow-xs text-foreground shrink-0 active:scale-95'
            >
              <RefreshCw className={`w-4 h-4 text-primary ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Table container */}
          <div className='bg-card rounded-2xl border border-border shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left border-collapse'>
                <thead>
                  <tr className='bg-muted/60 border-b border-border text-muted-foreground'>
                    {['MÃ ĐƠN', 'KHÁCH HÀNG', 'BIỂN SỐ XE', 'DỊCH VỤ DẶT', 'THỜI GIAN HẸN', 'SỐ TIỀN', 'TRẠNG THÁI', 'CHECK-IN / THAO TÁC'].map((h) => (
                      <th key={h} className='px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/60 bg-card'>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className='px-5 py-4'>
                            <div className='h-5 bg-muted animate-pulse rounded-lg' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : processedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='px-5 py-20 text-center text-muted-foreground'>
                        <div className='flex flex-col items-center justify-center gap-3'>
                          <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary'>
                            <Calendar className='w-6 h-6' />
                          </div>
                          <p className='font-bold text-foreground text-base'>Không tìm thấy lịch hẹn nào</p>
                          <p className='text-xs max-w-sm text-muted-foreground'>
                            Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái để xem đầy đủ danh sách.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedOrders.map((o: OrderData) => {
                      const s = statusConfig[o.status ?? ''] ?? { label: o.status || 'Chưa xác định', cls: 'bg-muted text-muted-foreground', iconBg: 'bg-gray-400' };
                      const orderId = o._id ?? o.id ?? '';
                      const isConfirmed = o.status === 'confirmed';
                      const isReceived = o.status === 'checked_in' || o.status === 'in_progress' || o.status === 'completed';

                      const rawDate = o.scheduledAt ?? o.bookingDate ?? o.createdAt;
                      const dateDetail = formatBookingTime(rawDate);

                      // Work Orders & pre-wash photos lookup
                      const workOrdersList = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];
                      const matchingWo = (workOrdersList as Array<{ orderId?: string | { _id?: string; id?: string }; checkinPhotos?: string[] }>).find((wo) => {
                        const woOrderId = typeof wo.orderId === 'string' ? wo.orderId : wo.orderId?._id ?? wo.orderId?.id;
                        return woOrderId === orderId;
                      });
                      const checkinPhotos = matchingWo?.checkinPhotos || [];

                      return (
                        <tr key={orderId} className='hover:bg-muted/40 transition-colors group'>
                          {/* Mã đơn */}
                          <td className='px-5 py-4 font-mono text-xs font-bold text-foreground'>
                            <span className='px-2.5 py-1 rounded-md bg-muted/60 border border-border group-hover:border-primary/40 transition-colors'>
                              #{orderId.slice(-6).toUpperCase()}
                            </span>
                          </td>

                          {/* Khách hàng */}
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20'>
                                {(o.userId?.fullName ?? o.customerName ?? 'K')[0].toUpperCase()}
                              </div>
                              <div>
                                <span className='font-bold text-foreground block text-sm leading-tight'>
                                  {o.userId?.fullName ?? o.customerName ?? 'Khách vãng lai'}
                                </span>
                                {o.userId?.phone && (
                                  <span className='text-[11px] text-muted-foreground font-mono'>
                                    {o.userId.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Biển số xe */}
                          <td className='px-5 py-4'>
                            <span className='font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 inline-block shadow-xs uppercase tracking-wider'>
                              {o.vehicleId?.licensePlate ?? o.licensePlate ?? 'N/A'}
                            </span>
                          </td>

                          {/* Dịch vụ */}
                          <td className='px-5 py-4 font-medium text-foreground text-xs max-w-[180px] truncate'>
                            {o.serviceTypeId?.name ?? o.serviceName ?? 'Dịch vụ rửa xe'}
                          </td>

                          {/* Thời gian hẹn */}
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2 text-xs font-semibold text-foreground flex-wrap'>
                              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold'>
                                <Clock className='w-3.5 h-3.5 shrink-0 text-primary' />
                                {dateDetail.timeText ? `${dateDetail.timeText} • ${dateDetail.dateText}` : dateDetail.dateText}
                              </span>
                              {dateDetail.isToday && (
                                <span className='px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-primary text-primary-foreground uppercase tracking-wider'>
                                  Hôm nay
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Số tiền */}
                          <td className='px-5 py-4 font-bold text-foreground font-mono text-sm'>
                            {(o.amount ?? o.totalPrice) != null ? `${Number(o.amount ?? o.totalPrice).toLocaleString('vi-VN')}đ` : '0đ'}
                          </td>

                          {/* Trạng thái */}
                          <td className='px-5 py-4'>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${s.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.iconBg}`} />
                              {s.label}
                            </span>
                          </td>

                          {/* Thao tác / Check-in */}
                          <td className='px-5 py-4'>
                            {isConfirmed ? (
                              <button
                                onClick={() => openCheckIn(o)}
                                className='flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-xs transition-all shadow-sm shadow-primary/30'
                              >
                                <CheckCircle2 className='w-4 h-4' />
                                Check-in xe
                              </button>
                            ) : isReceived ? (
                              <div className='flex flex-col gap-1.5'>
                                <span className='text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1 w-fit'>
                                  <CheckCircle2 className='w-3.5 h-3.5' /> Đã nhận xe
                                </span>
                                {checkinPhotos.length > 0 ? (
                                  <div className='flex gap-1.5 overflow-x-auto max-w-[160px] py-1 scrollbar-none'>
                                    {checkinPhotos.map((photo, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setPreviewPhoto(photo)}
                                        className='relative w-9 h-9 rounded-lg overflow-hidden border border-border shadow-xs bg-muted/40 cursor-pointer hover:border-primary hover:scale-105 transition-all shrink-0 group'
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt='Hiện trạng trước rửa' className='w-full h-full object-cover' />
                                        <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                          <Eye className='w-3 h-3 text-white' />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className='text-[10px] text-muted-foreground italic pl-0.5'>Chưa có ảnh check-in</span>
                                )}
                              </div>
                            ) : (
                              <span className='text-xs font-medium text-muted-foreground flex items-center gap-1 italic'>
                                <AlertCircle className='w-3.5 h-3.5' /> Không khả dụng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {total > 20 && (
              <div className='flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30'>
                <span className='text-xs font-semibold text-muted-foreground'>
                  Hiển thị trang {page} / {Math.ceil(total / 20)} (Tổng {total} lịch hẹn)
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className='px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-all text-foreground bg-card'
                  >
                    Trang trước
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                    className='px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-all text-foreground bg-card'
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── MODAL: Check-in xe kèm ảnh hiện trạng ── */}
      {checkInTarget && (() => {
        const oid = checkInTarget._id ?? checkInTarget.id ?? '';
        const plate = checkInTarget.vehicleId?.licensePlate ?? checkInTarget.licensePlate ?? 'N/A';
        const customer = checkInTarget.userId?.fullName ?? checkInTarget.customerName ?? 'Khách hàng';

        return (
          <div
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => !checkInMutation.isPending && setCheckInTarget(null)}
          >
            <div
              className='bg-card rounded-2xl border border-border shadow-2xl p-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150 space-y-5'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3 text-primary'>
                  <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20'>
                    <Camera className='w-6 h-6' />
                  </div>
                  <div>
                    <h3 className='font-bold text-foreground text-lg leading-snug'>
                      Tiếp nhận Check-in Xe
                    </h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Khách: <strong className='text-foreground'>{customer}</strong> · Biển số: <span className='font-mono font-bold text-primary'>{plate}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !checkInMutation.isPending && setCheckInTarget(null)}
                  className='p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors'
                  aria-label='Đóng'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground block'>
                  Ảnh chụp hiện trạng xe (Trầy xước/Móp méo trước khi rửa)
                </label>
                <div className='grid grid-cols-4 gap-3'>
                  {checkInPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className='group relative aspect-square rounded-xl overflow-hidden border border-border shadow-xs bg-muted/40'
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt='Hiện trạng xe' className='w-full h-full object-cover' />
                      <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5'>
                        <button
                          type='button'
                          onClick={() => setPreviewPhoto(photo)}
                          className='w-7 h-7 bg-white/90 hover:bg-white text-foreground rounded-lg flex items-center justify-center'
                          title='Xem lớn'
                        >
                          <Eye className='w-4 h-4' />
                        </button>
                        <button
                          type='button'
                          onClick={() => setCheckInPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className='w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center'
                          title='Xóa ảnh'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}

                  <label className='aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary bg-muted/30 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all text-center p-2'>
                    <Plus className='w-6 h-6 text-primary' />
                    <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                      Thêm ảnh
                    </span>
                    <input
                      type='file'
                      multiple
                      accept='image/*'
                      capture='environment'
                      className='hidden'
                      disabled={isUploading || checkInMutation.isPending}
                      onChange={(e) => handleUploadCheckIn(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {checkInPhotos.length === 0 && (
                <p className='text-xs text-muted-foreground italic text-center bg-muted/30 p-3 rounded-xl border border-border/50'>
                  Khuyên dùng: Chụp lại vết trầy xước ban đầu của xe để tránh khiếu nại sau khi hoàn thành dịch vụ.
                </p>
              )}

              <div className='flex items-center gap-2 text-[11px] text-muted-foreground bg-primary/10 border border-primary/20 rounded-xl p-3'>
                <Clock className='w-4 h-4 shrink-0 text-primary' />
                <span>Khi bấm &quot;Xác nhận Check-in&quot;, phiếu rửa sẽ tự động được gửi sang bãi rửa cho các kĩ thuật viên tiến hành.</span>
              </div>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  onClick={() => setCheckInTarget(null)}
                  disabled={checkInMutation.isPending}
                  className='px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-xs transition-all'
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => checkInMutation.mutate({ orderId: oid, photos: checkInPhotos })}
                  disabled={checkInMutation.isPending || isUploading}
                  className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-xs transition-all shadow-md shadow-primary/30'
                >
                  <CheckCircle2 className='w-4 h-4' />
                  {checkInMutation.isPending ? 'Đang gửi sang xưởng...' : 'Xác nhận Check-in ngay'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Phóng to ảnh */}
      {previewPhoto && (
        <div
          className='fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4'
          onClick={() => setPreviewPhoto(null)}
        >
          <div className='relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt='Phóng to ảnh check-in'
              className='rounded-2xl max-w-full max-h-[82vh] object-contain shadow-2xl border border-white/20'
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className='mt-3 bg-white/20 hover:bg-white/40 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-all'
            >
              Đóng xem ảnh (Esc)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

