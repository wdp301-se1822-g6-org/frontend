import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Ghi chú phụ dưới giá trị. */
  hint?: string;
  /** Xu hướng so với kỳ trước. */
  trend?: { value: string; direction: 'up' | 'down' };
  className?: string;
};

/** Thẻ số liệu cho dashboard admin/manager (doanh thu, số đơn, ...). */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardContent className='flex items-start justify-between gap-4 p-5'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>{label}</p>
          <p className='font-heading text-2xl font-bold tracking-tight text-foreground'>
            {value}
          </p>
          {(hint || trend) && (
            <div className='flex items-center gap-1.5 text-xs'>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    trend.direction === 'up'
                      ? 'text-success'
                      : 'text-destructive',
                  )}
                >
                  {trend.direction === 'up' ? (
                    <ArrowUpRight className='size-3.5' />
                  ) : (
                    <ArrowDownRight className='size-3.5' />
                  )}
                  {trend.value}
                </span>
              )}
              {hint && <span className='text-muted-foreground'>{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
