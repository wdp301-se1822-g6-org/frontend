'use client';

/**
 * Management Reporting / Operational Analytics Dashboard.
 *
 * Renders real aggregated data from GET /admin/dashboard - no mock data.
 * Report groups: Overview KPI, Revenue Analytics, Booking Analytics,
 * Washer Performance, Customer Analytics, Vehicle Analytics,
 * Voucher & Loyalty Analytics, Service Analytics, Refund & Dispute,
 * Schedule & Capacity. Every list falls back to an honest empty state.
 */

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarCheck,
  CircleDollarSign,
  Clock,
  CreditCard,
  Layers,
  Sparkles,
  TrendingDown,
  Users,
  Wrench,
} from 'lucide-react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  DateRangeFilter,
  type DateFilterValue,
} from '@/components/admin/dashboard/DateRangeFilter';
import { DonutChart } from '@/components/admin/dashboard/DonutChart';
import {
  BarList,
  DashboardSection,
  EmptyBlock,
  HourStrip,
  KpiCard,
  Panel,
  RankBadge,
  RankingTable,
} from '@/components/admin/dashboard/parts';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { adminGetDashboard } from '@/lib/admin-api';
import { DEFAULT_PERIOD, getRangeForPeriod } from '@/lib/date-range';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import type { DashboardReport } from '@/types/dashboard';

/* ─── Labels ──────────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  in_progress: 'Đang rửa',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

const PAYMENT_LABELS: Record<string, string> = {
  online: 'Chuyển khoản (PayOS)',
  cash: 'Tiền mặt',
};

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DateFilterValue>(() => ({
    period: DEFAULT_PERIOD,
    range: getRangeForPeriod(DEFAULT_PERIOD),
  }));

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      'admin-dashboard',
      filter.period,
      filter.range.from,
      filter.range.to,
    ],
    queryFn: async () => {
      const res = await adminGetDashboard({
        fromDate: filter.range.from,
        toDate: filter.range.to,
        period: filter.period,
        topN: 5,
      });
      return res.data as DashboardReport;
    },
    // Keep the previous window's data on screen while the new one loads so the
    // layout never collapses - we dim it with a light overlay instead.
    placeholderData: keepPreviousData,
  });

  const isRefetching = isFetching && !isLoading;

  return (
    <>
      <AdminTopbar
        title='Báo cáo quản trị & Phân tích vận hành'
        subtitle='Toàn bộ số liệu được tổng hợp trực tiếp từ dữ liệu thật của hệ thống.'
      />
      <main className='flex-1 overflow-y-auto p-6 lg:p-8'>
        <div className='mx-auto flex max-w-7xl flex-col gap-8'>
          <DateRangeFilter
            value={filter}
            onChange={setFilter}
            isFetching={isRefetching}
          />

          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            loading={<DashboardSkeleton />}
          >
            {data && (
              <div className='relative'>
                {isRefetching && (
                  <div className='pointer-events-none absolute inset-0 z-10 rounded-xl bg-background/50' />
                )}
                {data.overview.totalBookings === 0 && (
                  <div className='mb-6 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground'>
                    Không có booking nào trong khoảng thời gian đã chọn - các
                    chỉ số doanh thu và đặt lịch sẽ hiển thị 0.
                  </div>
                )}
                <DashboardBody report={data} />
              </div>
            )}
          </QueryBoundary>
        </div>
      </main>
    </>
  );
}

/* ─── Body ────────────────────────────────────────────────────────────── */

