'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { socket, setSocketAuth } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppNotification } from '@/types/notification';

/**
 * Kết nối socket khi đã đăng nhập và lắng nghe `notification:new` để cập nhật
 * badge + danh sách thông báo realtime. Render null; chỉ lo phần side-effect.
 */
export function NotificationSocketBridge() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    setSocketAuth(accessToken);
    if (!socket.connected) socket.connect();

    const onNew = (n: AppNotification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast(n.title, { description: n.body });
    };
    socket.on('notification:new', onNew);

    return () => {
      socket.off('notification:new', onNew);
    };
  }, [accessToken, qc]);

  // Ngắt kết nối khi đăng xuất.
  useEffect(() => {
    if (!accessToken && socket.connected) {
      setSocketAuth(null);
      socket.disconnect();
    }
  }, [accessToken]);

  return null;
}
