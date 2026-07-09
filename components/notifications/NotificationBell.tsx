'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/customer-api';
import { useNotifications, useUnreadCount } from '@/hooks/notifications/useNotifications';
import { NOTI_META, fallbackMeta, timeAgo } from './notification-meta';
import { cn } from '@/lib/utils';

/** Chuông thông báo + dropdown 5 mục gần nhất. Dùng ở navbar khách. */
export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications(1, 6);
  const items = data?.data ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['notifications-unread'] });
  };

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  // Đóng khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-label='Thông báo'
        className='relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Bell className='h-5 w-5' />
        {unread > 0 && (
          <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg'>
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <span className='font-heading text-sm font-semibold text-foreground'>
              Thông báo
            </span>
            {unread > 0 && (
              <button
                type='button'
                onClick={() => readAll.mutate()}
                disabled={readAll.isPending}
                className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50'
              >
                <Check className='h-3.5 w-3.5' /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {isLoading ? (
              <div className='space-y-2 p-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='h-12 rounded-lg bg-muted animate-pulse' />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className='px-4 py-10 text-center text-sm text-muted-foreground'>
                <Bell className='mx-auto mb-2 h-6 w-6 text-placeholder' />
                Chưa có thông báo nào.
              </div>
            ) : (
              <ul className='divide-y divide-border'>
                {items.map((n) => {
                  const meta = NOTI_META[n.type] ?? fallbackMeta;
                  const Icon = meta.icon;
                  return (
                    <li key={n.id}>
                      <button
                        type='button'
                        onClick={() => {
                          if (!n.isRead) readOne.mutate(n.id);
                        }}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                          !n.isRead && 'bg-accent/50',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            meta.tone,
                          )}
                        >
                          <Icon className='h-4 w-4' />
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='flex items-center gap-2'>
                            <span className='truncate text-sm font-medium text-foreground'>
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-primary' />
                            )}
                          </span>
                          <span className='mt-0.5 block text-xs text-muted-foreground line-clamp-2'>
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
            )}
          </div>

          <Link
            href='/profile/notifications'
            onClick={() => setOpen(false)}
            className='block border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted/50'
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
