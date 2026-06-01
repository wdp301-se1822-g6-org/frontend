import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/constants';

/** Ánh xạ tông trạng thái -> variant của Badge. */
const TONE_TO_VARIANT: Record<
  StatusTone,
  'default' | 'info' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  primary: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  muted: 'muted',
};

type StatusBadgeProps = {
  /** Nhãn hiển thị, ví dụ "Hoàn thành". */
  label: string;
  /** Tông màu - lấy từ `*_STATUS_META` trong constants. */
  tone?: StatusTone;
  /** Hiện chấm tròn màu phía trước. */
  withDot?: boolean;
  className?: string;
};

/**
 * Badge trạng thái dùng chung cho mọi loại status (order, payment, ...).
 * Mọi màu trạng thái trong app phải đi qua component này để đồng nhất.
 */
export function StatusBadge({
  label,
  tone = 'muted',
  withDot = true,
  className,
}: StatusBadgeProps) {
  return (
    <Badge variant={TONE_TO_VARIANT[tone]} className={cn('gap-1.5', className)}>
      {withDot && (
        <span className='size-1.5 rounded-full bg-current' aria-hidden />
      )}
      {label}
    </Badge>
  );
}
