import { axiosInstance } from '@/lib/axios';
import { ENDPOINTS } from '@/services/endpoints';
import type { DashboardQuery, DashboardReport } from '@/types/dashboard';
import type { WasherLiveStatus } from '@/types/washer';

// ─── Auth ──────────────────────────────────────────────
export const adminGetMe = () => axiosInstance.get('/auth/me');

// ─── Management Reporting Dashboard ─────────────────────
export const adminGetDashboard = (params?: DashboardQuery) =>
  axiosInstance.get<DashboardReport>(ENDPOINTS.adminDashboard.report, {
    params,
  });

// ─── Users ─────────────────────────────────────────────
export const adminGetUsers = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/users', { params });

export const adminGetUser = (id: string) =>
  axiosInstance.get(`/admin/users/${id}`);

export const adminCreateUser = (data: Record<string, unknown>) =>
  axiosInstance.post('/admin/users', data);

export const adminUpdateUser = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/users/${id}`, data);

export const adminDeleteUser = (id: string) =>
  axiosInstance.delete(`/admin/users/${id}`);

export const adminUpdateUserRole = (id: string, role: string) =>
  axiosInstance.patch(`/admin/users/${id}/role`, { role });

// BE SetUserStatusDto nhận { isActive: boolean } (không phải chuỗi status).
export const adminUpdateUserStatus = (id: string, isActive: boolean) =>
  axiosInstance.patch(`/admin/users/${id}/status`, { isActive });

export const adminResetUserPassword = (id: string, newPassword: string) =>
  axiosInstance.post(`/admin/users/${id}/reset-password`, { newPassword });

// ─── Giám sát thợ (Manager/Admin) ───────────────────────
export const adminGetWasherStatus = () =>
  axiosInstance.get<WasherLiveStatus[]>(ENDPOINTS.adminShifts.washerStatus);

// ─── Orders/Bookings (Manager) ──────────────────────────
export const adminGetOrders = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/orders', { params });

export const adminGetOrder = (id: string) =>
  axiosInstance.get(`/admin/orders/${id}`);

export const adminUpdateOrderStatus = (id: string, status: string, reason?: string) =>
  axiosInstance.patch(`/admin/orders/${id}/status`, { status, reason });

export const adminMarkOrderPaid = (id: string) =>
  axiosInstance.post(`/admin/orders/${id}/mark-paid`);

// Tương thích ngược với UI cũ dùng tên bookings
export const adminGetBookings = adminGetOrders;
export const adminGetBooking = adminGetOrder;
export const adminUpdateBookingStatus = (id: string, status: string) =>
  adminUpdateOrderStatus(id, status);

// ─── Service Types ─────────────────────────────────────
export const adminGetServiceTypes = () =>
  axiosInstance.get('/admin/service-types');

export const adminCreateServiceType = (data: Record<string, unknown>) =>
  axiosInstance.post('/admin/service-types', data);

export const adminUpdateServiceType = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/service-types/${id}`, data);

export const adminToggleServiceType = (id: string, isActive: boolean) =>
  axiosInstance.patch(`/admin/service-types/${id}/status`, { isActive });

// ─── Vehicle Types ─────────────────────────────────────
export const adminGetVehicleTypes = () =>
  axiosInstance.get('/admin/vehicle-types');

export const adminCreateVehicleType = (data: Record<string, unknown>) =>
  axiosInstance.post('/admin/vehicle-types', data);

export const adminUpdateVehicleType = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/vehicle-types/${id}`, data);

export const adminToggleVehicleType = (id: string, isActive: boolean) =>
  axiosInstance.patch(`/admin/vehicle-types/${id}/status`, { isActive });

// ─── Tier Configs ──────────────────────────────────────
export const adminGetTierConfigs = () =>
  axiosInstance.get('/admin/tier-configs');

export const adminUpdateTierConfig = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/tier-configs/${id}`, data);

export const adminToggleTierConfig = (id: string, isActive: boolean) =>
  axiosInstance.patch(`/admin/tier-configs/${id}/status`, { isActive });

// ─── Shifts ────────────────────────────────────────────
export const adminGetShifts = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/shifts', { params });

// Active washers + cashiers assignable to a shift (manager + admin allowed).
export const adminGetShiftStaff = () =>
  axiosInstance.get('/admin/shifts/staff');

export const adminCreateShift = (data: Record<string, unknown>) =>
  axiosInstance.post('/admin/shifts', data);

