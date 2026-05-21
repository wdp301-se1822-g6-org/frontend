'use client';

import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  /** Khóa duy nhất của cột. */
  id: string;
  /** Tiêu đề cột. */
  header: ReactNode;
  /** Hàm render nội dung ô từ một dòng dữ liệu. */
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Khóa React duy nhất cho mỗi dòng. */
  rowKey: (row: T) => string;
  isLoading?: boolean;
  loadingRows?: number;
  /** Nội dung hiển thị khi không có dữ liệu. */
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
};

/**
 * Bảng dữ liệu dùng chung — gom phần render table + loading + empty
 * để các trang admin/cashier không copy/paste markup bảng.
 */
export function DataTable<T,>({
  columns,
  data,
  rowKey,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className='overflow-hidden rounded-xl border bg-card'>
      <Table>
        <TableHeader className='bg-muted/60'>
          <TableRow className='hover:bg-transparent'>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className='hover:bg-transparent'>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className='h-5 w-full max-w-40' />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={columns.length}
                className='py-12 text-center text-sm text-muted-foreground'
              >
                {emptyState ?? 'Không có dữ liệu.'}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
