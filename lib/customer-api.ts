import { axiosInstance } from '@/lib/axios';

// ─── Vehicle Types (Public) ────────────────────────────
export const getActiveVehicleTypes = () =>
  axiosInstance.get('/vehicle-types');

// ─── Vehicles (Customer) ──────────────────────────────
export const getMyVehicles = () =>
  axiosInstance.get('/me/vehicles');

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

export const updateVehicle = (id: string, data: {
  vehicleTypeId?: string;
  licensePlate?: string;
  nickname?: string;
  brand?: string;
  model?: string;
  color?: string;
}) => axiosInstance.patch(`/me/vehicles/${id}`, data);

export const deleteVehicle = (id: string) =>
  axiosInstance.delete(`/me/vehicles/${id}`);

export const setDefaultVehicle = (id: string) =>
  axiosInstance.patch(`/me/vehicles/${id}/set-default`);

// ─── Loyalty & Tiers (Customer) ─────────────────────────
export const getMyLoyalty = () =>
  axiosInstance.get('/me/loyalty');

export const getTierConfigs = () =>
  axiosInstance.get('/tier-configs');

export const getTierConfig = (id: string) =>
  axiosInstance.get(`/tier-configs/${id}`);

// ─── Auth OTP (Customer) ────────────────────────────────
export const sendOtp = (data: { email: string }) =>
  axiosInstance.post('/auth/otp/send', data);

export const verifyOtp = (data: { email: string; code: string }) =>
  axiosInstance.post('/auth/otp/verify', data);

// ─── Service Types (Public) ────────────────────────────
export const getActiveServiceTypes = () =>
  axiosInstance.get('/service-types');

export const getServiceType = (id: string) =>
  axiosInstance.get(`/service-types/${id}`);

// ─── Orders (Customer) ─────────────────────────────────
export const getMyOrders = () =>
  axiosInstance.get('/me/orders');

export const getMyOrder = (id: string) =>
  axiosInstance.get(`/me/orders/${id}`);

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
}) => axiosInstance.post('/me/orders', data);

export const rescheduleOrder = (
  id: string,
  data: { staffShiftId: string; scheduledAt: string }
) => axiosInstance.patch(`/me/orders/${id}/reschedule`, data);

export const cancelOrder = (id: string, data: { reason?: string }) =>
  axiosInstance.patch(`/me/orders/${id}/cancel`, data);

// ─── Available Slots & Shifts ──────────────────────────
export const getAvailableSlots = (params: {
  serviceTypeId: string;
  from: string;
  to: string;
}) => axiosInstance.get('/me/orders/available-slots', { params });

export const getAvailableShifts = (params: {
  from: string;
  to: string;
  shiftType?: 'cashier' | 'washer';
}) => axiosInstance.get('/shifts/available', { params });


