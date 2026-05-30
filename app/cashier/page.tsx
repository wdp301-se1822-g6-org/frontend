'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminMarkOrderPaid, adminUpdateOrderStatus } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CreditCard, Search, RefreshCw, CheckCircle2,
  DollarSign, QrCode, AlertCircle, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Mutation xử lý thanh toán
  const payMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // 1. Đánh dấu đã thanh toán
      await adminMarkOrderPaid(orderId);
      // 2. Chuyển trạng thái đơn hàng sang confirmed
      await adminUpdateOrderStatus(orderId, 'confirmed');
    },
    onSuccess: () => {
      toast.success('Hóa đơn đã được thanh toán thành công!');
      setIsPayOpen(false);
      setPayTarget(null);
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

  const handleOpenPay = (order: OrderData) => {
    setPayTarget(order);
    setIsPayOpen(true);
  };

  return (
    <>
      <AdminTopbar title='Quầy Thu Ngân (POS)' subtitle='Tiếp nhận thanh toán trực tiếp tại quầy nhanh chóng' />
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50 flex flex-col lg:flex-row gap-8'>
        
        {/* Main Area: Pending Orders list */}
        <div className='flex-1 flex flex-col gap-6'>
          {/* Filter Bar */}
          <div className='flex gap-3 items-center'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
              <input
                type='text'
                placeholder='Tìm khách hàng hoặc biển số xe để thanh toán...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-all shadow-sm'
              />
            </div>
            
            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-600 hover:border-slate-300 transition-all shadow-sm'
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Table list */}
          <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1'>
            <div className='overflow-x-auto h-full max-h-[calc(100vh-270px)]'>
              <table className='w-full text-sm text-slate-600'>
                <thead className='sticky top-0 bg-slate-50 border-b border-slate-100 z-10'>
                  <tr>
                    {['Mã đơn', 'Khách hàng', 'Biển số xe', 'Gói dịch vụ', 'Số tiền cần thu', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} className='text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className='px-5 py-4.5'>
                            <div className='h-4 bg-slate-100 animate-pulse rounded-lg' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='px-5 py-24 text-center text-slate-500 font-semibold'>
                        <div className='w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300'>
                          <ShoppingBag className='w-6 h-6' />
                        </div>
                        Không có đơn hàng nào chờ thanh toán tại quầy.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o: OrderData) => {
                      const orderId = o._id ?? o.id;
                      const amount = o.amount ?? o.totalPrice ?? 0;
                      return (
                        <tr key={orderId} className='hover:bg-slate-50/20 transition-colors'>
                          <td className='px-5 py-4.5 font-mono text-xs text-slate-500'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4.5'>
                            <div className='font-bold text-slate-800'>{o.userId?.fullName ?? o.customerName ?? '—'}</div>
                            <div className='text-slate-500 text-xs'>{o.userId?.email ?? o.customerEmail ?? '—'}</div>
                          </td>
                          <td className='px-5 py-4.5'>
                            <span className='font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs'>
                              {o.vehicleId?.licensePlate ?? o.licensePlate ?? '—'}
                            </span>
                          </td>
                          <td className='px-5 py-4.5 text-slate-600 font-medium'>
                            {o.serviceTypeId?.name ?? o.serviceName ?? '—'}
                          </td>
                          <td className='px-5 py-4.5 font-black text-slate-900 text-base'>
                            {Number(amount).toLocaleString('vi-VN')}đ
                          </td>
                          <td className='px-5 py-4.5'>
                            <span className='inline-flex px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100'>
                              Chờ thanh toán
                            </span>
                          </td>
                          <td className='px-5 py-4.5'>
                            <button
                              onClick={() => handleOpenPay(o)}
                              className='flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/10'
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
        </div>

        {/* Sidebar: POS statistics */}
        <div className='w-full lg:w-80 flex flex-col gap-6 shrink-0'>
          <div className='bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5'>
            <h3 className='font-heading font-black text-slate-800 text-base border-b border-slate-100 pb-3'>Thống kê quầy thu ngân</h3>
            
            <div className='flex flex-col gap-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-slate-500 font-medium'>Chờ thu tiền</span>
                <span className='font-bold text-slate-800 text-base'>{orders.length} đơn</span>
              </div>
              
              <div className='flex justify-between items-center border-t border-slate-100 pt-4'>
                <span className='text-sm text-slate-500 font-medium'>Tổng số tiền chờ thu</span>
                <span className='font-black text-indigo-600 text-lg'>
                  {orders.reduce((sum, o) => sum + Number(o.amount ?? o.totalPrice ?? 0), 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
            
            <div className='mt-2 bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-800'>
              <AlertCircle className='w-4 h-4 text-emerald-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-bold'>Hướng dẫn POS:</p>
                <p className='text-slate-500 mt-1 leading-relaxed'>
                  Khi khách hàng thanh toán tại quầy (tiền mặt / chuyển khoản), click nút <b>Thu tiền</b> để hoàn tất hóa đơn và duyệt xe vào bãi rửa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── DIALOG: Hóa đơn & Phương thức thanh toán ── */}
      {isPayOpen && payTarget && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150'>
            <div className='flex items-center gap-3 mb-5 text-emerald-600'>
              <div className='w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center'>
                <CreditCard className='w-5 h-5' />
              </div>
              <div>
                <h3 className='font-heading font-black text-slate-800 text-base'>Thu tiền hóa đơn</h3>
                <p className='text-xs text-slate-500'>Xác nhận thanh toán cho khách hàng {payTarget.userId?.fullName ?? payTarget.customerName}</p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 flex flex-col gap-2.5 text-sm'>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Biển số xe:</span>
                <span className='font-mono font-bold text-slate-800'>{payTarget.vehicleId?.licensePlate ?? payTarget.licensePlate}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Dịch vụ rửa xe:</span>
                <span className='font-semibold text-slate-800'>{payTarget.serviceTypeId?.name ?? payTarget.serviceName}</span>
              </div>
              <div className='border-t border-slate-200/60 my-1' />
              <div className='flex justify-between items-baseline'>
                <span className='font-bold text-slate-800'>Tổng tiền cần thu:</span>
                <span className='font-black text-lg text-emerald-600'>
                  {Number(payTarget.amount ?? payTarget.totalPrice ?? 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* Payment Method Option */}
            <div className='mb-6'>
              <label className='block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider'>Phương thức thanh toán trực tiếp</label>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => setPayMethod('cash')}
                  className={`py-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all font-bold ${
                    payMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50/50'
                  }`}
                >
                  <DollarSign className='w-5 h-5 text-emerald-500' />
                  <span className='text-xs'>TIỀN MẶT</span>
                </button>
                <button
                  type='button'
                  onClick={() => setPayMethod('qr')}
                  className={`py-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all font-bold ${
                    payMethod === 'qr'
                      ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50/50'
                  }`}
                >
                  <QrCode className='w-5 h-5 text-emerald-500' />
                  <span className='text-xs'>CHUYỂN KHOẢN QR</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => { setIsPayOpen(false); setPayTarget(null); }}
                className='px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all'
              >
                Hủy bỏ
              </button>
              <button
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(payTarget._id ?? payTarget.id ?? '')}
                className='px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5'
              >
                <CheckCircle2 className='w-4 h-4' />
                Xác nhận đã thu tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
