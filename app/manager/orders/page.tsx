'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminCreateWorkOrder, adminUpdateOrderStatus } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, X } from 'lucide-react';
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
  note?: string;
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

export default function ManagerOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['manager-orders', page, statusFilter],
    queryFn: () => adminGetOrders({
      page, limit: 10,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
  });

  // Mutation check-in khách hàng
  const checkInMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // 1. Tạo Work Order (Check-in)
      await adminCreateWorkOrder(orderId);
      // 2. Tự động chuyển trạng thái Order sang checked_in
      await adminUpdateOrderStatus(orderId, 'checked_in');
    },
    onSuccess: () => {
      toast.success('Check-in khách hàng thành công! Đã tạo phiếu rửa xe.');
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
      qc.invalidateQueries({ queryKey: ['manager-dashboard-workorders'] });
    },
    onError: (err) => {
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
      <AdminTopbar title='Quản lý Đặt lịch' subtitle='Xem lịch hẹn của khách hàng và thực hiện Check-in tại quầy' />
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
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all shadow-sm'
              />
            </div>

            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer shadow-sm text-slate-700'
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
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold hover:border-indigo-300 transition-all shadow-sm text-slate-600'
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <span className='ml-auto text-xs font-semibold text-slate-500'>
              Tổng: {total} đơn đặt lịch
            </span>
          </div>

          {/* Table */}
          <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-slate-600'>
                <thead>
                  <tr className='bg-slate-50/50 border-b border-slate-100'>
                    {['ID', 'Khách hàng', 'Biển số', 'Dịch vụ', 'Giờ hẹn', 'Ngày hẹn', 'Số tiền', 'Trạng thái', 'Chi tiết'].map((h) => (
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
                        Không có dữ liệu đơn đặt lịch nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o: OrderData) => {
                      const s = statusConfig[o.status ?? ''] ?? { label: o.status, cls: 'bg-slate-100 text-slate-500' };
                      
                      const orderId = o._id ?? o.id ?? '';
                      const isConfirmed = o.status === 'confirmed';

                      const formattedTime = (o.scheduledAt ?? o.bookingDate)
                        ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '-';
                      const formattedDate = (o.scheduledAt ?? o.bookingDate)
                        ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleDateString('vi-VN')
                        : '-';

                      return (
                        <tr key={orderId} className='hover:bg-slate-50/20 transition-colors'>
                          <td className='px-5 py-4 font-mono text-xs text-slate-500'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs'>
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
                          <td className='px-5 py-4 text-slate-700 font-bold'>
                            {formattedTime}
                          </td>
                          <td className='px-5 py-4 text-slate-500 text-xs'>
                            {formattedDate}
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
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-bold text-xs transition-all shadow-sm bg-white'
                            >
                              Xem chi tiết
                            </button>
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
                    className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:border-indigo-300 transition-all text-slate-600 bg-white'
                  >Trước</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:border-indigo-300 transition-all text-slate-600 bg-white'
                  >Sau</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {selectedOrder && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setSelectedOrder(null)}>
          <div className='bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
              <h3 className='font-heading font-black text-slate-800 text-lg'>Chi tiết lịch đặt xe</h3>
              <button onClick={() => setSelectedOrder(null)}>
                <X className='w-5 h-5 text-slate-500 hover:text-slate-600' />
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Mã đơn</p>
                <p className='font-mono font-bold text-slate-700 mt-0.5'>{(selectedOrder._id ?? selectedOrder.id ?? '').toUpperCase()}</p>
              </div>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Trạng thái</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold mt-1 ${statusConfig[selectedOrder.status ?? '']?.cls ?? 'bg-slate-100 text-slate-500'}`}>
                  {statusConfig[selectedOrder.status ?? '']?.label ?? selectedOrder.status}
                </span>
              </div>
              
              <div className='col-span-2 border-t border-slate-100 pt-3'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Khách hàng</p>
                <p className='font-bold text-slate-800 mt-0.5'>{selectedOrder.userId?.fullName ?? selectedOrder.customerName ?? '-'}</p>
              </div>

              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Biển số xe</p>
                <p className='font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mt-1'>
                  {selectedOrder.vehicleId?.licensePlate ?? selectedOrder.licensePlate ?? '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Dịch vụ</p>
                <p className='font-semibold text-slate-700 mt-1'>{selectedOrder.serviceTypeId?.name ?? selectedOrder.serviceName ?? '-'}</p>
              </div>

              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Giờ hẹn</p>
                <p className='font-bold text-slate-700 mt-0.5'>
                  {(selectedOrder.scheduledAt ?? selectedOrder.bookingDate) ? new Date((selectedOrder.scheduledAt ?? selectedOrder.bookingDate) as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Ngày hẹn</p>
                <p className='font-semibold text-slate-600 mt-0.5'>
                  {(selectedOrder.scheduledAt ?? selectedOrder.bookingDate) ? new Date((selectedOrder.scheduledAt ?? selectedOrder.bookingDate) as string).toLocaleDateString('vi-VN') : '-'}
                </p>
              </div>

              <div className='col-span-2 border-t border-slate-100 pt-3'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Tổng số tiền</p>
                <p className='text-lg font-black text-indigo-600 mt-0.5'>
                  {(selectedOrder.amount ?? selectedOrder.totalPrice) != null ? `${Number(selectedOrder.amount ?? selectedOrder.totalPrice).toLocaleString('vi-VN')}đ` : '-'}
                </p>
              </div>

              {selectedOrder.note && (
                <div className='col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-500 text-xs mt-1'>
                  &quot;{selectedOrder.note}&quot;
                </div>
              )}
            </div>

            <div className='border-t border-slate-100 pt-4 flex justify-end'>
              <button
                onClick={() => setSelectedOrder(null)}
                className='px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
