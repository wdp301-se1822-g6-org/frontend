import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center',
        className,
      )}
    >
      {Icon && (
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Icon className='h-6 w-6' />
        </div>
      )}
      <h3 className='text-lg font-bold text-foreground'>{title}</h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        {description}
      </p>
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}

export { EmptyState };
