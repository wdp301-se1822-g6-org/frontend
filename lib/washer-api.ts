import { axiosInstance } from '@/lib/axios';

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
export const washerFinishWorkOrder = (id: string) =>
  axiosInstance.patch(`/me/work-orders/${id}/finish`);
