'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminCreateWorkOrder, adminGetWorkOrders } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, Camera, Plus, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

interface OrderData {
  _id?: string;
  id?: string;
  userId?: { fullName?: string };
  customerName?: string;
  vehicleId?: { licensePlate?: string };
  licensePlate?: string;
  serviceTypeId?: { name?: string };
  serviceName?: string;
  shiftId?: { name?: string };
  bookingDate?: string;
  scheduledAt?: string;
  amount?: number | string;
  totalPrice?: number | string;
  status?: string;
  [key: string]: unknown;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed:       { label: 'Hoàn thành',       cls: 'bg-success/10 text-success border border-success/30' },
  in_progress:     { label: 'Đang rửa xe',      cls: 'bg-accent text-primary border border-primary/30' },
  confirmed:       { label: 'Đã xác nhận',      cls: 'bg-info/10 text-info border border-info/30' },
  checked_in:      { label: 'Đã check-in',      cls: 'bg-info/10 text-info border border-info/30' },
  pending_payment: { label: 'Chờ thanh toán',   cls: 'bg-warning/10 text-warning-foreground border border-warning/30' },
  cancelled:       { label: 'Đã hủy',           cls: 'bg-destructive/10 text-destructive border border-destructive/30' },
  no_show:         { label: 'Vắng mặt',         cls: 'bg-muted text-muted-foreground' },
};

