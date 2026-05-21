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
