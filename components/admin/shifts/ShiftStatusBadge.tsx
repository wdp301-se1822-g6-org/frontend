import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_META, type ShiftStatusKey } from '@/lib/shift-helpers';

type ShiftStatusBadgeProps = {
  status: ShiftStatusKey;
  className?: string;
};

/**
 * Badge trạng thái ca — luôn kèm text rõ ràng (không dùng màu làm tín hiệu
 * duy nhất) và một chấm màu semantic để dễ quét nhanh.
 */
export function ShiftStatusBadge({ status, className }: ShiftStatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.unknown;
  return (
    <Badge variant={meta.badgeVariant} className={cn('gap-1.5 py-1', className)}>
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} aria-hidden />
      {meta.label}
    </Badge>
  );
}
