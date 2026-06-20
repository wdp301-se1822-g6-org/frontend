import { axiosInstance } from '@/lib/axios';
import { ENDPOINTS } from '@/services/endpoints';

/**
 * Lấy danh sách Work Orders được phân công cho thợ rửa xe hiện tại
 */
export const washerGetWorkOrders = (params?: Record<string, unknown>) =>
  axiosInstance.get('/me/work-orders', { params });

/**
 * Lấy chi tiết Work Order
 */
export const washerGetWorkOrder = (id: string) =>
  axiosInstance.get(`/me/work-orders/${id}`);

/**
 * Bắt đầu làm việc (Rửa xe)
 */
export const washerStartWorkOrder = (id: string) =>
  axiosInstance.patch(`/me/work-orders/${id}/start`);

/**
 * Cập nhật Checklist của Work Order
 */
export const washerUpdateChecklist = (id: string, checklist: unknown) =>
  axiosInstance.patch(`/me/work-orders/${id}/checklist`, { checklist });

/**
 * Hoàn thành rửa xe, chuyển trạng thái cho Cashier/Manager đánh giá QC
 */
export const washerFinishWorkOrder = (id: string, checkoutPhotos: string[]) =>
  axiosInstance.patch(`/me/work-orders/${id}/finish`, { checkoutPhotos });

/**
 * Lấy lịch trình rửa xe cá nhân của thợ
 */
export const washerGetSchedule = (params?: { date?: string; from?: string; to?: string; status?: string }) =>
  axiosInstance.get(ENDPOINTS.washerSchedule.me, { params });
