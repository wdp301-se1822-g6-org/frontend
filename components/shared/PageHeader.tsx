import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Breadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  /** Nút/hành động hiển thị bên phải tiêu đề. */
  actions?: ReactNode;
  className?: string;
};

/**
 * Tiêu đề chuẩn cho mọi trang dashboard (staff/admin).
 * Đảm bảo breadcrumb + tiêu đề + action đồng nhất giữa các trang.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label='Breadcrumb'
          className='flex items-center gap-1 text-xs text-muted-foreground'
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className='flex items-center gap-1'>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className='transition-colors hover:text-foreground'
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && 'text-foreground')}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className='size-3' />}
              </span>
            );
          })}
        </nav>
      )}

      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
            {title}
          </h1>
          {description && (
            <p className='text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
        {actions && (
          <div className='flex shrink-0 items-center gap-2'>{actions}</div>
        )}
      </div>
    </div>
  );
}
