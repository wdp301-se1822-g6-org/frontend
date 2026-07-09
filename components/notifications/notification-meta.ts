import {
  Bell,
  CalendarPlus,
  Sparkles,
  Car,
  CheckCircle2,
  Star,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/types/notification';

export const NOTI_META: Record<
  NotificationType,
  { icon: LucideIcon; tone: string }
> = {
  order_created: { icon: CalendarPlus, tone: 'text-primary bg-primary/10' },
  wash_assigned: { icon: Sparkles, tone: 'text-primary bg-primary/10' },
  wash_started: { icon: Car, tone: 'text-warning bg-warning/10' },
  wash_completed: { icon: CheckCircle2, tone: 'text-success bg-success/10' },
  feedback_created: { icon: Star, tone: 'text-warning bg-warning/10' },
};

export const fallbackMeta = { icon: Bell, tone: 'text-muted-foreground bg-muted' };

/** "vừa xong / 5 phút trước / 2 giờ trước / dd/mm" tuỳ khoảng cách. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
