import { useQuery } from '@tanstack/react-query';
import { getNotifications, getUnreadCount } from '@/lib/customer-api';
import { useAuthStore } from '@/store/useAuthStore';
import type { NotificationListResult } from '@/types/notification';

/** Danh sách thông báo (phân trang) của người dùng đang đăng nhập. */
export const useNotifications = (page = 1, limit = 20) => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async (): Promise<NotificationListResult> => {
      const res = await getNotifications(page, limit);
      return res.data as NotificationListResult;
    },
    enabled: !!accessToken,
  });
};

/** Số thông báo chưa đọc (cho badge chuông). */
export const useUnreadCount = () => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async (): Promise<number> => {
      const res = await getUnreadCount();
      return (res.data?.unread as number) ?? 0;
    },
    enabled: !!accessToken,
  });
};
