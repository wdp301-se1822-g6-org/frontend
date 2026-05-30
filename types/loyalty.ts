export interface LoyaltyAccount {
  id: string;
  customerId: string;
  tierConfigId: string;
  tierName: 'Member' | 'Silver' | 'Gold' | 'Platinum';
  pointsBalance: number;
  visitsThisMonth: number;
  visitsLastMonth: number;
  consecutiveLowMonths: number;
  tierReviewedAt?: string;
  pointsExpireAt?: string;
}

export interface TierConfig {
  id: string;
  tierName: 'Member' | 'Silver' | 'Gold' | 'Platinum';
  minVisitsPerMonth: number;
  bookingWindowDays: number;
  priorityLevel: number;
  pointsPer1000Vnd: number; // Points awarded per 1,000 VND spent
  discountPercent: number; // Discount percent applied per wash (0–100)
  isActive: boolean;
}
