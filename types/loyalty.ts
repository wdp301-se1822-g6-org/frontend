export interface LoyaltyAccount {
  id: string;
  customerId: string;
  tierConfigId: string;
  tierName: string; // None | Bronze | Silver | Gold
  pointsBalance: number;
  /** Số lần rửa hoàn thành tính từ voucher gần nhất (reset về 0 ở mốc 10). */
  successfulWashesTowardVoucher: number;
  /** Tổng số lần rửa hoàn thành trọn đời (không reset). */
  totalSuccessfulWashes: number;
  lastAnnualResetAt?: string;
}

export type LoyaltyTransactionType =
  | 'earn_completed'
  | 'deduct_no_show'
  | 'annual_reset'
  | 'voucher_granted'
  | 'tier_changed';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: LoyaltyTransactionType;
  pointsDelta: number;
  balanceAfter: number;
  orderId?: string;
  voucherId?: string;
  previousTierConfigId?: string;
  newTierConfigId?: string;
  reason?: string;
  createdAt: string;
}

export interface TierConfig {
  id: string;
  tierName: string;
  /** Điểm tối thiểu để đạt hạng này. */
  minLoyaltyPoints: number;
  bookingWindowDays: number;
  priorityLevel: number;
  pointsPer1000Vnd: number; // Points awarded per 1,000 VND spent
  discountPercent: number; // Discount percent applied per wash (0–100)
  isActive: boolean;
}
