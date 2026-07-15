'use client';

import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';

/**
 * Lắng nghe một event realtime trong vòng đời component, tự gỡ khi unmount.
 *
 * - Handler mới nhất luôn được gọi (giữ qua ref) mà không phải re-subscribe
 *   mỗi render → không bao giờ đăng ký trùng listener.
 * - KHÔNG tự connect socket: NotificationSocketBridge là nơi duy nhất quản lý
 *   vòng đời kết nối (connect/reconnect/refresh token).
 *
 * Payload để `unknown` — caller tự thu hẹp kiểu và PHẢI kiểm tra định danh bản
 * ghi (vd `payload.id === order.id`) trước khi cập nhật màn hình chi tiết.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
