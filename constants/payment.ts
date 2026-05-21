/**
 * Phương thức & trạng thái thanh toán — mirror BE
 * `src/features/order/types/payment-method.enum.ts` và `payment-status.enum.ts`.
 */
import type { StatusTone } from './order-status';

export const PAYMENT_METHOD = {
  /** Thanh toán qua PayOS. Đơn khởi tạo ở trạng thái PENDING_PAYMENT. */
  ONLINE: 'online',
  /** Thu ngân thu tại quầy. Đơn khởi tạo CONFIRMED + UNPAID. */
  CASH: 'cash',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  online: 'Thanh toán online',
  cash: 'Tiền mặt tại quầy',
};

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: StatusTone }
> = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  refunded: { label: 'Đã hoàn tiền', tone: 'muted' },
};
