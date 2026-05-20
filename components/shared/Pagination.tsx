'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Sinh dãy số trang gọn với dấu "…" cho danh sách dài. */
function getPageItems(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < totalPages - 1) items.push('gap');
  items.push(totalPages);
  return items;
}

/** Phân trang dùng chung cho mọi danh sách/bảng. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav
      aria-label='Phân trang'
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant='outline'
        size='icon'
        aria-label='Trang trước'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>

      {items.map((item, index) =>
        item === 'gap' ? (
          <span
            key={`gap-${index}`}
            className='px-2 text-sm text-muted-foreground'
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'default' : 'outline'}
            size='icon'
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant='outline'
        size='icon'
        aria-label='Trang sau'
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
