export type NotificationType =
  | 'order_created'
  | 'wash_assigned'
  | 'wash_started'
  | 'wash_completed'
  | 'feedback_created';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResult {
  data: AppNotification[];
  unread: number;
  meta: { page: number; limit: number; total: number; totalPages: number };
}