const statusOptions = ['all', 'pending_payment', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function CashierOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Check-in kèm ảnh hiện trạng: upload qua API rồi gửi kèm khi tạo Work Order
  // (BE lưu vào checkinPhotos, thợ rửa xem lại để đối chiếu). Không dùng localStorage.
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
    const toastId = toast.loading('Đang tải ảnh lên Cloudinary...');
    try {
      const { uploadImages } = await import('@/lib/upload-api');
      const res = await uploadImages(files);
      const urls = res.data.urls;
      setCheckInPhotos((prev) => [...prev, ...urls]);
      toast.success(`Đã tải lên ${urls.length} ảnh hiện trạng.`, { id: toastId });
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
      page, limit: 10,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
  });

  const { data: workOrdersRes } = useQuery({
    queryKey: ['cashier-work-orders-all'],
    queryFn: () => adminGetWorkOrders(),
  });

  // Mutation check-in khách hàng (kèm ảnh hiện trạng)
  const checkInMutation = useMutation({
    mutationFn: async ({ orderId, photos }: { orderId: string; photos: string[] }) => {
      // Tạo Work Order = Check-in. BE tự chuyển đơn CONFIRMED → CHECKED_IN
      // (và mark PAID nếu đơn tiền mặt), nên không cần gọi updateOrderStatus.
      // Ảnh hiện trạng được gửi kèm vào checkinPhotos để lưu trên work order.
      await adminCreateWorkOrder(orderId, photos);
    },
    onSuccess: () => {
      toast.success('Check-in khách hàng thành công! Đã chuyển đơn hàng vào bãi rửa xe.');
      setCheckInTarget(null);
      setCheckInPhotos([]);
      qc.invalidateQueries({ queryKey: ['cashier-orders'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi check-in.';
      toast.error(`Check-in thất bại: ${errMsg}`);
    }
  });

  const orders: OrderData[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? orders.length;

  const filtered = search
    ? orders.filter((o: OrderData) =>
        JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <>
      <AdminTopbar title='Quản lý Lịch hẹn' subtitle='Xem lịch hẹn đặt trước của khách hàng và tiến hành Check-in xe' />
      <main className='flex-1 p-8 overflow-y-auto bg-muted/40'>
        <div className='max-w-7xl mx-auto'>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3 mb-6'>
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Tìm kiếm đơn đặt lịch...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-success/50 transition-all shadow-xs'
              />
            </div>

            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold focus:outline-none focus:border-success/50 transition-all cursor-pointer shadow-xs text-foreground'
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'Tất cả trạng thái' : statusConfig[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:border-emerald-300 transition-all shadow-xs text-muted-foreground'
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <span className='ml-auto text-xs font-semibold text-muted-foreground'>
              Tổng: {total} lịch hẹn
            </span>
          </div>

          {/* Table */}
          <div className='bg-card rounded-xl border border-border shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-muted-foreground'>
                <thead>
                  <tr className='bg-muted/40 border-b border-border'>
                    {['ID', 'Khách hàng', 'Biển số', 'Dịch vụ', 'Ca / Ngày hẹn', 'Số tiền', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className='text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className='px-5 py-4'>
                            <div className='h-4 bg-muted animate-pulse rounded-lg' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='px-5 py-16 text-center text-muted-foreground font-semibold'>
                        Không tìm thấy lịch hẹn nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o: OrderData) => {
                      const s = statusConfig[o.status ?? ''] ?? { label: o.status, cls: 'bg-muted text-muted-foreground' };
                      const orderId = o._id ?? o.id ?? '';
                      const isConfirmed = o.status === 'confirmed';
                      const isReceived = o.status === 'checked_in' || o.status === 'in_progress' || o.status === 'completed';

                      const workOrdersList = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];
                      const matchingWo = (workOrdersList as Array<{ orderId?: string | { _id?: string; id?: string }; checkinPhotos?: string[] }>).find((wo) => {
                        const woOrderId = typeof wo.orderId === 'string' ? wo.orderId : wo.orderId?._id ?? wo.orderId?.id;
                        return woOrderId === orderId;
                      });
                      const checkinPhotos = matchingWo?.checkinPhotos || [];

                      return (
                        <tr key={orderId} className='hover:bg-muted/50 transition-colors'>
                          <td className='px-5 py-4 font-mono text-xs text-muted-foreground'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-semibold text-xs'>
                                {(o.userId?.fullName ?? o.customerName ?? '?')[0]}
                              </div>
                              <span className='font-bold text-foreground'>
                                {o.userId?.fullName ?? o.customerName ?? '-'}
                              </span>
                            </div>
                          </td>
                          <td className='px-5 py-4 text-xs font-mono font-bold text-primary bg-accent rounded px-2 py-0.5 inline-block mt-4'>
                            {o.vehicleId?.licensePlate ?? o.licensePlate ?? '-'}
                          </td>
                          <td className='px-5 py-4 text-muted-foreground font-medium'>
                            {o.serviceTypeId?.name ?? o.serviceName ?? '-'}
                          </td>
                          <td className='px-5 py-4 text-muted-foreground text-xs'>
                            <div className='font-semibold text-foreground'>{o.shiftId?.name ?? '-'}</div>
                            <div className='text-muted-foreground'>{(o.scheduledAt ?? o.bookingDate) ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleDateString('vi-VN') : '-'}</div>
                          </td>
                          <td className='px-5 py-4 font-semibold text-foreground'>
                            {(o.amount ?? o.totalPrice) != null ? `${Number(o.amount ?? o.totalPrice).toLocaleString('vi-VN')}đ` : '-'}
                          </td>
                          <td className='px-5 py-4'>
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className='px-5 py-4'>
                            {isConfirmed ? (
                              <button
                                onClick={() => openCheckIn(o)}
                                className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs transition-all shadow-xs'
                              >
                                <CheckCircle2 className='w-3.5 h-3.5' />
                                Check-in xe
                              </button>
                            ) : isReceived ? (
                              <div className='flex flex-col gap-1.5'>
                                <span className='text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/30 flex items-center gap-1 w-fit'>
                                  <CheckCircle2 className='w-3.5 h-3.5' /> Đã nhận xe
                                </span>
                                {checkinPhotos.length > 0 ? (
                                  <div className='flex gap-1 overflow-x-auto max-w-[150px] py-1 scrollbar-none'>
                                    {checkinPhotos.map((photo, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setPreviewPhoto(photo)}
                                        className='relative w-8 h-8 rounded-lg overflow-hidden border border-border shadow-xs bg-muted/40 cursor-pointer hover:border-primary transition-all shrink-0 group'
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt='Pre-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                                        <div className='absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                          <Eye className='w-2.5 h-2.5 text-white' />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className='text-[10px] text-placeholder italic pl-1'>Chưa có ảnh check-in</span>
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

            {/* Pagination */}
            {total > 10 && (
              <div className='flex items-center justify-between px-5 py-4 border-t border-border bg-muted/40'>
                <span className='text-xs font-semibold text-muted-foreground'>
                  Trang {page} / {Math.ceil(total / 10)}
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-emerald-300 transition-all text-muted-foreground bg-card'
                  >Trước</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-emerald-300 transition-all text-muted-foreground bg-card'
                  >Sau</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── MODAL: Check-in xe kèm ảnh hiện trạng ── */}
      {checkInTarget && (() => {
        const oid = checkInTarget._id ?? checkInTarget.id ?? '';
        const plate = checkInTarget.vehicleId?.licensePlate ?? checkInTarget.licensePlate ?? '-';
        return (
          <div
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => !checkInMutation.isPending && setCheckInTarget(null)}
          >
            <div
              className='bg-card rounded-xl border border-border shadow-2xl p-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3 text-success'>
                  <div className='w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center'>
                    <Camera className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-heading font-semibold text-foreground text-base'>
                      Check-in xe
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Xe <span className='font-mono font-bold'>{plate}</span> · chụp tình
                      trạng trầy xước/móp méo khi nhận xe
                    </p>
                  </div>
                </div>
                <button onClick={() => !checkInMutation.isPending && setCheckInTarget(null)} aria-label='Đóng'>
                  <X className='w-5 h-5 text-placeholder' />
                </button>
              </div>

              <div className='grid grid-cols-4 gap-3'>
                {checkInPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className='group relative aspect-square rounded-xl overflow-hidden border border-border shadow-xs bg-muted/40'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt='Hiện trạng xe' className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setPreviewPhoto(photo)}
                        className='w-7 h-7 bg-white/90 hover:bg-card text-foreground rounded-lg flex items-center justify-center'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => setCheckInPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className='w-7 h-7 bg-destructive hover:bg-destructive text-white rounded-lg flex items-center justify-center'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
                <label className='aspect-square rounded-xl border border-dashed border-border hover:border-success bg-muted/40 hover:bg-success/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all'>
                  <Plus className='w-5 h-5 text-placeholder' />
                  <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                    Chụp/Thêm
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

              {checkInPhotos.length === 0 && (
                <p className='text-xs text-muted-foreground italic mt-3 text-center'>
                  Chưa có ảnh. Bấm ô &quot;Chụp/Thêm&quot; để chụp ảnh hiện trạng xe trước khi check-in.
                </p>
              )}

              <div className='mt-5 flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-xl p-3'>
                <AlertCircle className='w-3.5 h-3.5 shrink-0 text-success' />
                Ảnh hiện trạng sẽ được lưu vào phiếu rửa để thợ đối chiếu. Ảnh sau khi
                rửa do thợ chụp lúc hoàn thành.
              </div>

              <div className='mt-5 flex justify-end gap-2'>
                <button
                  onClick={() => setCheckInTarget(null)}
                  disabled={checkInMutation.isPending}
                  className='px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 font-bold text-xs'
                >
                  Hủy
                </button>
                <button
                  onClick={() => checkInMutation.mutate({ orderId: oid, photos: checkInPhotos })}
                  disabled={checkInMutation.isPending || isUploading}
                  className='flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs'
                >
                  <CheckCircle2 className='w-3.5 h-3.5' />
                  {checkInMutation.isPending ? 'Đang check-in...' : 'Xác nhận check-in'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox xem ảnh phóng to */}
      {previewPhoto && (
        <div
          className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4'
          onClick={() => setPreviewPhoto(null)}
        >
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt='Xem ảnh'
              className='rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/10'
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className='absolute top-3 right-3 bg-black/50 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl'
            >
              Đóng (Esc)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
