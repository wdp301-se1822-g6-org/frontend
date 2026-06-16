'use client';

import { useState } from 'react';
import { CalendarRange, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PERIOD,
  formatRangeLabel,
  getRangeForPeriod,
  validateCustomRange,
  type DashboardPeriod,
  type DateRange,
} from '@/lib/date-range';

export interface DateFilterValue {
  period: DashboardPeriod;
  range: DateRange;
}

interface DateRangeFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  /** Subtle hint shown while the dashboard is refetching. */
  isFetching?: boolean;
}

const PRIMARY: { key: DashboardPeriod; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm nay' },
  { key: 'custom', label: 'Tùy chọn' },
];

const MORE: { key: DashboardPeriod; label: string }[] = [
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'last7', label: '7 ngày qua' },
  { key: 'last30', label: '30 ngày qua' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'lastQuarter', label: 'Quý trước' },
  { key: 'lastYear', label: 'Năm trước' },
];

const ALL_LABELS = [...PRIMARY, ...MORE].reduce<Record<string, string>>(
  (acc, p) => ({ ...acc, [p.key]: p.label }),
  {},
);

/**
 * Shared time-range filter applied to the entire dashboard. Presets commit
 * immediately; a custom range only fires after "Áp dụng" (with validation) so
 * we never spam the API while the user is still picking dates.
 */
export function DateRangeFilter({
  value,
  onChange,
  isFetching,
}: DateRangeFilterProps) {
  const [draftFrom, setDraftFrom] = useState(value.range.from);
  const [draftTo, setDraftTo] = useState(value.range.to);

  const selectPreset = (period: DashboardPeriod) => {
    if (period === 'custom') {
      // Open the custom panel seeded with the current window, but don't refetch
      // until the user applies a range.
      setDraftFrom(value.range.from);
      setDraftTo(value.range.to);
      onChange({ period: 'custom', range: value.range });
      return;
    }
    onChange({ period, range: getRangeForPeriod(period) });
  };

  const customError =
    value.period === 'custom' ? validateCustomRange(draftFrom, draftTo) : null;

  const applyCustom = () => {
    if (validateCustomRange(draftFrom, draftTo)) return;
    onChange({ period: 'custom', range: { from: draftFrom, to: draftTo } });
  };

  const reset = () => {
    onChange({
      period: DEFAULT_PERIOD,
      range: getRangeForPeriod(DEFAULT_PERIOD),
    });
  };

  const isMoreActive = MORE.some((m) => m.key === value.period);

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <CalendarRange className='ml-1 size-4 shrink-0 text-muted-foreground' />

        <div className='flex flex-wrap gap-1'>
          {PRIMARY.map((p) => (
            <button
              key={p.key}
              type='button'
              onClick={() => selectPreset(p.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                value.period === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {p.label}
            </button>
          ))}

          {/* More presets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isMoreActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {isMoreActive ? ALL_LABELS[value.period] : 'Khác'}
                <ChevronDown className='size-3.5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              {MORE.map((m) => (
                <DropdownMenuItem
                  key={m.key}
                  onClick={() => selectPreset(m.key)}
                  className='flex items-center justify-between gap-4'
                >
                  {m.label}
                  {value.period === m.key && <Check className='size-4' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active range label */}
        <span className='ml-1 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground'>
          <span className='text-muted-foreground'>Đang xem:</span>
          {formatRangeLabel(value.period, value.range)}
        </span>

        <div className='ml-auto flex items-center gap-2'>
          {isFetching && (
            <span className='text-xs text-muted-foreground'>Đang tải…</span>
          )}
          <Button
            variant='ghost'
            size='sm'
            onClick={reset}
            className='gap-1.5'
            title='Đặt lại về Tháng này'
          >
            <RotateCcw className='size-3.5' />
            Đặt lại
          </Button>
        </div>
      </div>

      {/* Custom range panel */}
      {value.period === 'custom' && (
        <div className='flex flex-wrap items-end gap-3 border-t border-border pt-3'>
          <label className='flex flex-col gap-1 text-xs font-medium text-muted-foreground'>
            Từ ngày
            <input
              type='date'
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              className='rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'
            />
          </label>
          <label className='flex flex-col gap-1 text-xs font-medium text-muted-foreground'>
            Đến ngày
            <input
              type='date'
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              className='rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'
            />
          </label>
          <Button
            size='sm'
            onClick={applyCustom}
            disabled={!!customError}
            className='mb-0.5'
          >
            Áp dụng
          </Button>
          {customError && (
            <p className='mb-1.5 text-xs font-medium text-destructive'>
              {customError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
