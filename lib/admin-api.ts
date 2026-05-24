import { axiosInstance } from '@/lib/axios';

// ─── Auth ──────────────────────────────────────────────
export const adminGetMe = () => axiosInstance.get('/auth/me');

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

export const adminUpdateUserStatus = (id: string, status: string) =>
  axiosInstance.patch(`/admin/users/${id}/status`, { status });

export const adminResetUserPassword = (id: string, newPassword: string) =>
  axiosInstance.post(`/admin/users/${id}/reset-password`, { newPassword });

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

export const adminCreateShift = (data: Record<string, unknown>) =>
  axiosInstance.post('/admin/shifts', data);

export const adminUpdateShift = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`/admin/shifts/${id}`, data);

export const adminToggleShift = (id: string, isActive: boolean) =>
  axiosInstance.patch(`/admin/shifts/${id}/status`, { isActive });

// ─── Vehicles ──────────────────────────────────────────
export const adminGetVehicles = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/vehicles', { params });

export const adminGetVehicle = (id: string) =>
  axiosInstance.get(`/admin/vehicles/${id}`);

// ─── Work Orders (Manager) ──────────────────────────────
export const adminCreateWorkOrder = (orderId: string) =>
  axiosInstance.post('/admin/work-orders', { orderId });

export const adminGetWorkOrders = (params?: Record<string, unknown>) =>
  axiosInstance.get('/admin/work-orders', { params });

export const adminGetWorkOrder = (id: string) =>
  axiosInstance.get(`/admin/work-orders/${id}`);

export const adminAssignWasher = (id: string, washerId: string) =>
  axiosInstance.patch(`/admin/work-orders/${id}/assign`, { washerId });

export const adminQcWorkOrder = (id: string, passed: boolean, note?: string) =>
  axiosInstance.patch(`/admin/work-orders/${id}/qc`, { passed, note });