function DashboardBody({ report }: { report: DashboardReport }) {
  const { overview, revenue, bookings, washers } = report;
  const inProgressBookings = bookings.statusSummary['in_progress'] ?? 0;
  // "Đang chờ xử lý" không gồm số đang rửa để tránh đếm trùng trong biểu đồ.
  const waitingBookings = Math.max(
    overview.pendingBookings - inProgressBookings,
    0,
  );

  return (
    <div className='flex flex-col gap-10'>
      {/* 1 ─ OVERVIEW KPI */}
      <DashboardSection
        title='Tổng quan (Overview KPI)'
        subtitle='Các chỉ số vận hành chính trong kỳ đã chọn.'
        icon={Sparkles}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Doanh thu thực nhận'
            value={formatCurrency(overview.netRevenue)}
            hint='Sau giảm giá & hoàn tiền'
            icon={CircleDollarSign}
            tone='success'
          />
          <KpiCard
            label='Tổng đặt lịch'
            value={formatNumber(overview.totalBookings)}
            hint={`${formatNumber(overview.completedBookings)} hoàn thành`}
            icon={CalendarCheck}
          />
          <KpiCard
            label='Đang rửa'
            value={formatNumber(inProgressBookings)}
            hint='Xe đang được xử lý'
            icon={Sparkles}
            tone='primary'
          />
          <KpiCard
            label='Đang chờ xử lý'
            value={formatNumber(waitingBookings)}
            hint='Chưa vào rửa'
            icon={Clock}
          />
          <KpiCard
            label='Huỷ / Không đến'
            value={`${formatNumber(overview.cancelledBookings)} / ${formatNumber(overview.noShowBookings)}`}
            hint='Không tính doanh thu'
            icon={TrendingDown}
            tone='destructive'
          />
          <KpiCard
            label='Giá trị đơn TB'
            value={formatCurrency(overview.averageOrderValue)}
            hint='Trên đơn hoàn thành'
            icon={CreditCard}
          />
          <KpiCard
            label='Thợ đang hoạt động'
            value={formatNumber(overview.activeWashers)}
            icon={Wrench}
          />
          <KpiCard
            label='Khách hàng'
            value={formatNumber(overview.totalCustomers)}
            icon={Users}
          />
        </div>

        {/* Tỷ trọng tổng hợp cho các card KPI ở trên */}
        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel
            title='Cơ cấu doanh thu'
            hint='Doanh thu gộp được chia thành thực nhận, giảm giá và hoàn tiền'
          >
            <DonutChart
              data={[
                { label: 'Thực nhận', value: overview.netRevenue },
                { label: 'Giảm giá', value: overview.discountAmount },
                { label: 'Hoàn tiền', value: overview.refundAmount },
              ]}
              formatValue={formatCurrency}
              centerCaption='doanh thu gộp'
              emptyMessage='Chưa có doanh thu trong khoảng thời gian này'
            />
          </Panel>
          <Panel
            title='Cơ cấu đặt lịch'
            hint='Tổng đặt lịch chia theo trạng thái xử lý'
          >
            <DonutChart
              data={[
                { label: 'Hoàn thành', value: overview.completedBookings },
                { label: 'Đang rửa', value: inProgressBookings },
                { label: 'Đang chờ xử lý', value: waitingBookings },
                { label: 'Đã huỷ', value: overview.cancelledBookings },
                { label: 'Không đến', value: overview.noShowBookings },
              ]}
              centerCaption='đơn'
              emptyMessage='Chưa có booking nào trong khoảng thời gian này'
            />
          </Panel>
        </div>
      </DashboardSection>

      {/* 2 ─ REVENUE ANALYTICS */}
      <DashboardSection
        title='Phân tích doanh thu (Revenue Analytics)'
        subtitle='Doanh thu chỉ tính từ đơn Hoàn thành & Đã thanh toán.'
        icon={CircleDollarSign}
      >
        <div className='grid gap-4 lg:grid-cols-3'>
          <Panel
            title='Cơ cấu doanh thu'
            hint='Net = Gộp − Giảm giá − Hoàn tiền'
          >
            <dl className='flex flex-col gap-3 text-sm'>
              <RevenueRow label='Doanh thu gộp' value={revenue.gross} />
              <RevenueRow
                label='Giảm giá'
                value={-revenue.discount}
                tone='warning'
              />
              <RevenueRow
                label='Hoàn tiền'
                value={-revenue.refund}
                tone='destructive'
              />
              <div className='mt-1 flex items-center justify-between border-t border-border pt-3'>
                <dt className='font-semibold text-foreground'>
                  Doanh thu thực nhận
                </dt>
                <dd className='font-heading text-lg font-bold text-success'>
                  {formatCurrency(revenue.net)}
                </dd>
              </div>
              <div className='flex items-center justify-between text-muted-foreground'>
                <dt>Giá trị đơn trung bình</dt>
                <dd className='tabular-nums'>
                  {formatCurrency(revenue.averageOrderValue)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title='Tỷ trọng doanh thu theo dịch vụ'>
            <DonutChart
              data={revenue.byService.map((s) => ({
                label: s.name,
                value: s.revenue,
              }))}
              formatValue={formatCurrency}
              centerCaption='doanh thu'
              emptyMessage='Chưa có doanh thu theo dịch vụ trong khoảng thời gian này'
            />
          </Panel>

          <Panel title='Tỷ trọng theo phương thức thanh toán'>
            <DonutChart
              data={revenue.byPaymentMethod.map((r) => ({
                label: PAYMENT_LABELS[r.name] ?? r.name,
                value: r.revenue,
              }))}
              formatValue={formatCurrency}
              centerCaption='doanh thu'
              emptyMessage='Chưa có doanh thu trong khoảng thời gian này'
            />
          </Panel>
        </div>

        <Panel title='Doanh thu theo ngày' hint='Theo ngày rửa (scheduled_at)'>
          {revenue.byDay.length === 0 ? (
            <EmptyBlock message='Chưa có doanh thu trong kỳ này' />
          ) : (
            <DayRevenueChart data={revenue.byDay} />
          )}
        </Panel>
      </DashboardSection>

      {/* 3 ─ BOOKING ANALYTICS */}
      <DashboardSection
        title='Phân tích đặt lịch (Booking Analytics)'
        subtitle='Phân rã trạng thái, tỷ lệ hoàn thành/huỷ và khung giờ.'
        icon={CalendarCheck}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Tỷ lệ hoàn thành'
            value={formatPercent(bookings.completionRate)}
            icon={CalendarCheck}
            tone='success'
          />
          <KpiCard
            label='Tỷ lệ huỷ'
            value={formatPercent(bookings.cancellationRate)}
            icon={TrendingDown}
            tone='destructive'
          />
          <KpiCard
            label='Tỷ lệ không đến'
            value={formatPercent(bookings.noShowRate)}
            icon={AlertTriangle}
            tone='warning'
          />
          <KpiCard
            label='Tổng đặt lịch'
            value={formatNumber(overview.totalBookings)}
            icon={Layers}
          />
        </div>
        <div className='grid gap-4 lg:grid-cols-3'>
          <Panel
            title='Tỷ trọng trạng thái đặt lịch'
            className='lg:col-span-1'
          >
            <DonutChart
              data={Object.entries(bookings.statusSummary).map(
                ([key, count]) => ({
                  label: STATUS_LABELS[key] ?? key,
                  value: count,
                }),
              )}
              centerCaption='đơn'
              emptyMessage='Chưa có booking nào trong khoảng thời gian này'
            />
          </Panel>
          <Panel
            title='Khung giờ đông khách'
            hint='Số đơn theo giờ trong ngày - cột đậm là giờ cao điểm'
            className='lg:col-span-2'
          >
            <HourStrip
              data={bookings.byHour}
              emptyMessage='Chưa có đặt lịch trong kỳ này'
            />
          </Panel>
        </div>
        <Panel title='Đặt lịch theo dịch vụ'>
          <BarList
            items={bookings.byService.map((s) => ({
              label: s.name,
              value: s.count,
            }))}
            format={(v) => `${formatNumber(v)} đơn`}
            emptyMessage='Chưa có đặt lịch trong kỳ này'
          />
        </Panel>
      </DashboardSection>

      {/* 4 ─ WASHER PERFORMANCE */}
      <DashboardSection
        title='Hiệu suất thợ rửa (Washer Performance)'
        subtitle='“Ai là người rửa nhiều nhất?” - xếp hạng theo số lượt rửa hoàn thành.'
        icon={Wrench}
      >
        <Panel title='Top thợ rửa theo số việc hoàn thành'>
          <RankingTable
            rows={washers}
            rowKey={(w) => w.id}
            emptyMessage='Chưa có thợ nào hoàn thành lượt rửa trong kỳ này'
            columns={[
              {
                header: '#',
                cell: (_w, i) => <RankBadge index={i} />,
              },
              {
                header: 'Thợ rửa',
                cell: (w) => (
                  <span className='font-medium text-foreground'>{w.name}</span>
                ),
              },
              {
                header: 'Hoàn thành',
                align: 'right',
                cell: (w) => (
                  <span className='font-semibold tabular-nums'>
                    {formatNumber(w.completedJobs)}
                  </span>
                ),
              },
              {
                header: 'Được giao',
                align: 'right',
                cell: (w) => (
                  <span className='tabular-nums text-muted-foreground'>
                    {formatNumber(w.assignedJobs)}
                  </span>
                ),
              },
              {
                header: 'Thời gian TB',
                align: 'right',
                cell: (w) => (
                  <span className='tabular-nums text-muted-foreground'>
                    {w.averageServiceMinutes > 0
                      ? `${formatNumber(w.averageServiceMinutes)} phút`
                      : '-'}
                  </span>
                ),
              },
              {
                header: 'Đúng giờ',
                align: 'right',
                cell: (w) => (
                  <span className='tabular-nums'>
                    {formatPercent(w.onTimeRate)}
                  </span>
                ),
              },
              {
                header: 'QC trả về',
                align: 'right',
                cell: (w) => (
                  <span
                    className={`tabular-nums ${w.reworkCount > 0 ? 'text-warning' : 'text-muted-foreground'}`}
                  >
                    {formatNumber(w.reworkCount)}
                  </span>
                ),
              },
              {
                header: 'Doanh thu xử lý',
                align: 'right',
                cell: (w) => (
                  <span className='font-medium tabular-nums'>
                    {formatCurrency(w.revenueHandled)}
                  </span>
                ),
              },
            ]}
          />
        </Panel>
      </DashboardSection>

    </div>
  );
}

/* ─── Small helpers ───────────────────────────────────────────────────── */

function RevenueRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'warning' | 'destructive';
}) {
  // Normalise -0 so a zero deduction never renders as "-0 ₫".
  const display = value === 0 ? 0 : value;
  return (
    <div className='flex items-center justify-between'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd
        className={`tabular-nums ${
          tone === 'warning'
            ? 'text-warning'
            : tone === 'destructive'
              ? 'text-destructive'
              : 'text-foreground'
        }`}
      >
        {formatCurrency(display)}
      </dd>
    </div>
  );
}

function DayRevenueChart({
  data,
}: {
  data: { key: string; revenue: number; orders: number }[];
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className='flex items-end gap-1.5 overflow-x-auto' style={{ height: 160 }}>
      {data.map((d) => {
        const height = Math.max((d.revenue / max) * 100, 3);
        const label = d.key.slice(5); // MM-DD
        return (
          <div
            key={d.key}
            className='group flex min-w-4.5 max-w-16 flex-1 flex-col items-center justify-end'
            style={{ height: '100%' }}
            title={`${d.key}: ${formatCurrency(d.revenue)} (${d.orders} đơn)`}
          >
            <div
              className='w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary'
              style={{ height: `${height}%` }}
            />
            <span className='mt-1 rotate-0 whitespace-nowrap text-[9px] text-muted-foreground'>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className='h-24 animate-pulse rounded-xl border border-border bg-muted/40'
          />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className='h-64 animate-pulse rounded-xl border border-border bg-muted/40'
          />
        ))}
      </div>
    </div>
  );
}
