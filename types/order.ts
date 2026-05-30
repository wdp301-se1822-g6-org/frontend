export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceTypeId: string;
  staffShiftId: string;
  scheduledAt: string; // UTC ISO string
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  priorityLevel: number;
  rescheduleCount: number;
  cancelReason?: string;
  note?: string;
  payosCheckoutUrl?: string;
  payosOrderCode?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  vehicleId?: string; // Cung cấp vehicleId HOẶC vehicle chi tiết bên dưới
  vehicle?: {
    vehicleTypeId: string;
    licensePlate: string;
    nickname?: string;
    brand?: string;
    model?: string;
    color?: string;
    isDefault?: boolean;
  };
  serviceTypeId: string;
  scheduledAt: string; // UTC ISO string
  paymentMethod: PaymentMethod;
  note?: string;
  voucherId?: string; // FREE_WASH voucher to redeem (amount → 0, cash-only)
}

export interface AvailableSlot {
  scheduledAt: string; // ISO string
  remainingCapacity: number;
  /** Slot nằm trong khung Giờ Vàng (giảm giá theo hạng mới được áp). */
  isGoldenHour: boolean;
  /** % giảm hạng khách được hưởng nếu đặt slot này (0 nếu ngoài giờ vàng). */
  discountPercent: number;
}

export interface RescheduleOrderDto {
  staffShiftId: string;
  scheduledAt: string; // ISO string
}

export interface CancelOrderDto {
  reason?: string;
}

export interface StaffShift {
  id: string;
  staffId: string;
  shiftType: 'cashier' | 'washer';
  stationName?: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  maxBookings: number;
  currentBookings: number;
  note?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  basePrice: string; // string representation of number from BE
  estimatedMinutes: number;
  pointsMultiplier: number;
  checklistTemplate: string[];
  isVoucherEligible?: boolean;
  isActive: boolean;
}

/** Khớp `GET /me/vouchers` → VoucherResponseDto (BE). */
export interface Voucher {
  id: string;
  customerId: string;
  code: string;
  type: 'FREE_WASH' | string;
  status: 'unused' | 'used' | 'expired' | string;
  /** Số VND tối đa voucher trừ được trên một đơn. */
  discountCapVnd: number;
  expiresAt: string;
  grantedReason?: string;
  usedAt?: string;
  usedOrderId?: string;
  createdAt: string;
}

/** Khớp `POST /me/orders/preview` → PreviewOrderResponseDto (BE). */
export interface PreviewOrderResponse {
  originalAmount: number;
  discountAmount: number;
  discountPercent: number;
  discountReason?: string;
  amount: number;
  isGoldenHour: boolean;
  tierName: string;
  tierDiscountPercent: number;
  voucherDiscountCapVnd?: number;
  voucherError?: string;
}