export const adminUpdateShift = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/shifts/${id}`, data);

// Cập nhật trạng thái ca trực. status ∈ scheduled | active | completed | cancelled
export const adminToggleShift = (id: string, status: string) =>
  axiosInstance.patch(`/admin/shifts/${id}/status`, { status });

// ─── Vehicles ──────────────────────────────────────────
export const adminGetVehicles = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/vehicles', { params });

export const adminGetVehicle = (id: string) =>
  axiosInstance.get(`/admin/vehicles/${id}`);

// ─── Work Orders (Manager) ──────────────────────────────
// Check-in: tạo phiếu rửa từ đơn đã xác nhận. BE tự chuyển đơn
// CONFIRMED → CHECKED_IN (và mark PAID nếu đơn tiền mặt), nên KHÔNG
// cần gọi thêm updateOrderStatus. checkinPhotos là ảnh hiện trạng xe (tuỳ chọn).
export const adminCreateWorkOrder = (orderId: string, checkinPhotos?: string[]) =>
  axiosInstance.post('/admin/work-orders', {
    orderId,
    ...(checkinPhotos?.length ? { checkinPhotos } : {}),
  });

export const adminGetWorkOrders = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/work-orders', { params });

export const adminGetWorkOrder = (id: string) =>
  axiosInstance.get(`/admin/work-orders/${id}`);

export const adminAssignWasher = (id: string, washerId: string) =>
  axiosInstance.patch(`/admin/work-orders/${id}/assign`, { washerId });

// ─── Vouchers (Admin / Manager) ────────────────────────
export interface GrantVoucherPayload {
  customerId: string;
  discountCapVnd?: number;
  expiresAt?: string;
  /** Mã tuỳ chỉnh (để trống = BE tự sinh). */
  code?: string;
}

/** Tạo 1 lô voucher pool (khách tự nhận bằng mã) — POST /admin/vouchers/bulk. */
export interface BulkCreateVoucherPayload {
  quantity: number;
  /** Tiền tố mã (1-15 ký tự A-Z/0-9). Mã sinh ra: PREFIX-YYYYMMDD-NNNN. */
  prefix?: string;
  discountCapVnd?: number;
  expiresAt?: string;
}

export interface VoucherBatch {
  batchKey: string;
  prefix: string;
  createdAt: string;
  expiresAt: string;
  discountCapVnd: number;
  total: number;
  inPool: number;
  claimed: number;
  used: number;
  expired: number;
}

export interface VoucherStats {
  total: number;
  inPool: number;
  claimed: number;
  used: number;
  expired: number;
}

export const adminGetVouchers = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/vouchers', { params });

export const adminGetVoucherStats = () =>
  axiosInstance.get<VoucherStats>('/admin/vouchers/stats');

export const adminGetVoucherBatches = () =>
  axiosInstance.get<{ batches: VoucherBatch[] }>('/admin/vouchers/batches');

export const adminGetVoucher = (id: string) =>
  axiosInstance.get(`/admin/vouchers/${id}`);

export const adminGrantVoucher = (data: GrantVoucherPayload) =>
  axiosInstance.post('/admin/vouchers', data);

export const adminBulkCreateVouchers = (data: BulkCreateVoucherPayload) =>
  axiosInstance.post('/admin/vouchers/bulk', data);

export const adminRevokeVoucher = (id: string, reason: string) =>
  axiosInstance.patch(`/admin/vouchers/${id}/revoke`, { reason });

// ─── Golden Hours ──────────────────────────────────────
export const adminGetGoldenHours = () =>
  axiosInstance.get(ENDPOINTS.adminGoldenHours.list);

export const adminCreateGoldenHour = (data: Record<string, unknown>) =>
  axiosInstance.post(ENDPOINTS.adminGoldenHours.create, data);

export const adminUpdateGoldenHour = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(ENDPOINTS.adminGoldenHours.byId(id), data);

export const adminDeleteGoldenHour = (id: string) =>
  axiosInstance.delete(ENDPOINTS.adminGoldenHours.byId(id));

// ─── Pricing Policy ────────────────────────────────────
export const adminGetPricingPolicy = () =>
  axiosInstance.get(ENDPOINTS.adminPricingPolicy.get);

export const adminUpdatePricingPolicy = (data: Record<string, unknown>) =>
  axiosInstance.patch(ENDPOINTS.adminPricingPolicy.update, data);

// ─── Work Orders Queue ──────────────────────────────────
export const adminGetWorkOrdersQueue = () =>
  axiosInstance.get(ENDPOINTS.adminWorkOrders.queue);

// ─── Chat Knowledge (huấn luyện trợ lý AI - admin/manager) ──────────
export interface ChatKnowledgePayload {
  question: string;
  answer: string;
  keywords?: string[];
  category?: string;
  isActive?: boolean;
}

export const adminGetChatKnowledge = () =>
  axiosInstance.get(ENDPOINTS.adminChatKnowledge.list);

export const adminGetChatKnowledgeEntry = (id: string) =>
  axiosInstance.get(ENDPOINTS.adminChatKnowledge.byId(id));

export const adminCreateChatKnowledge = (data: ChatKnowledgePayload) =>
  axiosInstance.post(ENDPOINTS.adminChatKnowledge.create, data);

export const adminUpdateChatKnowledge = (
  id: string,
  data: Partial<ChatKnowledgePayload>,
) => axiosInstance.patch(ENDPOINTS.adminChatKnowledge.byId(id), data);

export const adminDeleteChatKnowledge = (id: string) =>
  axiosInstance.delete(ENDPOINTS.adminChatKnowledge.byId(id));
