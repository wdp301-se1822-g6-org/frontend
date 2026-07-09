'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/customer-api';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import {
  NOTI_META,
  fallbackMeta,
  timeAgo,
} from '@/components/notifications/notification-meta';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page, 20);
  const items = data?.data ?? [];
  const meta = data?.meta;
  const unread = data?.unread ?? 0;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['notifications'] }).then(() =>
      qc.invalidateQueries({ queryKey: ['notifications-unread'] }),
    );

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='font-heading text-2xl font-semibold text-foreground flex items-center gap-2'>
            <Bell className='w-7 h-7 text-primary' /> Thông báo
          </h1>
          <p className='text-sm text-muted-foreground'>
            Cập nhật về đơn đặt lịch và tiến trình rửa xe của bạn.
          </p>
        </div>
        {unread > 0 && (
          <button
            type='button'
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending}
            className='inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50'
          >
            <Check className='h-4 w-4' /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {isLoading ? (
        <div className='flex flex-col items-center justify-center min-h-75 gap-3'>
          <Spinner className='size-8 text-primary' />
          <p className='text-sm text-muted-foreground'>Đang tải thông báo...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title='Chưa có thông báo nào'
          description='Khi có cập nhật về đơn đặt lịch hoặc quá trình rửa xe, thông báo sẽ xuất hiện ở đây.'
        />
      ) : (
        <>
          <ul className='divide-y divide-border rounded-xl border border-border bg-card overflow-hidden'>
            {items.map((n) => {
              const m = NOTI_META[n.type] ?? fallbackMeta;
              const Icon = m.icon;
              return (
                <li key={n.id}>
                  <button
                    type='button'
                    onClick={() => {
                      if (!n.isRead) readOne.mutate(n.id);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-muted/50',
                      !n.isRead && 'bg-accent/40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        m.tone,
                      )}
                    >
                      <Icon className='h-4 w-4' />
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='flex items-center gap-2'>
                        <span className='text-sm font-semibold text-foreground'>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-primary' />
                        )}
                      </span>
                      <span className='mt-0.5 block text-sm text-muted-foreground'>
                        {n.body}
                      </span>
                      <span className='mt-1 block text-[11px] text-placeholder'>
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {meta && meta.totalPages > 1 && (
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>
                Trang {meta.page}/{meta.totalPages} · {meta.total} thông báo
              </span>
              <div className='flex gap-2'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className='rounded-lg border border-border bg-card px-3 py-1.5 font-medium disabled:opacity-40'
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page >= meta.totalPages}
                  className='rounded-lg border border-border bg-card px-3 py-1.5 font-medium disabled:opacity-40'
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
