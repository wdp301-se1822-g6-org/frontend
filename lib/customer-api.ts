import { axiosInstance } from '@/lib/axios';
import { ENDPOINTS } from '@/services/endpoints';

// ─── Vehicle Types (Public) ────────────────────────────
export const getActiveVehicleTypes = () => axiosInstance.get('/vehicle-types');

// ─── Vehicles (Customer) ──────────────────────────────
export const getMyVehicles = () => axiosInstance.get('/me/vehicles');

export const getMyVehicle = (id: string) =>
  axiosInstance.get(`/me/vehicles/${id}`);

export const createVehicle = (data: {
  vehicleTypeId: string;
  licensePlate: string;
  nickname?: string;
  brand?: string;
  model?: string;
  color?: string;
  isDefault?: boolean;
}) => axiosInstance.post('/me/vehicles', data);

export const updateVehicle = (
  id: string,
  data: {
    vehicleTypeId?: string;
    licensePlate?: string;
    nickname?: string;
    brand?: string;
    model?: string;
    color?: string;
  },
) => axiosInstance.patch(`/me/vehicles/${id}`, data);

export const deleteVehicle = (id: string) =>
  axiosInstance.delete(`/me/vehicles/${id}`);

export const setDefaultVehicle = (id: string) =>
  axiosInstance.patch(`/me/vehicles/${id}/set-default`);

// ─── Loyalty & Tiers (Customer) ─────────────────────────
export const getMyLoyalty = () => axiosInstance.get(ENDPOINTS.loyalty.mine);

export const getMyLoyaltyTransactions = () =>
  axiosInstance.get(ENDPOINTS.loyalty.transactions);

// ─── Vouchers (Customer) ───────────────────────────────
export const getMyVouchers = (status?: 'unused' | 'used' | 'expired') =>
  axiosInstance.get(ENDPOINTS.vouchers.mine, {
    params: status ? { status } : {},
  });

export const getMyVoucher = (id: string) =>
  axiosInstance.get(ENDPOINTS.vouchers.byId(id));

export const getTierConfigs = () => axiosInstance.get('/tier-configs');

export const getTierConfig = (id: string) =>
  axiosInstance.get(`/tier-configs/${id}`);

// ─── Auth OTP (Customer) ────────────────────────────────
export const sendOtp = (data: { email: string }) =>
  axiosInstance.post('/auth/otp/send', data);

export const verifyOtp = (data: { email: string; code: string }) =>
  axiosInstance.post('/auth/otp/verify', data);

// ─── Service Types (Public) ────────────────────────────
export const getActiveServiceTypes = () => axiosInstance.get('/service-types');

export const getServiceType = (id: string) =>
  axiosInstance.get(`/service-types/${id}`);

// ─── Orders (Customer) ─────────────────────────────────
export const getMyOrders = () => axiosInstance.get('/me/orders');

export const getMyOrder = (id: string) => axiosInstance.get(`/me/orders/${id}`);

export const createOrder = (data: {
  vehicleId?: string;
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
  scheduledAt: string;
  paymentMethod: 'online' | 'cash';
  note?: string;
  voucherId?: string;
}) => axiosInstance.post('/me/orders', data);

// ─── Order Price Preview (Customer) ────────────────────
export const previewOrder = (data: {
  serviceTypeId: string;
  vehicleTypeId: string;
  scheduledAt: string;
  voucherId?: string;
}) => axiosInstance.post('/me/orders/preview', data);

export const rescheduleOrder = (
  id: string,
  data: { staffShiftId: string; scheduledAt: string },
) => axiosInstance.patch(`/me/orders/${id}/reschedule`, data);

export const cancelOrder = (id: string, data: { reason?: string }) =>
  axiosInstance.patch(`/me/orders/${id}/cancel`, data);

// ─── Available Slots & Shifts ──────────────────────────
export const getAvailableSlots = (params: {
  serviceTypeId: string;
  vehicleTypeId: string;
  from: string;
  to: string;
}) => axiosInstance.get('/me/orders/available-slots', { params });

export const getAvailableShifts = (params: {
  from: string;
  to: string;
  shiftType?: 'cashier' | 'washer';
}) => axiosInstance.get('/shifts/available', { params });

// ─── Feedback (Customer) ────────────────────────────────
export const submitFeedback = (data: { orderId: string; rating: number; comment?: string }) =>
  axiosInstance.post(ENDPOINTS.feedback.submit, data);

export const getFeedbackEligibility = (orderId: string) =>
  axiosInstance.get(ENDPOINTS.feedback.byOrderId(orderId));
