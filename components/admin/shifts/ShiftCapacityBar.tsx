import { cn } from '@/lib/utils';
import { getCapacity, type Shift } from '@/lib/shift-helpers';

type ShiftCapacityBarProps = {
  shift: Shift;
  className?: string;
};

/**
 * Hiển thị sức chứa của ca (số xe đã nhận / tối đa) dạng "x/y" + progress bar.
 * Màu thanh đổi theo mức lấp đầy: xanh → hổ phách → đỏ khi đầy.
 */
export function ShiftCapacityBar({ shift, className }: ShiftCapacityBarProps) {
  const { current, max, free, ratio, isFull, hasData } = getCapacity(shift);

  if (!hasData) {
    // Ca không đặt giới hạn riêng: hệ thống mặc định mỗi thợ nhận
    // 1 xe tại một thời điểm (slot 30 phút) — nói đúng bản chất thay
    // vì "Chưa giới hạn" dễ gây hiểu nhầm là nhận vô hạn xe.
    return (
      <div className={cn('min-w-[120px]', className)}>
        <span className='text-sm text-muted-foreground'>1 xe / thời điểm</span>
      </div>
    );
  }

  const barColor = isFull
    ? 'bg-destructive'
    : ratio >= 0.8
      ? 'bg-warning'
      : 'bg-success';

  return (
    <div className={cn('min-w-[120px]', className)}>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-sm font-semibold text-foreground tabular-nums'>
          {current}/{max} <span className='font-normal text-muted-foreground'>xe</span>
        </span>
        <span
          className={cn(
            'text-xs font-medium',
            isFull ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {isFull ? 'Hết chỗ' : `Còn ${free}`}
        </span>
      </div>
      <div
        className='mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted'
        role='progressbar'
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max ?? undefined}
        aria-label={`Đã nhận ${current} trên ${max} xe`}
      >
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.max(ratio * 100, current > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
}
