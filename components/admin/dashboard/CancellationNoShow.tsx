'use client';

import {
  AlertTriangle,
  CalendarX,
  Info,
  TrendingDown,
  UserX,
} from 'lucide-react';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  CancellationNoShowAnalytics,
  CustomerRiskRow,
} from '@/types/dashboard';
import { DonutChart } from './DonutChart';
import {
  BarList,
  DashboardSection,
  EmptyBlock,
  HourStrip,
  KpiCard,
  Panel,
  RankBadge,
  type RankColumn,
  RankingTable,
} from './parts';

/**
 * Cancellation & No-show (Customer Reliability) analytics. Shared by the admin
 * and manager dashboards. `variant='admin'` shows the full breakdown; the
 * manager variant is compact. Phone is rendered only when the backend sent a
 * (masked) value - it is null for the manager scope.
 */
export function CancellationNoShowSection({
  data,
  variant = 'admin',
}: {
  data: CancellationNoShowAnalytics;
  variant?: 'admin' | 'manager';
}) {
  const showPhone =
    data.topCancellingCustomers.some((r) => r.phoneMasked) ||
    data.topNoShowCustomers.some((r) => r.phoneMasked);

  return (
    <DashboardSection
      title='Hủy lịch & Không đến (Cancellation & No-show)'
      subtitle='Khách hàng hay hủy / không đến và độ tin cậy đặt lịch.'
      icon={CalendarX}
    >
      {/* KPI */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <KpiCard
          label='Tổng booking bị huỷ'
          value={formatNumber(data.totalCancelled)}
          hint='Huỷ trong kỳ (theo updated_at)'
          icon={CalendarX}
          tone='destructive'
        />
        <KpiCard
          label='Tỷ lệ huỷ'
          value={formatPercent(data.cancellationRate)}
          icon={TrendingDown}
          tone='warning'
        />
        <KpiCard
          label='Tổng booking không đến'
          value={formatNumber(data.totalNoShow)}
          hint='No-show trong kỳ'
          icon={UserX}
          tone='destructive'
        />
        <KpiCard
          label='Tỷ lệ không đến'
          value={formatPercent(data.noShowRate)}
          icon={AlertTriangle}
          tone='warning'
        />
      </div>

      {/* Trend + reason */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Panel title='Xu hướng huỷ & không đến theo ngày'>
          <TrendChart data={data.trendByDay} />
        </Panel>
        <Panel
          title='Cơ cấu lý do huỷ'
          hint='Theo trường cancel_reason của đơn'
        >
          <DonutChart
            data={data.cancellationReasons.map((r) => ({
              label: r.name,
              value: r.count,
            }))}
            centerCaption='lượt huỷ'
            emptyMessage='Chưa có booking bị huỷ trong khoảng thời gian này'
          />
        </Panel>
      </div>

      {/* Ranking tables */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Panel title='Top khách huỷ nhiều nhất'>
          <RankingTable
            rows={data.topCancellingCustomers}
            rowKey={(r) => r.id}
            emptyMessage='Chưa có dữ liệu khách hàng huỷ đơn'
            columns={riskColumns('Số lần huỷ', showPhone)}
          />
        </Panel>
        <Panel title='Top khách không đến nhiều nhất'>
          <RankingTable
            rows={data.topNoShowCustomers}
            rowKey={(r) => r.id}
            emptyMessage='Chưa có dữ liệu khách hàng không đến'
            columns={riskColumns('Số lần no-show', showPhone)}
          />
        </Panel>
      </div>

      {/* No-show by time slot (both variants) */}
      <Panel
        title='Không đến theo khung giờ'
        hint='Theo giờ hẹn của đơn (scheduled_at)'
      >
        <HourStrip
          data={data.noShowByHour}
          emptyMessage='Chưa có booking no-show trong khoảng thời gian này'
        />
      </Panel>

      {/* Admin-only deeper breakdown */}
      {variant === 'admin' && (
        <div className='grid gap-4 lg:grid-cols-2'>
          <Panel title='Dịch vụ bị huỷ nhiều nhất'>
            <BarList
              items={data.cancelledByService.map((s) => ({
                label: s.name,
                value: s.count,
              }))}
              format={(v) => `${formatNumber(v)} lượt`}
              emptyMessage='Chưa có booking bị huỷ trong khoảng thời gian này'
              accent='bg-destructive'
            />
          </Panel>
          <Panel title='Dịch vụ bị no-show nhiều nhất'>
            <BarList
              items={data.noShowByService.map((s) => ({
                label: s.name,
                value: s.count,
              }))}
              format={(v) => `${formatNumber(v)} lượt`}
              emptyMessage='Chưa có booking no-show trong khoảng thời gian này'
              accent='bg-warning'
            />
          </Panel>
        </div>
      )}

      {data.notes.length > 0 && (
        <ul className='space-y-1.5 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3'>
          {data.notes.map((note, i) => (
            <li key={i} className='flex gap-2 text-xs text-muted-foreground'>
              <Info className='mt-0.5 size-3.5 shrink-0 text-muted-foreground/60' />
              {note}
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}

function riskColumns(
  countHeader: string,
  showPhone: boolean,
): RankColumn<CustomerRiskRow>[] {
  const cols: RankColumn<CustomerRiskRow>[] = [
    { header: '#', cell: (_r, i) => <RankBadge index={i} /> },
    {
      header: 'Khách hàng',
      cell: (r) => <span className='font-medium text-foreground'>{r.name}</span>,
    },
  ];
  if (showPhone) {
    cols.push({
      header: 'Điện thoại',
      cell: (r) => (
        <span className='font-mono text-xs text-muted-foreground'>
          {r.phoneMasked ?? '—'}
        </span>
      ),
    });
  }
  cols.push(
    {
      header: 'Tổng booking',
      align: 'right',
      cell: (r) => (
        <span className='tabular-nums text-muted-foreground'>
          {formatNumber(r.totalBookings)}
        </span>
      ),
    },
    {
      header: countHeader,
      align: 'right',
      cell: (r) => (
        <span className='font-semibold tabular-nums'>
          {formatNumber(r.count)}
        </span>
      ),
    },
    {
      header: 'Tỷ lệ',
      align: 'right',
      cell: (r) => (
        <span
          className={cn(
            'tabular-nums font-medium',
            r.rate >= 50
              ? 'text-destructive'
              : r.rate >= 25
                ? 'text-warning'
                : 'text-muted-foreground',
          )}
        >
          {formatPercent(r.rate)}
        </span>
      ),
    },
    {
      header: 'Gần nhất',
      align: 'right',
      cell: (r) => (
        <span className='tabular-nums text-muted-foreground'>
          {r.lastAt ? formatDate(r.lastAt) : '—'}
        </span>
      ),
    },
  );
  return cols;
}

/** Grouped daily bars: cancelled (rose) vs no-show (amber). */
function TrendChart({
  data,
}: {
  data: { key: string; cancelled: number; noShow: number }[];
}) {
  const total = data.reduce((s, d) => s + d.cancelled + d.noShow, 0);
  if (total === 0) {
    return (
      <EmptyBlock message='Chưa có huỷ / no-show trong khoảng thời gian này' />
    );
  }
  const max = Math.max(...data.map((d) => Math.max(d.cancelled, d.noShow)), 1);
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
        <span className='flex items-center gap-1.5'>
          <span className='size-2.5 rounded-full bg-destructive' /> Huỷ
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='size-2.5 rounded-full bg-warning' /> Không đến
        </span>
      </div>
      <div className='flex items-end gap-1.5 overflow-x-auto' style={{ height: 150 }}>
        {data.map((d) => (
          <div
            key={d.key}
            className='group flex min-w-4.5 max-w-16 flex-1 flex-col items-center justify-end gap-1'
            style={{ height: '100%' }}
            title={`${d.key}: huỷ ${d.cancelled}, không đến ${d.noShow}`}
          >
            <div className='flex h-full w-full items-end justify-center gap-0.5'>
              <div
                className='w-1/2 rounded-t-sm bg-destructive/70 transition-colors group-hover:bg-destructive'
                style={{ height: `${Math.max((d.cancelled / max) * 100, d.cancelled ? 4 : 0)}%` }}
              />
              <div
                className='w-1/2 rounded-t-sm bg-warning/70 transition-colors group-hover:bg-warning'
                style={{ height: `${Math.max((d.noShow / max) * 100, d.noShow ? 4 : 0)}%` }}
              />
            </div>
            <span className='whitespace-nowrap text-[9px] text-muted-foreground'>
              {d.key.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
