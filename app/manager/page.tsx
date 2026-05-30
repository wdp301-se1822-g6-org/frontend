'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetOrders, adminGetWorkOrders } from '@/lib/admin-api';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck, Wrench, CreditCard,
  TrendingUp, ArrowRight, ShieldCheck, CheckCircle2, Clock
} from 'lucide-react';
import Link from 'next/link';

interface DashboardOrder {
  scheduledAt?: string;
  bookingDate?: string;
  status?: string;
  isPaid?: boolean;
  amount?: number | string;
  totalPrice?: number | string;
}

interface DashboardWorkOrder {
  _id?: string;
  id?: string;
  status?: string;
  qcStatus?: string | null;
  orderId?: {
    userId?: { fullName?: string };
    customerName?: string;
    vehicleId?: { licensePlate?: string };
    licensePlate?: string;
  };
  washerId?: { fullName?: string; name?: string };
}

export default function ManagerDashboard() {
  // Lấy dữ liệu orders
  const { data: ordersData } = useQuery({
    queryKey: ['manager-dashboard-orders'],
    queryFn: () => adminGetOrders({ limit: 100 }),
  });

  // Lấy dữ liệu work orders
  const { data: workOrdersData, isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ['manager-dashboard-workorders'],
    queryFn: () => adminGetWorkOrders({ limit: 100 }),
  });

  const orders = ordersData?.data?.data ?? ordersData?.data ?? [];
  const workOrders = workOrdersData?.data?.data ?? workOrdersData?.data ?? [];

  // Tính toán số liệu thống kê
  const today = new Date().toDateString();
  
  const todayOrders = (orders as DashboardOrder[]).filter((o) => {
    const orderDate = o.scheduledAt ?? o.bookingDate;
    return orderDate ? new Date(orderDate).toDateString() === today : false;
  });

  const completedToday = todayOrders.filter((o) => o.status === 'completed');

  const todayRevenue = todayOrders
    .filter((o) => o.status === 'completed' || o.isPaid === true)
    .reduce((sum, o) => sum + Number(o.amount ?? o.totalPrice ?? 0), 0);

  const activeWorkOrders = (workOrders as DashboardWorkOrder[]).filter((w) =>
    w.status === 'pending' || w.status === 'in_progress'
  );

  const qcPassedCount = (workOrders as DashboardWorkOrder[]).filter((w) => w.qcStatus === 'passed').length;
  const qcTotalCount = (workOrders as DashboardWorkOrder[]).filter((w) => w.qcStatus != null).length;
  const qcRate = qcTotalCount > 0 ? Math.round((qcPassedCount / qcTotalCount) * 100) : 100;

  return (
    <>
      <AdminTopbar
        title='Manager Dashboard'
        subtitle='Chào mừng Quản lý trở lại! Dưới đây là tình hình vận hành của tiệm hôm nay.'
      />
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-7xl mx-auto flex flex-col gap-8'>
          
          {/* Stats Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {/* Revenue Card */}
            <div className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
              <div className='flex items-start justify-between mb-4'>
                <div className='w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center'>
                  <CreditCard className='w-5 h-5 text-white' />
                </div>
                <span className='flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600'>
                  <TrendingUp className='w-3 h-3' /> Today
                </span>
              </div>
              <p className='text-2xl font-black text-slate-900 tracking-tight mb-1'>
                {todayRevenue.toLocaleString('vi-VN')}đ
              </p>
              <p className='text-xs font-black text-slate-500 uppercase tracking-widest mb-1'>Doanh thu hôm nay</p>
              <p className='text-slate-500 text-xs font-medium'>Từ {todayOrders.length} đơn đặt lịch</p>
            </div>

            {/* Completed Orders Card */}
            <div className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
              <div className='flex items-start justify-between mb-4'>
                <div className='w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center'>
                  <CheckCircle2 className='w-5 h-5 text-white' />
                </div>
              </div>
              <p className='text-2xl font-black text-slate-900 tracking-tight mb-1'>
                {completedToday.length} / {todayOrders.length}
              </p>
              <p className='text-xs font-black text-slate-500 uppercase tracking-widest mb-1'>Rửa hoàn thành</p>
              <p className='text-slate-500 text-xs font-medium'>Đã rửa xong trong ngày</p>
            </div>

            {/* Active Washers/WorkOrders */}
            <div className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
              <div className='flex items-start justify-between mb-4'>
                <div className='w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center'>
                  <Wrench className='w-5 h-5 text-white' />
                </div>
              </div>
              <p className='text-2xl font-black text-slate-900 tracking-tight mb-1'>
                {activeWorkOrders.length} đơn
              </p>
              <p className='text-xs font-black text-slate-500 uppercase tracking-widest mb-1'>Đang xử lý tại quầy</p>
              <p className='text-slate-500 text-xs font-medium'>Cần gán thợ hoặc đang rửa</p>
            </div>

            {/* QC Success Rate Card */}
            <div className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
              <div className='flex items-start justify-between mb-4'>
                <div className='w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center'>
                  <ShieldCheck className='w-5 h-5 text-white' />
                </div>
              </div>
              <p className='text-2xl font-black text-slate-900 tracking-tight mb-1'>
                {qcRate}%
              </p>
              <p className='text-xs font-black text-slate-500 uppercase tracking-widest mb-1'>Tỉ lệ QC Đạt chuẩn</p>
              <p className='text-slate-500 text-xs font-medium'>Tổng số lần QC: {qcTotalCount}</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className='bg-white rounded-2xl border border-slate-100 p-6 shadow-sm'>
            <h2 className='font-heading text-sm font-black uppercase tracking-widest text-slate-500 mb-4'>Thao tác vận hành nhanh</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Link
                href='/manager/orders'
                className='flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/10 hover:-translate-y-0.5 transition-all duration-200 group'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform'>
                    <CalendarCheck className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-heading font-bold text-slate-800 text-sm'>Check-in Khách hàng mới</h3>
                    <p className='text-xs text-slate-500 mt-0.5'>Xem danh sách đặt lịch và check-in tạo Work Order</p>
                  </div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors' />
              </Link>

              <Link
                href='/manager/work-orders'
                className='flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/10 hover:-translate-y-0.5 transition-all duration-200 group'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform'>
                    <Wrench className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-heading font-bold text-slate-800 text-sm'>Phân công & Kiểm định QC</h3>
                    <p className='text-xs text-slate-500 mt-0.5'>Giao xe cho thợ rửa, giám sát tiến độ và kiểm tra chất lượng</p>
                  </div>
                </div>
                <ArrowRight className='w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors' />
              </Link>
            </div>
          </div>

          {/* Real-time active Wash Orders */}
          <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'>
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100'>
              <h2 className='font-heading font-black text-slate-900 text-base'>Đơn xe đang rửa thực tế</h2>
              <Link href='/manager/work-orders' className='text-xs font-black text-indigo-600 hover:underline flex items-center gap-1'>
                Xem tất cả vận hành <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
            
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-slate-600'>
                <thead>
                  <tr className='bg-slate-50/50 border-b border-slate-100'>
                    <th className='text-left px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Mã số</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Khách hàng</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Biển số xe</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Thợ phụ trách</th>
                    <th className='text-center px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Trạng thái QC</th>
                    <th className='text-right px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Trạng thái rửa</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {isLoadingWorkOrders ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className='px-6 py-4'>
                            <div className='h-4 bg-slate-100 animate-pulse rounded-lg' />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : activeWorkOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='px-6 py-12 text-center text-slate-500 font-semibold'>
                        Không có chiếc xe nào đang được rửa tại quầy.
                      </td>
                    </tr>
                  ) : (
                    activeWorkOrders.slice(0, 5).map((w) => {
                      let statusBadge = 'bg-slate-100 text-slate-500';
                      let statusLabel = w.status;
                      if (w.status === 'pending') {
                        statusBadge = 'bg-amber-50 text-amber-700 border border-amber-100';
                        statusLabel = 'Chờ giao việc';
                      } else if (w.status === 'in_progress') {
                        statusBadge = 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse';
                        statusLabel = 'Đang rửa xe';
                      } else if (w.status === 'completed') {
                        statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                        statusLabel = 'Đã hoàn thành';
                      }

                      return (
                        <tr key={w._id ?? w.id} className='hover:bg-slate-50/40 transition-colors'>
                          <td className='px-6 py-4 font-mono text-xs text-slate-500'>
                            {w._id ? w._id.slice(-6).toUpperCase() : '—'}
                          </td>
                          <td className='px-4 py-4'>
                            <span className='font-bold text-slate-800'>{w.orderId?.userId?.fullName ?? w.orderId?.customerName ?? 'Khách vãng lai'}</span>
                          </td>
                          <td className='px-4 py-4 text-xs font-mono font-bold text-indigo-600 bg-indigo-50/50 rounded px-2 py-1 inline-block mt-3'>
                            {w.orderId?.vehicleId?.licensePlate ?? w.orderId?.licensePlate ?? '—'}
                          </td>
                          <td className='px-4 py-4 text-slate-500 font-medium'>
                            {w.washerId?.fullName ?? w.washerId?.name ?? (
                              <span className='text-amber-500 font-semibold italic flex items-center gap-1'>
                                <Clock className='w-3 h-3' /> Chưa phân công
                              </span>
                            )}
                          </td>
                          <td className='px-4 py-4 text-center'>
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                              w.qcStatus === 'passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              w.qcStatus === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {w.qcStatus === 'passed' ? 'QC Đạt' : w.qcStatus === 'failed' ? 'QC Không Đạt' : 'Chưa QC'}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${statusBadge}`}>
                              {statusLabel}
                            </span>
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
      </main>
    </>
  );
}
