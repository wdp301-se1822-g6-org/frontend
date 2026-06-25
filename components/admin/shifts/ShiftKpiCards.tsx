import {
  CalendarRange,
  PlayCircle,
  Clock4,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { computeKpis, type Shift } from '@/lib/shift-helpers';

type KpiTone = 'primary' | 'success' | 'info' | 'warning' | 'destructive';

const TONE_STYLES: Record<KpiTone, { icon: string; value: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', value: 'text-foreground' },
  success: { icon: 'bg-success/10 text-success', value: 'text-success' },
  info: { icon: 'bg-info/10 text-info', value: 'text-info' },
  warning: { icon: 'bg-warning/15 text-warning', value: 'text-warning' },
  destructive: { icon: 'bg-destructive/10 text-destructive', value: 'text-destructive' },
};

type ShiftKpiCardsProps = {
  shifts: Shift[];
  loading?: boolean;
};

export function ShiftKpiCards({ shifts, loading }: ShiftKpiCardsProps) {
  const kpis = computeKpis(shifts);

  const cards: { label: string; value: number; tone: KpiTone; icon: LucideIcon }[] = [
    { label: 'Tổng ca', value: kpis.total, tone: 'primary', icon: CalendarRange },
    { label: 'Đang diễn ra', value: kpis.active, tone: 'success', icon: PlayCircle },
    { label: 'Sắp tới', value: kpis.upcoming, tone: 'info', icon: Clock4 },
    { label: 'Quá hạn', value: kpis.overdue, tone: 'warning', icon: AlertTriangle },
    { label: 'Đã hủy', value: kpis.cancelled, tone: 'destructive', icon: XCircle },
  ];

  if (loading) {
    return (
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
        {cards.map((c) => (
          <div
            key={c.label}
            className='h-[88px] animate-pulse rounded-xl border border-border bg-card'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
      {cards.map((c) => {
        const tone = TONE_STYLES[c.tone];
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className='flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                tone.icon,
              )}
            >
              <Icon className='size-5' />
            </div>
            <div className='min-w-0'>
              <p className={cn('text-2xl font-bold leading-none tabular-nums', tone.value)}>
                {c.value}
              </p>
              <p className='mt-1 truncate text-sm text-muted-foreground'>{c.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
