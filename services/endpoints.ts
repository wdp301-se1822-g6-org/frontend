/**
 * Bản đồ endpoint tập trung. Hook/service import từ đây thay vì viết
 * chuỗi path rải rác — đổi route chỉ sửa một nơi.
 * Path khớp với controller của BE (NestJS).
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  /** Đơn của chính khách hàng — BE `OrderController` (@Controller('me/orders')). */
  orders: {
    mine: '/me/orders',
    mineById: (id: string) => `/me/orders/${id}`,
    reschedule: (id: string) => `/me/orders/${id}/reschedule`,
    cancel: (id: string) => `/me/orders/${id}/cancel`,
  },
  /** Đơn phía quầy/quản trị — BE `AdminOrderController` (@Controller('admin/orders')). */
  adminOrders: {
    list: '/admin/orders',
    byId: (id: string) => `/admin/orders/${id}`,
    status: (id: string) => `/admin/orders/${id}/status`,
    markPaid: (id: string) => `/admin/orders/${id}/mark-paid`,
  },
  serviceTypes: {
    list: '/service-types',
  },
  vehicles: {
    mine: '/me/vehicles',
  },
  loyalty: {
    mine: '/me/loyalty',
  },
} as const;
