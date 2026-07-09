export type VoucherType = 'free_wash' | string;

export type VoucherStatus = 'unused' | 'used' | 'expired';

export interface Voucher {
  id: string;
  /** Trống/không có = voucher pool chưa ai nhận. */
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  code: string;
  type: VoucherType;
  status: VoucherStatus;
  discountCapVnd: number;
  expiresAt: string;
  grantedReason?: string;
  usedAt?: string;
  usedOrderId?: string;
  createdAt: string;
}
