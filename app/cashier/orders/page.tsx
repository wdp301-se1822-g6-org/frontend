'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminCreateWorkOrder } from '@/lib/admin-api';
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
  completed:       { label: 'Hoàn thành',       cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  in_progress:     { label: 'Đang rửa xe',      cls: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  confirmed:       { label: 'Đã xác nhận',      cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
  checked_in:      { label: 'Đã check-in',      cls: 'bg-sky-50 text-sky-700 border border-sky-100' },
  pending_payment: { label: 'Chờ thanh toán',   cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  cancelled:       { label: 'Đã hủy',           cls: 'bg-rose-50 text-rose-700 border border-rose-100' },
  no_show:         { label: 'Vắng mặt',         cls: 'bg-slate-100 text-slate-600' },
};

const statusOptions = ['all', 'pending_payment', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function CashierOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Check-in kèm ảnh hiện trạng: upload qua API rồi gửi kèm khi tạo Work Order
  // (BE lưu vào checkinPhotos, hiển thị lại ở trang QC). Không dùng localStorage.
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
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-7xl mx-auto'>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3 mb-6'>
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
              <input
                type='text'
                placeholder='Tìm kiếm đơn đặt lịch...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-all shadow-sm'
              />
            </div>

            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer shadow-sm text-slate-700'
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'Tất cả trạng thái' : statusConfig[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none' />
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold hover:border-emerald-300 transition-all shadow-sm text-slate-600'
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <span className='ml-auto text-xs font-semibold text-slate-500'>
              Tổng: {total} lịch hẹn
            </span>
          </div>

          {/* Table */}
          <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-slate-600'>
                <thead>
                  <tr className='bg-slate-50/50 border-b border-slate-100'>
                    {['ID', 'Khách hàng', 'Biển số', 'Dịch vụ', 'Ca / Ngày hẹn', 'Số tiền', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className='text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className='px-5 py-4'>
                            <div className='h-4 bg-slate-100 animate-pulse rounded-lg' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='px-5 py-16 text-center text-slate-500 font-semibold'>
                        Không tìm thấy lịch hẹn nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o: OrderData) => {
                      const s = statusConfig[o.status ?? ''] ?? { label: o.status, cls: 'bg-slate-100 text-slate-500' };
                      const orderId = o._id ?? o.id ?? '';
                      const isConfirmed = o.status === 'confirmed';
                      const isReceived = o.status === 'checked_in' || o.status === 'in_progress' || o.status === 'completed';

                      return (
                        <tr key={orderId} className='hover:bg-slate-50/20 transition-colors'>
                          <td className='px-5 py-4 font-mono text-xs text-slate-500'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs'>
                                {(o.userId?.fullName ?? o.customerName ?? '?')[0]}
                              </div>
                              <span className='font-bold text-slate-800'>
                                {o.userId?.fullName ?? o.customerName ?? '-'}
                              </span>
                            </div>
                          </td>
                          <td className='px-5 py-4 text-xs font-mono font-bold text-indigo-600 bg-indigo-50/30 rounded px-2 py-0.5 inline-block mt-4'>
                            {o.vehicleId?.licensePlate ?? o.licensePlate ?? '-'}
                          </td>
                          <td className='px-5 py-4 text-slate-600 font-medium'>
                            {o.serviceTypeId?.name ?? o.serviceName ?? '-'}
                          </td>
                          <td className='px-5 py-4 text-slate-500 text-xs'>
                            <div className='font-semibold text-slate-700'>{o.shiftId?.name ?? '-'}</div>
                            <div className='text-slate-500'>{(o.scheduledAt ?? o.bookingDate) ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleDateString('vi-VN') : '-'}</div>
                          </td>
                          <td className='px-5 py-4 font-black text-slate-800'>
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
                                className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm'
                              >
                                <CheckCircle2 className='w-3.5 h-3.5' />
                                Check-in xe
                              </button>
                            ) : isReceived ? (
                              <span className='text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 w-fit'>
                                <CheckCircle2 className='w-3.5 h-3.5' /> Đã nhận xe
                              </span>
                            ) : (
                              <span className='text-xs font-medium text-slate-500 flex items-center gap-1 italic'>
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
              <div className='flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/20'>
                <span className='text-xs font-semibold text-slate-500'>
                  Trang {page} / {Math.ceil(total / 10)}
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:border-emerald-300 transition-all text-slate-600 bg-white'
                  >Trước</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:border-emerald-300 transition-all text-slate-600 bg-white'
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
            className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => !checkInMutation.isPending && setCheckInTarget(null)}
          >
            <div
              className='bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3 text-emerald-600'>
                  <div className='w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center'>
                    <Camera className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-heading font-black text-slate-800 text-base'>
                      Check-in xe
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Xe <span className='font-mono font-bold'>{plate}</span> · chụp tình
                      trạng trầy xước/móp méo khi nhận xe
                    </p>
                  </div>
                </div>
                <button onClick={() => !checkInMutation.isPending && setCheckInTarget(null)} aria-label='Đóng'>
                  <X className='w-5 h-5 text-slate-400' />
                </button>
              </div>

              <div className='grid grid-cols-4 gap-3'>
                {checkInPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt='Hiện trạng xe' className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setPreviewPhoto(photo)}
                        className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-lg flex items-center justify-center'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => setCheckInPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className='w-7 h-7 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
                <label className='aspect-square rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all'>
                  <Plus className='w-5 h-5 text-slate-400' />
                  <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
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
                <p className='text-xs text-slate-500 italic mt-3 text-center'>
                  Chưa có ảnh. Bấm ô "Chụp/Thêm" để chụp ảnh hiện trạng xe trước khi check-in.
                </p>
              )}

              <div className='mt-5 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3'>
                <AlertCircle className='w-3.5 h-3.5 shrink-0 text-emerald-500' />
                Ảnh hiện trạng sẽ được lưu vào phiếu rửa và hiển thị lại khi QC. Ảnh sau khi
                rửa do thợ rửa chụp lúc hoàn thành.
              </div>

              <div className='mt-5 flex justify-end gap-2'>
                <button
                  onClick={() => setCheckInTarget(null)}
                  disabled={checkInMutation.isPending}
                  className='px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-bold text-xs'
                >
                  Hủy
                </button>
                <button
                  onClick={() => checkInMutation.mutate({ orderId: oid, photos: checkInPhotos })}
                  disabled={checkInMutation.isPending || isUploading}
                  className='flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm'
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
          className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4'
          onClick={() => setPreviewPhoto(null)}
        >
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt='Xem ảnh'
              className='rounded-2xl max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/10'
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
