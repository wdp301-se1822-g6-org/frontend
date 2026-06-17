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
  _id?: string;
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
  note?: string;
}

/** Giá & thời lượng của một dịch vụ cho MỘT loại xe cụ thể (BE: VehiclePricingResponseDto). */
export interface VehiclePricing {
  vehicleTypeId: string;
  vehicleTypeName?: string;
  price: string; // string representation of number from BE
  estimatedMinutes: number;
  isActive: boolean;
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
  /** Danh sách loại xe mà dịch vụ này áp dụng (kèm giá/thời lượng riêng). */
  vehiclePricing?: VehiclePricing[];
  isActive: boolean;
}

/** Khớp `POST /me/orders/preview` → PreviewOrderResponseDto (BE). */
export interface PreviewOrderResponse {
  originalAmount: number;
  estimatedMinutes?: number;
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
