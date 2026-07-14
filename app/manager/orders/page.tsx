'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders } from '@/lib/admin-api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, RefreshCw, ChevronDown, X } from 'lucide-react';

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
  completed:       { label: 'Hoàn thành',       cls: 'bg-primary/10 text-primary border border-primary/20' },
  in_progress:     { label: 'Đang rửa xe',      cls: 'bg-primary/10 text-primary border border-primary/20 font-semibold' },
  confirmed:       { label: 'Đã xác nhận',      cls: 'bg-primary/10 text-primary border border-primary/20' },
  checked_in:      { label: 'Đã check-in',      cls: 'bg-primary/10 text-primary border border-primary/20' },
  pending_payment: { label: 'Chờ thanh toán',   cls: 'bg-muted text-muted-foreground border border-border' },
  cancelled:       { label: 'Đã hủy',           cls: 'bg-destructive/10 text-destructive border border-destructive/20' },
  no_show:         { label: 'Vắng mặt',         cls: 'bg-muted text-muted-foreground border border-border' },
};

const statusOptions = ['all', 'pending_payment', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function ManagerOrdersPage() {
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

  const orders: OrderData[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? orders.length;

  const filtered = search
    ? orders.filter((o: OrderData) =>
        JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <>
      <AdminTopbar title='Quản lý Đặt lịch' subtitle='Xem lịch hẹn của khách hàng và thực hiện Check-in tại quầy' />
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
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary/50 transition-all shadow-xs'
              />
            </div>

            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer shadow-xs text-foreground'
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
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:border-primary transition-all shadow-xs text-muted-foreground'
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <span className='ml-auto text-xs font-semibold text-muted-foreground'>
              Tổng: {total} đơn đặt lịch
            </span>
          </div>

          {/* Table */}
          <div className='bg-card rounded-xl border border-border shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-muted-foreground'>
                <thead>
                  <tr className='bg-muted/40 border-b border-border'>
                    {['ID', 'Khách hàng', 'Biển số', 'Dịch vụ', 'Giờ hẹn', 'Ngày hẹn', 'Số tiền', 'Trạng thái', 'Chi tiết'].map((h) => (
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
                        Không có dữ liệu đơn đặt lịch nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o: OrderData) => {
                      const s = statusConfig[o.status ?? ''] ?? { label: o.status, cls: 'bg-muted text-muted-foreground' };
                      
                      const orderId = o._id ?? o.id ?? '';

                      const formattedTime = (o.scheduledAt ?? o.bookingDate)
                        ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '-';
                      const formattedDate = (o.scheduledAt ?? o.bookingDate)
                        ? new Date((o.scheduledAt ?? o.bookingDate) as string).toLocaleDateString('vi-VN')
                        : '-';

                      return (
                        <tr key={orderId} className='hover:bg-muted/50 transition-colors'>
                          <td className='px-5 py-4 font-mono text-xs text-muted-foreground'>
                            {orderId.slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-semibold text-xs'>
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
                          <td className='px-5 py-4 text-foreground font-bold'>
                            {formattedTime}
                          </td>
                          <td className='px-5 py-4 text-muted-foreground text-xs'>
                            {formattedDate}
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
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary text-muted-foreground hover:text-primary font-bold text-xs transition-all shadow-xs bg-card'
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
              <div className='flex items-center justify-between px-5 py-4 border-t border-border bg-muted/40'>
                <span className='text-xs font-semibold text-muted-foreground'>
                  Trang {page} / {Math.ceil(total / 10)}
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary transition-all text-muted-foreground bg-card'
                  >Trước</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary transition-all text-muted-foreground bg-card'
                  >Sau</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {selectedOrder && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setSelectedOrder(null)}>
          <div className='bg-card rounded-xl p-6 w-full max-w-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between pb-3 border-b border-border'>
              <h3 className='font-heading font-semibold text-foreground text-lg'>Chi tiết lịch đặt xe</h3>
              <button onClick={() => setSelectedOrder(null)}>
                <X className='w-5 h-5 text-muted-foreground hover:text-muted-foreground' />
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Mã đơn</p>
                <p className='font-mono font-bold text-foreground mt-0.5'>{(selectedOrder._id ?? selectedOrder.id ?? '').toUpperCase()}</p>
              </div>
              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Trạng thái</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold mt-1 ${statusConfig[selectedOrder.status ?? '']?.cls ?? 'bg-muted text-muted-foreground'}`}>
                  {statusConfig[selectedOrder.status ?? '']?.label ?? selectedOrder.status}
                </span>
              </div>
              
              <div className='col-span-2 border-t border-border pt-3'>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Khách hàng</p>
                <p className='font-bold text-foreground mt-0.5'>{selectedOrder.userId?.fullName ?? selectedOrder.customerName ?? '-'}</p>
              </div>

              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Biển số xe</p>
                <p className='font-mono font-bold text-primary bg-accent px-2 py-0.5 rounded w-fit mt-1'>
                  {selectedOrder.vehicleId?.licensePlate ?? selectedOrder.licensePlate ?? '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Dịch vụ</p>
                <p className='font-semibold text-foreground mt-1'>{selectedOrder.serviceTypeId?.name ?? selectedOrder.serviceName ?? '-'}</p>
              </div>

              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Giờ hẹn</p>
                <p className='font-bold text-foreground mt-0.5'>
                  {(selectedOrder.scheduledAt ?? selectedOrder.bookingDate) ? new Date((selectedOrder.scheduledAt ?? selectedOrder.bookingDate) as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Ngày hẹn</p>
                <p className='font-semibold text-muted-foreground mt-0.5'>
                  {(selectedOrder.scheduledAt ?? selectedOrder.bookingDate) ? new Date((selectedOrder.scheduledAt ?? selectedOrder.bookingDate) as string).toLocaleDateString('vi-VN') : '-'}
                </p>
              </div>

              <div className='col-span-2 border-t border-border pt-3'>
                <p className='text-xs font-bold text-placeholder uppercase tracking-wider'>Tổng số tiền</p>
                <p className='text-lg font-semibold text-primary mt-0.5'>
                  {(selectedOrder.amount ?? selectedOrder.totalPrice) != null ? `${Number(selectedOrder.amount ?? selectedOrder.totalPrice).toLocaleString('vi-VN')}đ` : '-'}
                </p>
              </div>

              {selectedOrder.note && (
                <div className='col-span-2 bg-muted/40 p-3 rounded-xl border border-border italic text-muted-foreground text-xs mt-1'>
                  &quot;{selectedOrder.note}&quot;
                </div>
              )}
            </div>

            <div className='border-t border-border pt-4 flex justify-end'>
              <button
                onClick={() => setSelectedOrder(null)}
                className='px-5 py-2 rounded-xl bg-muted hover:bg-border text-foreground text-xs font-bold transition-all'
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
