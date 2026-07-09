/**
 * Management Reporting / Operational Analytics dashboard payload.
 * Mirrors the BE shape returned by GET /admin/dashboard
 * (BE/src/features/dashboard/types/dashboard-report.type.ts).
 * Every value is real, aggregated data - never mock.
 */

export interface RankRow {
  id: string;
  name: string;
  value: number;
  secondary?: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface NamedRevenue {
  name: string;
  revenue: number;
  orders: number;
}

export interface TimeBucket {
  key: string;
  revenue: number;
  orders: number;
}

export interface HourBucket {
  hour: number;
  count: number;
}

export interface DashboardOverview {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  grossRevenue: number;
  discountAmount: number;
  refundAmount: number;
  netRevenue: number;
  totalCustomers: number;
  totalVehicles: number;
  activeWashers: number;
  usedVouchers: number;
  averageOrderValue: number;
}

export interface RevenueAnalytics {
  gross: number;
  discount: number;
  refund: number;
  net: number;
  averageOrderValue: number;
  byDay: TimeBucket[];
  byMonth: TimeBucket[];
  byService: NamedRevenue[];
  byVehicleType: NamedRevenue[];
  byPaymentMethod: NamedRevenue[];
}

export interface BookingAnalytics {
  statusSummary: Record<string, number>;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  byHour: HourBucket[];
  byService: NamedCount[];
  byVehicleType: NamedCount[];
  trendByDay: { key: string; count: number }[];
}

export interface WasherRow {
  id: string;
  name: string;
  completedJobs: number;
  assignedJobs: number;
  averageServiceMinutes: number;
  revenueHandled: number;
  onTimeRate: number;
  // QC đã bỏ — chất lượng phản ánh qua feedback/rating của khách.
  averageRating: number | null;
  feedbackCount: number;
}

export interface CustomerAnalytics {
  topByVehicles: RankRow[];
  topByBookings: RankRow[];
  topBySpending: RankRow[];
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  tierDistribution: NamedCount[];
}

export interface VehicleAnalytics {
  total: number;
  byType: NamedCount[];
  revenueByType: NamedRevenue[];
  topType: string | null;
}

export interface VoucherLoyaltyAnalytics {
  totalIssued: number;
  used: number;
  unused: number;
  expired: number;
  redemptionRate: number;
  voucherCost: number;
  topCustomersByVouchers: RankRow[];
  pointsBalanceTotal: number;
}

export interface ServiceAnalytics {
  mostUsed: NamedCount[];
  byRevenue: NamedRevenue[];
  averageDurationByService: { name: string; minutes: number }[];
}

export interface RefundDisputeAnalytics {
  refundCount: number;
  refundAmount: number;
  completedBookings: number;
  notes: string[];
}

export interface ScheduleAnalytics {
  totalShifts: number;
  totalCapacity: number;
  bookedSlots: number;
  availableSlots: number;
  utilizationRate: number;
  peakHours: HourBucket[];
}

export interface CustomerRiskRow {
  id: string;
  name: string;
  /** Masked phone (090****567); null when redacted for the manager scope. */
  phoneMasked: string | null;
  totalBookings: number;
  count: number;
  rate: number;
  lastAt: string | null;
}

export interface CancellationNoShowAnalytics {
  totalCancelled: number;
  totalNoShow: number;
  cancellationRate: number;
  noShowRate: number;
  topCancellingCustomers: CustomerRiskRow[];
  topNoShowCustomers: CustomerRiskRow[];
  cancelledByService: NamedCount[];
  noShowByService: NamedCount[];
  cancelledByHour: HourBucket[];
  noShowByHour: HourBucket[];
  cancellationReasons: NamedCount[];
  trendByDay: { key: string; cancelled: number; noShow: number }[];
  notes: string[];
}

/** `full` = admin; `manager` = customer-identifying rankings redacted server-side. */
export type DashboardScope = 'full' | 'manager';

export interface DashboardReport {
  scope: DashboardScope;
  range: { fromDate: string; toDate: string; period: string | null };
  overview: DashboardOverview;
  revenue: RevenueAnalytics;
  bookings: BookingAnalytics;
  washers: WasherRow[];
  customers: CustomerAnalytics;
  vehicles: VehicleAnalytics;
  voucherLoyalty: VoucherLoyaltyAnalytics;
  services: ServiceAnalytics;
  refundDispute: RefundDisputeAnalytics;
  /** Optional: an older backend build may not return this section yet. */
  cancellationNoShow?: CancellationNoShowAnalytics;
  schedule: ScheduleAnalytics;
}

/** Query params accepted by GET /admin/dashboard.
 *  `branchId`/`washerId`/`vehicleType`/`paymentMethod` are part of the shared
 *  client contract for forward-compat; only `serviceId` is wired server-side
 *  today (the data model is single-branch). */
export interface DashboardQuery {
  fromDate?: string;
  toDate?: string;
  period?: string;
  serviceId?: string;
  branchId?: string;
  washerId?: string;
  vehicleType?: string;
  paymentMethod?: string;
  topN?: number;
}
