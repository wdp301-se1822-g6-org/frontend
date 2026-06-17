'use client';

/**
 * Manager Operational Dashboard — a scoped, simpler view of the management
 * report. It consumes the SAME GET /admin/dashboard endpoint, but the backend
 * redacts customer-identifying rankings for the manager role (top customers by
 * spending / vehicles / bookings / vouchers), so this page never renders them.
 * Focus: operational KPIs, booking/service/washer/voucher summaries, schedule
 * utilisation and overview donut charts — all synced to the time filter.
 */

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarCheck,
  CircleDollarSign,
  Clock,
  CreditCard,
  Gift,
  Layers,
  TrendingDown,
  Undo2,
  Wrench,
} from 'lucide-react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  DateRangeFilter,
  type DateFilterValue,
} from '@/components/admin/dashboard/DateRangeFilter';
import { CancellationNoShowSection } from '@/components/admin/dashboard/CancellationNoShow';
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

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  in_progress: 'Đang rửa',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

export default function ManagerDashboardPage() {
  const [filter, setFilter] = useState<DateFilterValue>(() => ({
    period: DEFAULT_PERIOD,
    range: getRangeForPeriod(DEFAULT_PERIOD),
  }));

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      'manager-dashboard',
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
    placeholderData: keepPreviousData,
  });

  const isRefetching = isFetching && !isLoading;

  return (
    <>
      <AdminTopbar
        title='Báo cáo vận hành'
        subtitle='Số liệu vận hành theo thời gian thực - chỉ phục vụ quản lý ca, thợ, dịch vụ.'
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
                    chỉ số sẽ hiển thị 0.
                  </div>
                )}
                <ManagerBody report={data} />
              </div>
            )}
          </QueryBoundary>
        </div>
      </main>
    </>
  );
}

