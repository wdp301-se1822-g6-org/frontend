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
  BadgePercent,
  Banknote,
  CalendarCheck,
  Car,
  CircleDollarSign,
  Clock,
  CreditCard,
  Gift,
  Info,
  Layers,
  Repeat,
  Sparkles,
  Ticket,
  TrendingDown,
  Undo2,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  DateRangeFilter,
  type DateFilterValue,
} from '@/components/admin/dashboard/DateRangeFilter';
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
import type { DashboardReport, NamedRevenue } from '@/types/dashboard';

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

function revenueToBars(rows: NamedRevenue[]) {
  return rows.map((r) => ({
    label: r.name,
    value: r.revenue,
    caption: `${formatNumber(r.orders)} đơn`,
  }));
}

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
  const { overview, revenue, bookings, washers, customers } = report;
  const { vehicles, voucherLoyalty, services, refundDispute, schedule } =
    report;

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
            label='Doanh thu gộp'
            value={formatCurrency(overview.grossRevenue)}
            hint='Trước giảm giá'
            icon={Banknote}
            tone='primary'
          />
          <KpiCard
            label='Tổng giảm giá'
            value={formatCurrency(overview.discountAmount)}
            hint='Voucher + giờ vàng'
            icon={BadgePercent}
            tone='warning'
          />
          <KpiCard
            label='Hoàn tiền'
            value={formatCurrency(overview.refundAmount)}
            hint='Đơn đã refund'
            icon={Undo2}
            tone='destructive'
          />
          <KpiCard
            label='Tổng đặt lịch'
            value={formatNumber(overview.totalBookings)}
            hint={`${formatNumber(overview.completedBookings)} hoàn thành`}
            icon={CalendarCheck}
          />
          <KpiCard
            label='Đang chờ xử lý'
            value={formatNumber(overview.pendingBookings)}
            hint='Chưa hoàn thành'
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
            label='Khách hàng'
            value={formatNumber(overview.totalCustomers)}
            icon={Users}
          />
          <KpiCard
            label='Phương tiện'
            value={formatNumber(overview.totalVehicles)}
            icon={Car}
          />
          <KpiCard
            label='Thợ đang hoạt động'
            value={formatNumber(overview.activeWashers)}
            icon={Wrench}
          />
          <KpiCard
            label='Voucher đã dùng'
            value={formatNumber(overview.usedVouchers)}
            icon={Ticket}
          />
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

          <Panel title='Doanh thu theo dịch vụ'>
            <BarList
              items={revenueToBars(revenue.byService)}
              format={formatCurrency}
              emptyMessage='Chưa có doanh thu trong kỳ này'
            />
          </Panel>

          <Panel title='Doanh thu theo phương thức & loại xe'>
            <div className='flex flex-col gap-5'>
              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Phương thức thanh toán
                </p>
                <BarList
                  items={revenue.byPaymentMethod.map((r) => ({
                    label: PAYMENT_LABELS[r.name] ?? r.name,
                    value: r.revenue,
                    caption: `${formatNumber(r.orders)} đơn`,
                  }))}
                  format={formatCurrency}
                  emptyMessage='Chưa có dữ liệu'
                  accent='bg-success'
                />
              </div>
              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Loại xe
                </p>
                <BarList
                  items={revenueToBars(revenue.byVehicleType)}
                  format={formatCurrency}
                  emptyMessage='Chưa có dữ liệu'
                  accent='bg-primary'
                />
              </div>
            </div>
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
          <Panel title='Trạng thái đặt lịch' className='lg:col-span-1'>
            <ul className='flex flex-col gap-2.5 text-sm'>
              {Object.entries(bookings.statusSummary).map(([key, count]) => (
                <li key={key} className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>
                    {STATUS_LABELS[key] ?? key}
                  </span>
                  <span className='font-semibold text-foreground tabular-nums'>
                    {formatNumber(count)}
                  </span>
                </li>
              ))}
            </ul>
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

      {/* 5 ─ CUSTOMER ANALYTICS */}
      <DashboardSection
        title='Phân tích khách hàng (Customer Analytics)'
        subtitle='Khách nhiều xe nhất, chi tiêu nhiều nhất, đặt lịch nhiều nhất.'
        icon={Users}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Khách hàng mới'
            value={formatNumber(customers.newCustomers)}
            hint='Đăng ký trong kỳ'
            icon={UserPlus}
            tone='primary'
          />
          <KpiCard
            label='Khách quay lại'
            value={formatNumber(customers.returningCustomers)}
            hint='>1 đơn hoàn thành'
            icon={Repeat}
            tone='success'
          />
          <KpiCard
            label='Tỷ lệ quay lại'
            value={formatPercent(customers.retentionRate)}
            icon={TrendingDown}
          />
          <KpiCard
            label='Tổng khách hàng'
            value={formatNumber(overview.totalCustomers)}
            icon={Users}
          />
        </div>
        <div className='grid gap-4 lg:grid-cols-3'>
          <Panel title='Top khách nhiều xe nhất'>
            <RankingTable
              rows={customers.topByVehicles}
              rowKey={(r) => r.id}
              emptyMessage='Chưa có dữ liệu phương tiện'
              columns={[
                { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
                {
                  header: 'Khách hàng',
                  cell: (r) => <span className='font-medium'>{r.name}</span>,
                },
                {
                  header: 'Số xe',
                  align: 'right',
                  cell: (r) => (
                    <span className='font-semibold tabular-nums'>
                      {formatNumber(r.value)}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>
          <Panel title='Top khách chi tiêu nhiều nhất'>
            <RankingTable
              rows={customers.topBySpending}
              rowKey={(r) => r.id}
              emptyMessage='Chưa có chi tiêu trong kỳ này'
              columns={[
                { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
                {
                  header: 'Khách hàng',
                  cell: (r) => <span className='font-medium'>{r.name}</span>,
                },
                {
                  header: 'Chi tiêu',
                  align: 'right',
                  cell: (r) => (
                    <span className='font-semibold tabular-nums'>
                      {formatCurrency(r.value)}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>
          <Panel title='Top khách đặt lịch nhiều nhất'>
            <RankingTable
              rows={customers.topByBookings}
              rowKey={(r) => r.id}
              emptyMessage='Chưa có đặt lịch trong kỳ này'
              columns={[
                { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
                {
                  header: 'Khách hàng',
                  cell: (r) => <span className='font-medium'>{r.name}</span>,
                },
                {
                  header: 'Số đơn',
                  align: 'right',
                  cell: (r) => (
                    <span className='font-semibold tabular-nums'>
                      {formatNumber(r.value)}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>
        </div>
        <Panel title='Phân bố hạng thành viên (Tier)'>
          <BarList
            items={customers.tierDistribution.map((t) => ({
              label: t.name,
              value: t.count,
            }))}
            format={(v) => `${formatNumber(v)} khách`}
            emptyMessage='Chưa có tài khoản loyalty'
            accent='bg-primary'
          />
        </Panel>
      </DashboardSection>

      {/* 6 ─ VEHICLE ANALYTICS */}
      <DashboardSection
        title='Phân tích phương tiện (Vehicle Analytics)'
        subtitle='Loại xe phổ biến và doanh thu theo loại xe.'
        icon={Car}
      >
        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel
            title='Số lượng xe theo loại'
            hint={
              vehicles.topType
                ? `Phổ biến nhất: ${vehicles.topType}`
                : undefined
            }
          >
            <BarList
              items={vehicles.byType.map((v) => ({
                label: v.name,
                value: v.count,
              }))}
              format={(v) => `${formatNumber(v)} xe`}
              emptyMessage='Chưa có phương tiện'
            />
          </Panel>
          <Panel title='Doanh thu theo loại xe'>
            <BarList
              items={revenueToBars(vehicles.revenueByType)}
              format={formatCurrency}
              emptyMessage='Chưa có doanh thu trong kỳ này'
              accent='bg-success'
            />
          </Panel>
        </div>
      </DashboardSection>

      {/* 7 ─ VOUCHER & LOYALTY */}
      <DashboardSection
        title='Voucher & Khách hàng thân thiết (Voucher & Loyalty)'
        subtitle='“Ai là người có nhiều voucher nhất?” và mức độ sử dụng voucher.'
        icon={Gift}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Voucher đã phát'
            value={formatNumber(voucherLoyalty.totalIssued)}
            icon={Ticket}
          />
          <KpiCard
            label='Đã dùng'
            value={formatNumber(voucherLoyalty.used)}
            hint={`Tỷ lệ ${formatPercent(voucherLoyalty.redemptionRate)}`}
            icon={Gift}
            tone='success'
          />
          <KpiCard
            label='Chưa dùng / Hết hạn'
            value={`${formatNumber(voucherLoyalty.unused)} / ${formatNumber(voucherLoyalty.expired)}`}
            icon={Clock}
            tone='warning'
          />
          <KpiCard
            label='Chi phí voucher'
            value={formatCurrency(voucherLoyalty.voucherCost)}
            hint='Theo trần giảm giá đã dùng'
            icon={BadgePercent}
            tone='destructive'
          />
        </div>
        <Panel
          title='Top khách được cấp nhiều voucher nhất'
          hint='Voucher phát trong kỳ đã chọn'
        >
          <RankingTable
            rows={voucherLoyalty.topCustomersByVouchers}
            rowKey={(r) => r.id}
            emptyMessage='Chưa có voucher nào được phát trong kỳ này'
            columns={[
              { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
              {
                header: 'Khách hàng',
                cell: (r) => <span className='font-medium'>{r.name}</span>,
              },
              {
                header: 'Số voucher',
                align: 'right',
                cell: (r) => (
                  <span className='font-semibold tabular-nums'>
                    {formatNumber(r.value)}
                  </span>
                ),
              },
            ]}
          />
        </Panel>
      </DashboardSection>

      {/* 8 ─ SERVICE ANALYTICS */}
      <DashboardSection
        title='Phân tích dịch vụ (Service Analytics)'
        subtitle='Dịch vụ dùng nhiều nhất và tạo doanh thu cao nhất.'
        icon={Layers}
      >
        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel title='Dịch vụ được dùng nhiều nhất'>
            <BarList
              items={services.mostUsed.map((s) => ({
                label: s.name,
                value: s.count,
              }))}
              format={(v) => `${formatNumber(v)} đơn`}
              emptyMessage='Chưa có đặt lịch trong kỳ này'
            />
          </Panel>
          <Panel title='Dịch vụ tạo doanh thu cao nhất'>
            <BarList
              items={revenueToBars(services.byRevenue)}
              format={formatCurrency}
              emptyMessage='Chưa có doanh thu trong kỳ này'
              accent='bg-success'
            />
          </Panel>
        </div>
      </DashboardSection>

      {/* 9 ─ REFUND & DISPUTE */}
      <DashboardSection
        title='Hoàn tiền & Khiếu nại (Refund & Dispute)'
        subtitle='Hoàn tiền và chỉ số làm lại (QC) - proxy cho khiếu nại.'
        icon={Undo2}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Số đơn hoàn tiền'
            value={formatNumber(refundDispute.refundCount)}
            icon={Undo2}
            tone='destructive'
          />
          <KpiCard
            label='Tổng hoàn tiền'
            value={formatCurrency(refundDispute.refundAmount)}
            icon={Banknote}
            tone='destructive'
          />
          <KpiCard
            label='Lượt QC trả về'
            value={formatNumber(refundDispute.qcRejections)}
            hint='Tổng các thợ top'
            icon={AlertTriangle}
            tone='warning'
          />
          <KpiCard
            label='Tỷ lệ làm lại'
            value={formatPercent(refundDispute.reworkRate)}
            hint='Trên đơn hoàn thành'
            icon={Repeat}
          />
        </div>
        <Panel title='Số lần QC trả về theo thợ'>
          <RankingTable
            rows={refundDispute.disputesByWasher}
            rowKey={(r) => r.id}
            emptyMessage='Chưa có lượt QC trả về nào - chất lượng đạt chuẩn'
            columns={[
              { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
              {
                header: 'Thợ rửa',
                cell: (r) => <span className='font-medium'>{r.name}</span>,
              },
              {
                header: 'Lượt trả về',
                align: 'right',
                cell: (r) => (
                  <span className='font-semibold tabular-nums text-warning'>
                    {formatNumber(r.value)}
                  </span>
                ),
              },
            ]}
          />
          {refundDispute.notes.length > 0 && (
            <ul className='mt-4 space-y-1.5 border-t border-border pt-3'>
              {refundDispute.notes.map((note, i) => (
                <li
                  key={i}
                  className='flex gap-2 text-xs text-muted-foreground'
                >
                  <Info className='mt-0.5 size-3.5 shrink-0 text-muted-foreground/60' />
                  {note}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </DashboardSection>

      {/* 10 ─ SCHEDULE & CAPACITY */}
      <DashboardSection
        title='Lịch & Năng lực (Schedule & Capacity)'
        subtitle='Tỷ lệ lấp đầy slot và khung giờ cao điểm.'
        icon={Clock}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Tổng ca làm'
            value={formatNumber(schedule.totalShifts)}
            icon={Clock}
          />
          <KpiCard
            label='Tổng sức chứa'
            value={formatNumber(schedule.totalCapacity)}
            hint='Slot tối đa'
            icon={Layers}
          />
          <KpiCard
            label='Slot đã đặt / trống'
            value={`${formatNumber(schedule.bookedSlots)} / ${formatNumber(schedule.availableSlots)}`}
            icon={CalendarCheck}
          />
          <KpiCard
            label='Tỷ lệ lấp đầy'
            value={formatPercent(schedule.utilizationRate)}
            icon={TrendingDown}
            tone='primary'
          />
        </div>
        <Panel title='Khung giờ cao điểm (Top 3)'>
          {schedule.peakHours.length === 0 ? (
            <EmptyBlock message='Chưa có đặt lịch trong kỳ này' />
          ) : (
            <ul className='flex flex-wrap gap-3'>
              {schedule.peakHours.map((h) => (
                <li
                  key={h.hour}
                  className='flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2'
                >
                  <Clock className='size-4 text-primary' />
                  <span className='font-semibold text-foreground'>
                    {h.hour}:00 – {h.hour + 1}:00
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {formatNumber(h.count)} đơn
                  </span>
                </li>
              ))}
            </ul>
          )}
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
            className='group flex min-w-4.5 flex-1 flex-col items-center justify-end'
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
