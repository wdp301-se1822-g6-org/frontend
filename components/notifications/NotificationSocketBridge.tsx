'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { socket, setSocketAuth } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppNotification } from '@/types/notification';

/**
 * Kết nối socket khi đã đăng nhập và quản lý vòng đời kết nối cho cả app:
 *
 * - `notification:new` → cập nhật badge + danh sách thông báo + toast.
 * - `auth:error` / handshake bị từ chối vì token hết hạn → refresh token qua
 *   REST; store đổi accessToken làm effect chạy lại và tự connect với token
 *   mới. (BE chủ động ngắt socket khi token hết hạn — reason
 *   "io server disconnect" — socket.io client KHÔNG tự nối lại trường hợp này.)
 * - Nối lại sau khi rớt → refetch toàn bộ query đang active để bù các event
 *   realtime đã lỡ trong lúc mất kết nối.
 *
 * Render null; chỉ lo phần side-effect.
 */
export function NotificationSocketBridge() {
  const qc = useQueryClient();
  const { accessToken, refreshAccessToken } = useAuthStore();

  // true kể từ lúc rớt kết nối cho tới lần connect kế tiếp.
  const wasDisconnected = useRef(false);

  useEffect(() => {
    if (!accessToken) return;

    setSocketAuth(accessToken);
    if (!socket.connected) socket.connect();

    const onNew = (n: AppNotification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast(n.title, { description: n.body });
    };

    // Token hết hạn giữa chừng: BE bắn auth:error rồi ngắt. Refresh xong,
    // accessToken trong store đổi → effect này chạy lại và connect lại.
    const onAuthError = () => {
      void refreshAccessToken().catch(() => {
        // Refresh thất bại → store đã tự xoá phiên; effect logout bên dưới ngắt socket.
      });
    };

    // Handshake bị từ chối (mở lại tab sau khi token hết hạn).
    const onConnectError = (err: Error & { data?: { code?: string } }) => {
      if (err?.data?.code?.startsWith('AUTH')) onAuthError();
    };

    const onDisconnect = (reason: string) => {
      wasDisconnected.current = true;
      // BE chủ động ngắt (token hết hạn) — client phải tự refresh + nối lại.
      if (reason === 'io server disconnect') onAuthError();
    };

    // Sau khi nối lại: dữ liệu có thể đã thay đổi trong lúc mất kết nối.
    const onConnect = () => {
      if (wasDisconnected.current) {
        wasDisconnected.current = false;
        void qc.invalidateQueries();
      }
    };

    socket.on('notification:new', onNew);
    socket.on('auth:error', onAuthError);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);

    return () => {
      socket.off('notification:new', onNew);
      socket.off('auth:error', onAuthError);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, [accessToken, qc, refreshAccessToken]);

  // Ngắt kết nối khi đăng xuất.
  useEffect(() => {
    if (!accessToken && socket.connected) {
      setSocketAuth(null);
      socket.disconnect();
    }
  }, [accessToken]);

  return null;
}