function ManagerBody({ report }: { report: DashboardReport }) {
  const { overview, revenue, bookings, washers, vehicles } = report;
  const { voucherLoyalty, services, refundDispute, schedule } = report;

  return (
    <div className='flex flex-col gap-10'>
      {/* 1 - OVERVIEW */}
      <DashboardSection
        title='Tổng quan vận hành'
        subtitle='Các chỉ số chính trong kỳ đã chọn.'
        icon={Layers}
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
            label='Đang chờ xử lý'
            value={formatNumber(overview.pendingBookings)}
            hint='Chưa hoàn thành'
            icon={Clock}
          />
          <KpiCard
            label='Huỷ / Không đến'
            value={`${formatNumber(overview.cancelledBookings)} / ${formatNumber(overview.noShowBookings)}`}
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
            label='Voucher đã dùng'
            value={formatNumber(overview.usedVouchers)}
            icon={Gift}
          />
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel title='Tỷ trọng trạng thái đặt lịch'>
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
        </div>
      </DashboardSection>

      {/* 2 - BOOKING SUMMARY */}
      <DashboardSection
        title='Tình hình đặt lịch'
        subtitle='Tỷ lệ hoàn thành/huỷ/không đến và khung giờ đông khách.'
        icon={CalendarCheck}
      >
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
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
            label='Doanh thu kỳ này'
            value={formatCurrency(revenue.net)}
            icon={CircleDollarSign}
          />
        </div>
        <Panel
          title='Khung giờ đông khách'
          hint='Số đơn theo giờ trong ngày - cột đậm là giờ cao điểm'
        >
          <HourStrip
            data={bookings.byHour}
            emptyMessage='Chưa có đặt lịch trong khoảng thời gian này'
          />
        </Panel>
      </DashboardSection>

      {/* 3 - WASHER PERFORMANCE */}
      <DashboardSection
        title='Hiệu suất thợ rửa'
        subtitle='Top thợ theo số lượt rửa hoàn thành trong kỳ.'
        icon={Wrench}
      >
        <Panel title='Top thợ rửa'>
          <RankingTable
            rows={washers}
            rowKey={(w) => w.id}
            emptyMessage='Chưa có thợ nào hoàn thành lượt rửa trong khoảng thời gian này'
            columns={[
              { header: '#', cell: (_w, i) => <RankBadge index={i} /> },
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
                      : 'Chưa có'}
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
            ]}
          />
        </Panel>
      </DashboardSection>

      {/* 4 - SERVICE & VEHICLE */}
      <DashboardSection
        title='Dịch vụ & Phương tiện'
        subtitle='Dịch vụ bán chạy, doanh thu theo dịch vụ và cơ cấu loại xe.'
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
              emptyMessage='Chưa có đặt lịch trong khoảng thời gian này'
            />
          </Panel>
          <Panel title='Doanh thu theo dịch vụ'>
            <BarList
              items={services.byRevenue.map((s) => ({
                label: s.name,
                value: s.revenue,
                caption: `${formatNumber(s.orders)} đơn`,
              }))}
              format={formatCurrency}
              emptyMessage='Chưa có doanh thu trong khoảng thời gian này'
              accent='bg-success'
            />
          </Panel>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel
            title='Cơ cấu loại xe hiện có'
            hint='Tổng xe trên hệ thống (không theo kỳ)'
          >
            <DonutChart
              data={vehicles.byType.map((v) => ({
                label: v.name,
                value: v.count,
              }))}
              formatValue={(v) => `${formatNumber(v)} xe`}
              centerCaption='xe'
              emptyMessage='Chưa có phương tiện nào'
            />
          </Panel>
          <Panel title='Doanh thu theo loại xe'>
            <BarList
              items={vehicles.revenueByType.map((v) => ({
                label: v.name,
                value: v.revenue,
                caption: `${formatNumber(v.orders)} đơn`,
              }))}
              format={formatCurrency}
              emptyMessage='Chưa có doanh thu trong khoảng thời gian này'
              accent='bg-success'
            />
          </Panel>
        </div>
      </DashboardSection>

      {/* 5 - VOUCHER & REFUND SUMMARY */}
      <DashboardSection
        title='Voucher & Hoàn tiền (tổng quan)'
        subtitle='Mức độ sử dụng voucher và hoàn tiền - chỉ ở mức tổng hợp.'
        icon={Gift}
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <KpiCard
            label='Voucher đã phát'
            value={formatNumber(voucherLoyalty.totalIssued)}
            icon={Gift}
          />
          <KpiCard
            label='Đã dùng'
            value={formatNumber(voucherLoyalty.used)}
            hint={`Tỷ lệ ${formatPercent(voucherLoyalty.redemptionRate)}`}
            icon={Gift}
            tone='success'
          />
          <KpiCard
            label='Số đơn hoàn tiền'
            value={formatNumber(refundDispute.refundCount)}
            icon={Undo2}
            tone='destructive'
          />
          <KpiCard
            label='Lượt QC trả về'
            value={formatNumber(refundDispute.qcRejections)}
            hint={`Tỷ lệ làm lại ${formatPercent(refundDispute.reworkRate)}`}
            icon={AlertTriangle}
            tone='warning'
          />
        </div>
        <Panel title='Tỷ trọng trạng thái voucher'>
          <DonutChart
            data={[
              { label: 'Chưa dùng', value: voucherLoyalty.unused },
              { label: 'Đã dùng', value: voucherLoyalty.used },
              { label: 'Hết hạn', value: voucherLoyalty.expired },
            ]}
            centerCaption='voucher'
            emptyMessage='Chưa có voucher nào trong khoảng thời gian này'
          />
        </Panel>
      </DashboardSection>

      {/* 6 - CANCELLATION & NO-SHOW (compact) */}
      {report.cancellationNoShow && (
        <CancellationNoShowSection
          data={report.cancellationNoShow}
          variant='manager'
        />
      )}

      {/* 7 - SCHEDULE */}
      <DashboardSection
        title='Lịch & Năng lực'
        subtitle='Tỷ lệ lấp đầy slot và khung giờ cao điểm.'
        icon={Clock}
      >
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
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
        </div>
        <Panel title='Khung giờ cao điểm (Top 3)'>
          {schedule.peakHours.length === 0 ? (
            <EmptyBlock message='Chưa có đặt lịch trong khoảng thời gian này' />
          ) : (
            <ul className='flex flex-wrap gap-3'>
              {schedule.peakHours.map((h) => (
                <li
                  key={h.hour}
                  className='flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2'
                >
                  <Clock className='size-4 text-primary' />
                  <span className='font-semibold text-foreground'>
                    {h.hour}:00 - {h.hour + 1}:00
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
      <div className='grid gap-4 lg:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className='h-64 animate-pulse rounded-xl border border-border bg-muted/40'
          />
        ))}
      </div>
    </div>
  );
}
