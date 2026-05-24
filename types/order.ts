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
}

export interface AvailableSlot {
  scheduledAt: string; // ISO string
  remainingCapacity: number;
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
  isActive: boolean;
}
