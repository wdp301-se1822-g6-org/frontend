import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  description?: string;
  /** Nút/hành động hiển thị bên phải. */
  action?: ReactNode;
  className?: string;
};

/** Tiêu đề cho một khối nội dung bên trong trang (card, section). */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3',
        className,
      )}
    >
      <div className='space-y-1'>
        <h2 className='font-heading text-lg font-semibold text-foreground'>
          {title}
        </h2>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  );
}
