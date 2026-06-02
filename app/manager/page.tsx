'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { DonutChart } from '@/components/admin/dashboard/DonutChart';
import {
  adminGetDashboard,
  adminGetShifts,
  adminGetWorkOrders,
} from '@/lib/admin-api';
import { getThisMonthRange, getTodayRange } from '@/lib/date-range';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import type { DashboardReport } from '@/types/dashboard';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  PieChart,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  Wrench,
} from 'lucide-react';
import type { ElementType } from 'react';
import Link from 'next/link';

/* Real work-order shape (BE WorkOrderResponseDto). */
interface WorkOrderRow {
  id?: string;
  _id?: string;
  code?: string;
  status?: string; // waiting | assigned | in_progress | quality_check | returned | done
  serviceName?: string;
  assignedWasherName?: string;
  qcPassed?: boolean | null;
  vehicleSnapshot?: { plate?: string };
}

/* Real staff-shift shape (BE StaffShiftResponseDto). */
interface ShiftRow {
  id?: string;
  startAt?: string;
  stationName?: string;
  maxBookings?: number;
  currentBookings?: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  in_progress: 'Đang rửa',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

const WO_STATUS: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'Chờ gán thợ', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  assigned: { label: 'Đã gán thợ', cls: 'bg-sky-50 text-sky-700 border border-sky-100' },
  in_progress: { label: 'Đang rửa', cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
  quality_check: { label: 'Chờ QC', cls: 'bg-purple-50 text-purple-700 border border-purple-100' },
  returned: { label: 'QC trả về', cls: 'bg-rose-50 text-rose-700 border border-rose-100' },
  done: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
};

export default function ManagerOverviewPage() {
  const { data: todayReport } = useQuery({
    queryKey: ['manager-today-report'],
    queryFn: async () => {
      const r = getTodayRange();
      const res = await adminGetDashboard({
        fromDate: r.from,
        toDate: r.to,
        period: 'today',
      });
      return res.data as DashboardReport;
    },
  });

  const { data: monthReport, isLoading: monthLoading } = useQuery({
    queryKey: ['manager-month-report'],
    queryFn: async () => {
      const r = getThisMonthRange();
      const res = await adminGetDashboard({
        fromDate: r.from,
        toDate: r.to,
        period: 'month',
      });
      return res.data as DashboardReport;
    },
  });

  const { data: workOrdersData, isLoading: woLoading } = useQuery({
    queryKey: ['manager-overview-workorders'],
    queryFn: () => adminGetWorkOrders({ limit: 100 }),
  });

  const { data: shiftsData } = useQuery({
    queryKey: ['manager-overview-shifts'],
    queryFn: () => adminGetShifts({ limit: 100 }),
  });

  const workOrders: WorkOrderRow[] =
    workOrdersData?.data?.data ?? workOrdersData?.data ?? [];
  const shifts: ShiftRow[] = shiftsData?.data?.data ?? shiftsData?.data ?? [];

  // ── Operational alerts (real-time, not date-bound) ──────────────────────
  const waitingCount = workOrders.filter((w) => w.status === 'waiting').length;
  const qcPendingCount = workOrders.filter(
    (w) => w.status === 'quality_check',
  ).length;
  const returnedCount = workOrders.filter(
    (w) => w.status === 'returned',
  ).length;

  const todayStr = new Date().toDateString();
  const fullSlots = shifts.filter((s) => {
    if (!s.startAt || !s.maxBookings) return false;
    if (new Date(s.startAt).toDateString() !== todayStr) return false;
    return (s.currentBookings ?? 0) / s.maxBookings >= 0.8;
  });

  const activeWorkOrders = workOrders.filter((w) => w.status !== 'done');
  const qcDone = workOrders.filter((w) => w.qcPassed != null);
  const qcPassed = workOrders.filter((w) => w.qcPassed === true);
  const qcRate =
    qcDone.length > 0
      ? Math.round((qcPassed.length / qcDone.length) * 100)
      : null;

  const ov = todayReport?.overview;

  return (
    <>
      <AdminTopbar
        title='Tổng quan vận hành'
        subtitle='Tình hình vận hành của tiệm hôm nay và những việc cần xử lý.'
      />
      <main className='flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-7xl mx-auto flex flex-col gap-8'>
          {/* ── Cần xử lý ngay ── */}
          <section className='flex flex-col gap-4'>
            <h2 className='font-heading text-sm font-black uppercase tracking-widest text-slate-500'>
              Cần xử lý ngay
            </h2>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <AlertCard
                icon={UserPlus}
                count={waitingCount}
                label='Đơn chờ gán thợ'
                sub='Cần phân công thợ rửa'
                href='/manager/work-orders'
                active={waitingCount > 0}
              />
              <AlertCard
                icon={ClipboardCheck}
                count={qcPendingCount}
                label='Đơn chờ kiểm định QC'
                sub='Thợ đã rửa xong, chờ duyệt'
                href='/manager/work-orders'
                active={qcPendingCount > 0}
              />
              <AlertCard
                icon={RotateCcw}
                count={returnedCount}
                label='Đơn bị QC trả về'
                sub='Cần rửa lại'
                href='/manager/work-orders'
                active={returnedCount > 0}
                danger
              />
              <AlertCard
                icon={Clock}
                count={fullSlots.length}
                label='Ca sắp đầy hôm nay'
                sub='Lấp đầy từ 80% trở lên'
                href='/manager/shifts'
                active={fullSlots.length > 0}
              />
            </div>
          </section>

          {/* ── KPI hôm nay ── */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            <SlateKpi
              icon={CreditCard}
              iconBg='bg-indigo-600'
              value={ov ? formatCurrency(ov.netRevenue) : '...'}
              label='Doanh thu hôm nay'
              sub={ov ? `${formatNumber(ov.completedBookings)} đơn hoàn thành` : 'Đang tải'}
              badge='Hôm nay'
            />
            <SlateKpi
              icon={CheckCircle2}
              iconBg='bg-emerald-600'
              value={ov ? `${formatNumber(ov.completedBookings)} / ${formatNumber(ov.totalBookings)}` : '...'}
              label='Rửa hoàn thành'
              sub='Đã rửa xong / tổng đơn trong ngày'
            />
            <SlateKpi
              icon={Wrench}
              iconBg='bg-amber-500'
              value={`${formatNumber(activeWorkOrders.length)} đơn`}
              label='Đang xử lý tại quầy'
              sub='Chưa hoàn tất (gán thợ / rửa / QC)'
            />
            <SlateKpi
              icon={ShieldCheck}
              iconBg='bg-purple-600'
              value={qcRate == null ? 'Chưa có' : `${qcRate}%`}
              label='Tỉ lệ QC đạt chuẩn'
              sub={`Tổng số lần QC: ${formatNumber(qcDone.length)}`}
            />
          </div>

          {/* ── Thao tác nhanh ── */}
          <div className='bg-white rounded-2xl border border-slate-100 p-6 shadow-sm'>
            <h2 className='font-heading text-sm font-black uppercase tracking-widest text-slate-500 mb-4'>
              Thao tác vận hành nhanh
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <QuickAction
                icon={CalendarCheck}
                title='Check-in khách mới'
                sub='Xem đặt lịch và tạo Work Order'
                href='/manager/orders'
              />
              <QuickAction
                icon={Wrench}
                title='Phân công & Kiểm định QC'
                sub='Giao xe cho thợ, duyệt chất lượng'
                href='/manager/work-orders'
              />
              <QuickAction
                icon={PieChart}
                title='Báo cáo vận hành đầy đủ'
                sub='Doanh thu, dịch vụ, thợ, biểu đồ'
                href='/manager/dashboard'
              />
            </div>
          </div>

          {/* ── Phân tích nhanh — Tháng này ── */}
          <section className='flex flex-col gap-4'>
            <div className='flex items-end justify-between gap-4'>
              <div>
                <h2 className='font-heading text-base font-black text-slate-900'>
                  Phân tích nhanh - Tháng này
                </h2>
                <p className='text-xs text-slate-500'>
                  Tổng hợp theo tháng hiện tại. Xem chi tiết theo kỳ ở Báo cáo
                  vận hành.
                </p>
              </div>
              <Link
                href='/manager/dashboard'
                className='shrink-0 text-xs font-black text-indigo-600 hover:underline flex items-center gap-1'
              >
                Xem báo cáo đầy đủ <ArrowRight className='w-3 h-3' />
              </Link>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <MiniStat
                label='Doanh thu thực nhận'
                value={monthReport ? formatCurrency(monthReport.revenue.net) : '...'}
              />
              <MiniStat
                label='Tổng đặt lịch'
                value={monthReport ? formatNumber(monthReport.overview.totalBookings) : '...'}
              />
              <MiniStat
                label='Tỷ lệ hoàn thành'
                value={monthReport ? formatPercent(monthReport.bookings.completionRate) : '...'}
              />
              <MiniStat
                label='Tỷ lệ lấp đầy slot'
                value={monthReport ? formatPercent(monthReport.schedule.utilizationRate) : '...'}
              />
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-5'>
                <h3 className='text-sm font-bold text-slate-800 mb-4'>
                  Tỷ trọng trạng thái đặt lịch
                </h3>
                {monthLoading ? (
                  <DonutSkeleton />
                ) : (
                  <DonutChart
                    data={Object.entries(
                      monthReport?.bookings.statusSummary ?? {},
                    ).map(([key, count]) => ({
                      label: STATUS_LABELS[key] ?? key,
                      value: count,
                    }))}
                    centerCaption='đơn'
                    emptyMessage='Chưa có booking nào trong tháng này'
                  />
                )}
              </div>
              <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-5'>
                <h3 className='text-sm font-bold text-slate-800 mb-4'>
                  Tỷ trọng doanh thu theo dịch vụ
                </h3>
                {monthLoading ? (
                  <DonutSkeleton />
                ) : (
                  <DonutChart
                    data={(monthReport?.revenue.byService ?? []).map((s) => ({
                      label: s.name,
                      value: s.revenue,
                    }))}
                    formatValue={formatCurrency}
                    centerCaption='doanh thu'
                    emptyMessage='Chưa có doanh thu theo dịch vụ trong tháng này'
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── Đơn xe đang rửa thực tế ── */}
          <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'>
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100'>
              <h2 className='font-heading font-black text-slate-900 text-base'>
                Đơn xe đang rửa thực tế
              </h2>
              <Link
                href='/manager/work-orders'
                className='text-xs font-black text-indigo-600 hover:underline flex items-center gap-1'
              >
                Xem tất cả vận hành <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-slate-600'>
                <thead>
                  <tr className='bg-slate-50/50 border-b border-slate-100'>
                    <th className='text-left px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Mã số</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Biển số xe</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Dịch vụ</th>
                    <th className='text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Thợ phụ trách</th>
                    <th className='text-center px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>QC</th>
                    <th className='text-right px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500'>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {woLoading ? (
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
                    activeWorkOrders.slice(0, 6).map((w) => {
                      const id = w.id ?? w._id ?? '';
                      const s = WO_STATUS[w.status ?? ''] ?? {
                        label: w.status ?? '-',
                        cls: 'bg-slate-100 text-slate-500',
                      };
                      return (
                        <tr key={id} className='hover:bg-slate-50/40 transition-colors'>
                          <td className='px-6 py-4 font-mono text-xs text-slate-500'>
                            {w.code ?? (id ? id.slice(-6).toUpperCase() : '-')}
                          </td>
                          <td className='px-4 py-4'>
                            <span className='text-xs font-mono font-bold text-indigo-600 bg-indigo-50/50 rounded px-2 py-1'>
                              {w.vehicleSnapshot?.plate ?? '-'}
                            </span>
                          </td>
                          <td className='px-4 py-4 text-slate-700'>
                            {w.serviceName ?? '-'}
                          </td>
                          <td className='px-4 py-4 text-slate-500 font-medium'>
                            {w.assignedWasherName ?? (
                              <span className='text-amber-500 font-semibold italic flex items-center gap-1'>
                                <Clock className='w-3 h-3' /> Chưa phân công
                              </span>
                            )}
                          </td>
                          <td className='px-4 py-4 text-center'>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                                w.qcPassed === true
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : w.qcPassed === false
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {w.qcPassed === true
                                ? 'Đạt'
                                : w.qcPassed === false
                                  ? 'Không đạt'
                                  : 'Chưa QC'}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${s.cls}`}>
                              {s.label}
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

/* ── Small presentational helpers (slate style to match manager shell) ── */

function AlertCard({
  icon: Icon,
  count,
  label,
  sub,
  href,
  active,
  danger,
}: {
  icon: ElementType;
  count: number;
  label: string;
  sub: string;
  href: string;
  active: boolean;
  danger?: boolean;
}) {
  const accent = !active
    ? 'text-slate-400 bg-slate-100'
    : danger
      ? 'text-rose-600 bg-rose-50'
      : 'text-amber-600 bg-amber-50';
  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
        active ? 'border-slate-200' : 'border-slate-100'
      }`}
    >
      <div className='flex items-start justify-between mb-3'>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className='w-5 h-5' />
        </div>
        <span className='text-2xl font-black text-slate-900 tabular-nums'>
          {formatNumber(count)}
        </span>
      </div>
      <p className='text-sm font-bold text-slate-800'>{label}</p>
      <p className='text-xs text-slate-500 mt-0.5'>{sub}</p>
    </Link>
  );
}

function SlateKpi({
  icon: Icon,
  iconBg,
  value,
  label,
  sub,
  badge,
}: {
  icon: ElementType;
  iconBg: string;
  value: string;
  label: string;
  sub: string;
  badge?: string;
}) {
  return (
    <div className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
      <div className='flex items-start justify-between mb-4'>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className='w-5 h-5 text-white' />
        </div>
        {badge && (
          <span className='text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600'>
            {badge}
          </span>
        )}
      </div>
      <p className='text-2xl font-black text-slate-900 tracking-tight mb-1'>{value}</p>
      <p className='text-xs font-black text-slate-500 uppercase tracking-widest mb-1'>{label}</p>
      <p className='text-slate-500 text-xs font-medium'>{sub}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  sub,
  href,
}: {
  icon: ElementType;
  title: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className='flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/10 hover:-translate-y-0.5 transition-all duration-200 group'
    >
      <div className='flex items-center gap-4 min-w-0'>
        <div className='w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shrink-0'>
          <Icon className='w-5 h-5' />
        </div>
        <div className='min-w-0'>
          <h3 className='font-heading font-bold text-slate-800 text-sm truncate'>{title}</h3>
          <p className='text-xs text-slate-500 mt-0.5 truncate'>{sub}</p>
        </div>
      </div>
      <ArrowRight className='w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0' />
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-white rounded-2xl p-5 border border-slate-100 shadow-sm'>
      <p className='text-xs font-medium text-slate-500'>{label}</p>
      <p className='font-heading text-xl font-black text-slate-900 tracking-tight mt-1'>
        {value}
      </p>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className='flex items-center gap-6'>
      <div className='size-40 rounded-full bg-slate-100 animate-pulse' />
      <div className='flex-1 space-y-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='h-4 bg-slate-100 animate-pulse rounded' />
        ))}
      </div>
    </div>
  );
}
