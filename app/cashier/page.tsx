'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminMarkOrderPaid, adminUpdateOrderStatus, adminCreateWorkOrder } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  CreditCard, Search, RefreshCw, CheckCircle2,
  DollarSign, QrCode, AlertCircle, ShoppingBag,
  Camera, Plus, Trash2, Eye, X
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';

interface OrderData {
  _id: string;
  id?: string;
  userId?: { fullName?: string; email?: string };
  customerName?: string;
  customerEmail?: string;
  vehicleId?: { licensePlate?: string };
  licensePlate?: string;
  serviceTypeId?: { name?: string };
  serviceName?: string;
  amount?: number | string;
  totalPrice?: number | string;
  status?: string;
  isPaid?: boolean;
  scheduledAt?: string;
  bookingDate?: string;
  [key: string]: unknown;
}

export default function CashierPOSPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  
  // States cho Dialog thanh toán
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<OrderData | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'qr'>('cash');

  // Thêm quản lý ảnh check-in khi thu tiền tại quầy
  const [checkInPhotos, setCheckInPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const handleUploadCheckIn = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const { uploadImages } = await import('@/lib/upload-api');
      const res = await uploadImages(files);
      const urls = res.data.urls;
      setCheckInPhotos((prev) => [...prev, ...urls]);
      toast.success(`Đã tải lên ${urls.length} ảnh hiện trạng.`, { id: toastId });
    } catch (err: unknown) {
      console.error('Upload ảnh check-in thất bại:', err);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Đơn tiền mặt chờ thu tại quầy: BE tạo đơn CASH ở trạng thái CONFIRMED +
  // payment_status=unpaid (xem payment-method.enum). Đơn ONLINE chưa trả là
  // pending_payment và do PayOS webhook xử lý, không thuộc quầy thu ngân.
  const { data: ordersRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cashier-pending-orders'],
    queryFn: () =>
      adminGetOrders({
        status: 'confirmed',
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        limit: 100,
      }),
  });

  const orders: OrderData[] = ordersRes?.data?.data ?? ordersRes?.data ?? [];

  // Mutation xử lý thanh toán + check-in luôn (thu tiền là nhận xe vào bãi)
  const payMutation = useMutation({
    mutationFn: async ({ orderId, photos }: { orderId: string; photos: string[] }) => {
      // 1. Đánh dấu đã thanh toán
      await adminMarkOrderPaid(orderId);
      // 2. Tạo phiếu rửa xe (check-in) kèm ảnh hiện trạng xe
      await adminCreateWorkOrder(orderId, photos);
      // 3. Chuyển trạng thái đơn hàng sang checked_in (đã nhận xe)
      await adminUpdateOrderStatus(orderId, 'checked_in');
    },
    onSuccess: () => {
      toast.success('Đã thu tiền & check-in! Phiếu rửa xe đã được tạo, xe vào bãi.');
      setIsPayOpen(false);
      setPayTarget(null);
      setCheckInPhotos([]);
      qc.invalidateQueries({ queryKey: ['cashier-pending-orders'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gặp sự cố khi thanh toán.';
      toast.error(`Thanh toán thất bại: ${errMsg}`);
    }
  });

  const filtered = orders.filter((o: OrderData) => {
    const customer = o.userId?.fullName ?? o.customerName ?? '';
    const plate = o.vehicleId?.licensePlate ?? o.licensePlate ?? '';
    const term = search.toLowerCase();
    return customer.toLowerCase().includes(term) || plate.toLowerCase().includes(term);
  });

  // Phân trang phía client cho danh sách chờ thu.
  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = useMemo(
    () => filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filtered, safePage],
  );

  const handleOpenPay = (order: OrderData) => {
    setPayTarget(order);
    setIsPayOpen(true);
    setCheckInPhotos([]);
  };

  return (
    <>
      <AdminTopbar title='Quầy Thu Ngân (POS)' subtitle='Tiếp nhận thanh toán trực tiếp tại quầy nhanh chóng' />
      <main className='flex-1 p-8 overflow-y-auto bg-background flex flex-col lg:flex-row gap-8'>

        {/* Main Area: Pending Orders list */}
        <div className='flex-1 flex flex-col gap-6'>
          {/* Filter Bar */}
          <div className='flex gap-3 items-center'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Tìm khách hàng hoặc biển số xe...'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className='w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
              />
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium bg-card text-foreground hover:bg-muted transition-colors'
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Table list */}
          <div className='bg-card rounded-xl border border-border shadow-xs overflow-hidden flex-1'>
            <div className='overflow-x-auto h-full max-h-[calc(100vh-270px)]'>
              <table className='w-full text-sm'>
                <thead className='sticky top-0 bg-muted/50 border-b border-border z-10'>
                  <tr>
                    {['Mã đơn', 'Khách hàng', 'Biển số xe', 'Gói dịch vụ', 'Số tiền cần thu', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className='text-left px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className='px-5 py-4.5'>
                            <div className='h-4 bg-muted animate-pulse rounded-md' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='px-5 py-24 text-center text-muted-foreground'>
                        <div className='w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4 text-placeholder'>
                          <ShoppingBag className='w-6 h-6' />
                        </div>
                        Chưa có đơn nào chờ thanh toán tại quầy. Đơn tiền mặt
                        mới sẽ hiện ở đây.
                      </td>
                    </tr>
                  ) : (
                    pagedOrders.map((o: OrderData) => {
                      const orderId = o._id ?? o.id;
                      const amount = o.amount ?? o.totalPrice ?? 0;
                      return (
                        <tr key={orderId} className='hover:bg-muted/40 transition-colors'>
                          <td className='px-5 py-4.5 font-mono text-xs text-muted-foreground'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4.5'>
                            <div className='font-semibold text-foreground'>{o.userId?.fullName ?? o.customerName ?? '-'}</div>
                            <div className='text-muted-foreground text-xs'>{o.userId?.email ?? o.customerEmail ?? '-'}</div>
                          </td>
                          <td className='px-5 py-4.5'>
                            <span className='font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded text-xs'>
                              {o.vehicleId?.licensePlate ?? o.licensePlate ?? '-'}
                            </span>
                          </td>
                          <td className='px-5 py-4.5 text-foreground'>
                            {o.serviceTypeId?.name ?? o.serviceName ?? '-'}
                          </td>
                          <td className='px-5 py-4.5 font-bold text-foreground text-base tabular-nums'>
                            {Number(amount).toLocaleString('vi-VN')}đ
                          </td>
                          <td className='px-5 py-4.5'>
                            <StatusBadge label='Chờ thanh toán' tone='warning' />
                          </td>
                          <td className='px-5 py-4.5'>
                            <button
                              onClick={() => handleOpenPay(o)}
                              className='flex items-center gap-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors'
                            >
                              <CreditCard className='w-3.5 h-3.5' />
                              Thu tiền
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {/* Sidebar: POS statistics */}
        <div className='w-full lg:w-80 flex flex-col gap-6 shrink-0'>
          <div className='bg-card rounded-xl border border-border p-6 shadow-xs flex flex-col gap-5'>
            <h3 className='font-heading font-semibold tracking-tight text-foreground text-base border-b border-border pb-3'>Thống kê quầy thu ngân</h3>

            <div className='flex flex-col gap-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Chờ thu tiền</span>
                <span className='font-semibold text-foreground text-base tabular-nums'>{orders.length} đơn</span>
              </div>

              <div className='flex justify-between items-center border-t border-border pt-4'>
                <span className='text-sm text-muted-foreground'>Tổng số tiền chờ thu</span>
                <span className='font-bold text-foreground text-lg tabular-nums'>
                  {orders.reduce((sum, o) => sum + Number(o.amount ?? o.totalPrice ?? 0), 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className='mt-2 bg-accent border border-primary/20 p-4 rounded-lg flex items-start gap-3 text-xs'>
              <AlertCircle className='w-4 h-4 text-primary shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold text-accent-foreground'>Hướng dẫn POS</p>
                <p className='text-muted-foreground mt-1 leading-relaxed'>
                  Khi khách thanh toán tại quầy (tiền mặt / chuyển khoản), bấm <b>Thu tiền</b> để hoàn tất hóa đơn và cho xe vào bãi rửa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── DIALOG: Hóa đơn & Phương thức thanh toán ── */}
      {isPayOpen && payTarget && (
        <div className='fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-card rounded-xl border border-border shadow-lg p-6 max-w-md w-full motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150'>
            <div className='flex items-center gap-3 mb-5'>
              <div className='w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                <CreditCard className='w-5 h-5' />
              </div>
              <div>
                <h3 className='font-heading font-semibold tracking-tight text-foreground text-base'>Thu tiền hóa đơn</h3>
                <p className='text-xs text-muted-foreground'>Xác nhận thanh toán cho khách hàng {payTarget.userId?.fullName ?? payTarget.customerName}</p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className='bg-muted/50 border border-border rounded-lg p-4 mb-5 flex flex-col gap-2.5 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Biển số xe</span>
                <span className='font-mono font-semibold text-foreground'>{payTarget.vehicleId?.licensePlate ?? payTarget.licensePlate}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Dịch vụ rửa xe</span>
                <span className='font-medium text-foreground'>{payTarget.serviceTypeId?.name ?? payTarget.serviceName}</span>
              </div>
              <div className='border-t border-border my-1' />
              <div className='flex justify-between items-baseline'>
                <span className='font-semibold text-foreground'>Tổng tiền cần thu</span>
                <span className='font-bold text-lg text-foreground tabular-nums'>
                  {Number(payTarget.amount ?? payTarget.totalPrice ?? 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* Payment Method Option */}
            <div className='mb-6'>
              <label className='block text-xs font-medium text-muted-foreground mb-3'>Phương thức thanh toán trực tiếp</label>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => setPayMethod('cash')}
                  className={`py-4 rounded-lg border flex flex-col items-center gap-1.5 transition-colors ${
                    payMethod === 'cash'
                      ? 'border-primary bg-accent ring-1 ring-primary text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <DollarSign className={`w-5 h-5 ${payMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className='text-xs font-semibold'>Tiền mặt</span>
                </button>
                <button
                  type='button'
                  onClick={() => setPayMethod('qr')}
                  className={`py-4 rounded-lg border flex flex-col items-center gap-1.5 transition-colors ${
                    payMethod === 'qr'
                      ? 'border-primary bg-accent ring-1 ring-primary text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <QrCode className={`w-5 h-5 ${payMethod === 'qr' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className='text-xs font-semibold'>Chuyển khoản QR</span>
                </button>
              </div>
            </div>

            {/* Thêm phần Chụp ảnh hiện trạng xe khi Check-in */}
            <div className='mb-6'>
              <label className='text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5'>
                <Camera className='w-4 h-4' />
                Ảnh hiện trạng xe trước khi rửa (không bắt buộc)
              </label>

              <div className='grid grid-cols-4 gap-3'>
                {checkInPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className='group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt='Hiện trạng xe' className='w-full h-full object-cover' />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setPreviewPhoto(photo)}
                        className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-md flex items-center justify-center'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => setCheckInPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className='w-7 h-7 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-md flex items-center justify-center'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}

                <label className='aspect-square rounded-lg border border-dashed border-border hover:border-primary bg-muted/40 hover:bg-accent cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors'>
                  <Plus className='w-5 h-5 text-muted-foreground' />
                  <span className='text-[10px] font-medium text-muted-foreground'>
                    Chụp/Thêm
                  </span>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    capture='environment'
                    className='hidden'
                    disabled={isUploading || payMutation.isPending}
                    onChange={(e) => handleUploadCheckIn(e.target.files)}
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => { setIsPayOpen(false); setPayTarget(null); }}
                className='px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors'
              >
                Hủy bỏ
              </button>
              <button
                disabled={payMutation.isPending || isUploading}
                onClick={() => payMutation.mutate({ orderId: payTarget._id ?? payTarget.id ?? '', photos: checkInPhotos })}
                className='px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-xs transition-colors flex items-center gap-1.5'
              >
                <CheckCircle2 className='w-4 h-4' />
                Xác nhận thu tiền & check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox xem ảnh phóng to */}
      {previewPhoto && (
        <div
          className='fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4'
          onClick={() => setPreviewPhoto(null)}
        >
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt='Xem ảnh'
              className='max-w-full max-h-[80vh] object-contain rounded-xl'
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className='absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
