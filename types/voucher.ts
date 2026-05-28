export type VoucherType = 'free_wash';

export type VoucherStatus = 'unused' | 'used' | 'expired';

export interface Voucher {
  id: string;
  customerId: string;
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
