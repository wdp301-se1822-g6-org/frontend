import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type QueryBoundaryProps = {
  isLoading: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  /** Tùy biến trạng thái loading (mặc định: skeleton). */
  loading?: ReactNode;
  /** Tùy biến trạng thái lỗi. */
  error?: ReactNode;
  /** Tùy biến trạng thái rỗng. */
  empty?: ReactNode;
  /** Gọi lại API khi bấm "Thử lại" ở trạng thái lỗi mặc định. */
  onRetry?: () => void;
  children: ReactNode;
};

/**
 * Bọc một vùng có fetch dữ liệu để xử lý loading/error/empty đồng nhất.
 * Trang không tự viết if/else cho 3 trạng thái này nữa.
 */
export function QueryBoundary({
  isLoading,
  isError = false,
  isEmpty = false,
  loading,
  error,
  empty,
  onRetry,
  children,
}: QueryBoundaryProps) {
  if (isLoading) {
    return <>{loading ?? <DefaultLoading />}</>;
  }

  if (isError) {
    return (
      <>
        {error ?? (
          <EmptyState
            icon={AlertTriangle}
            title='Không tải được dữ liệu'
            description='Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.'
            action={
              onRetry && (
                <Button variant='outline' onClick={onRetry}>
                  Thử lại
                </Button>
              )
            }
          />
        )}
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        {empty ?? (
          <EmptyState
            title='Chưa có dữ liệu'
            description='Hiện chưa có nội dung nào để hiển thị.'
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}

function DefaultLoading() {
  return (
    <div className='space-y-3'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className='h-14 w-full rounded-lg' />
      ))}
    </div>
  );
}
