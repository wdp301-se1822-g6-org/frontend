/** Hạng thành viên thật của BE (TierNameEnum). */
export type TierName = 'None' | 'Bronze' | 'Silver' | 'Gold';

/** Khớp `GET /me/loyalty` → LoyaltyAccountResponseDto (BE, camelCase). */
export interface LoyaltyAccount {
  id: string;
  customerId: string;
  tierConfigId: string;
  tierName: TierName;
  /** Số điểm tích lũy hiện có. */
  pointsBalance: number;
  /** Số đơn hoàn tất kể từ lần cấp voucher gần nhất (đủ 10 thì cấp voucher rửa miễn phí). */
  successfulWashesTowardVoucher: number;
  /** Tổng số đơn hoàn tất trọn đời. */
  totalSuccessfulWashes: number;
  /** Lần reset điểm thường niên gần nhất. */
  lastAnnualResetAt?: string;
}

/** Khớp `GET /tier-configs` → TierConfigResponseDto (BE, camelCase). */
export interface TierConfig {
  id: string;
  tierName: TierName;
  /** Điểm tích lũy tối thiểu để đạt hạng này. */
  minLoyaltyPoints: number;
  bookingWindowDays: number;
  priorityLevel: number;
  /** Điểm nhận trên mỗi 1.000đ chi tiêu. */
  pointsPer1000Vnd: number;
  /** % giảm áp dụng trong khung giờ vàng (0–100). */
  discountPercent: number;
  isActive: boolean;
}
