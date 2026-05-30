'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetBookings, adminUpdateBookingStatus } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';

interface BookingData {
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
  totalPrice?: number | string;
  status?: string;
  [key: string]: unknown;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed:       { label: 'Hoàn thành',       cls: 'bg-emerald-50 text-emerald-700' },
  in_progress:     { label: 'Đang rửa xe',      cls: 'bg-indigo-50 text-indigo-700' },
  confirmed:       { label: 'Đã xác nhận',      cls: 'bg-blue-50 text-blue-700' },
  checked_in:      { label: 'Đã check-in',      cls: 'bg-sky-50 text-sky-700' },
  pending_payment: { label: 'Chờ thanh toán',   cls: 'bg-amber-50 text-amber-700' },
  cancelled:       { label: 'Đã hủy',           cls: 'bg-rose-50 text-rose-700' },
  no_show:         { label: 'Vắng mặt',         cls: 'bg-slate-100 text-slate-600' },
};

const statusOptions = ['all', 'pending_payment', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: () => adminGetBookings({
      page, limit: 10,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminUpdateBookingStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const bookings: BookingData[] = data?.data?.data ?? data?.data ?? [];
  const total: number = data?.data?.total ?? bookings.length;

  const filtered = search
    ? bookings.filter((b: BookingData) =>
        JSON.stringify(b).toLowerCase().includes(search.toLowerCase()))
    : bookings;

  return (
    <>
      <AdminTopbar title='Quản lý đặt lịch' subtitle='Xem và cập nhật tất cả booking' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-7xl mx-auto'>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3 mb-6'>
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55' />
              <input
                type='text'
                placeholder='Tìm kiếm booking...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:border-primary/50 transition-all'
              />
            </div>

            <div className='relative'>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className='appearance-none bg-white border border-border rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all cursor-pointer'
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'Tất cả trạng thái' : statusConfig[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60 pointer-events-none' />
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-semibold hover:border-primary/30 transition-all'
            >
              <RefreshCw className='w-4 h-4 text-foreground/50' />
              Làm mới
            </button>

            <span className='ml-auto text-xs font-semibold text-foreground/60'>
              Tổng: {total} booking
            </span>
          </div>

          {/* Table */}
          <div className='bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-muted/50 border-b border-border/50'>
                    {['ID', 'Khách hàng', 'Xe', 'Dịch vụ', 'Ca / Ngày', 'Số tiền', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className='text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-foreground/60'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/30'>
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
                      <td colSpan={8} className='px-5 py-16 text-center text-foreground/60 font-semibold'>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b: BookingData) => {
                      const s = statusConfig[b.status ?? ''] ?? { label: b.status, cls: 'bg-muted text-foreground/60' };
                      return (
                        <tr key={b._id ?? b.id} className='hover:bg-muted/20 transition-colors'>
                          <td className='px-5 py-4 font-mono text-xs text-foreground/50'>
                            {(b._id ?? b.id ?? '').slice(-6).toUpperCase()}
                          </td>
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-2'>
                              <div className='w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs'>
                                {(b.userId?.fullName ?? b.customerName ?? '?')[0]}
                              </div>
                              <span className='font-semibold text-foreground'>
                                {b.userId?.fullName ?? b.customerName ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td className='px-5 py-4 text-foreground/60 font-mono text-xs'>
                            {b.vehicleId?.licensePlate ?? b.licensePlate ?? '—'}
                          </td>
                          <td className='px-5 py-4 text-foreground/70'>
                            {b.serviceTypeId?.name ?? b.serviceName ?? '—'}
                          </td>
                          <td className='px-5 py-4 text-foreground/60 text-xs'>
                            <div>{b.shiftId?.name ?? '—'}</div>
                            <div className='text-foreground/60'>{(b.scheduledAt ?? b.bookingDate) ? new Date((b.scheduledAt ?? b.bookingDate) as string).toLocaleDateString('vi-VN') : '—'}</div>
                          </td>
                          <td className='px-5 py-4 font-black text-foreground'>
                            {(b.amount ?? b.totalPrice) != null ? `${Number(b.amount ?? b.totalPrice).toLocaleString('vi-VN')}đ` : '—'}
                          </td>
                          <td className='px-5 py-4'>
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className='px-5 py-4'>
                            <select
                              defaultValue={b.status}
                              onChange={(e) => updateStatus.mutate({ id: b._id ?? b.id ?? '', status: e.target.value })}
                              className='text-xs border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary/50 cursor-pointer'
                            >
                              {Object.entries(statusConfig).map(([v, { label }]) => (
                                <option key={v} value={v}>{label}</option>
                              ))}
                            </select>
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
              <div className='flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/20'>
                <span className='text-xs font-semibold text-foreground/60'>
                  Trang {page} / {Math.ceil(total / 10)}
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary/30 transition-all'
                  >Trước</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary/30 transition-all'
                  >Sau</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
