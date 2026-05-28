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
    otpSend: '/auth/otp/send',
    otpVerify: '/auth/otp/verify',
  },
  /** Đơn của chính khách hàng — BE `OrderController` (@Controller('me/orders')). */
  orders: {
    mine: '/me/orders',
    mineById: (id: string) => `/me/orders/${id}`,
    reschedule: (id: string) => `/me/orders/${id}/reschedule`,
    cancel: (id: string) => `/me/orders/${id}/cancel`,
    availableSlots: '/me/orders/available-slots',
  },
  /** Đơn phía quầy/quản trị — BE `AdminOrderController` (@Controller('admin/orders')). */
  adminOrders: {
    list: '/admin/orders',
    byId: (id: string) => `/admin/orders/${id}`,
    status: (id: string) => `/admin/orders/${id}/status`,
    markPaid: (id: string) => `/admin/orders/${id}/mark-paid`,
  },
  /** Quản lý Work Orders cho Cashier/Manager — BE `AdminWorkOrderController` */
  adminWorkOrders: {
    list: '/admin/work-orders',
    create: '/admin/work-orders',
    byId: (id: string) => `/admin/work-orders/${id}`,
    assign: (id: string) => `/admin/work-orders/${id}/assign`,
    qc: (id: string) => `/admin/work-orders/${id}/qc`,
  },
  /** Work Orders cho thợ rửa xe — BE `WasherWorkOrderController` */
  washerWorkOrders: {
    list: '/me/work-orders',
    byId: (id: string) => `/me/work-orders/${id}`,
    start: (id: string) => `/me/work-orders/${id}/start`,
    checklist: (id: string) => `/me/work-orders/${id}/checklist`,
    finish: (id: string) => `/me/work-orders/${id}/finish`,
  },
  serviceTypes: {
    list: '/service-types',
    byId: (id: string) => `/service-types/${id}`,
  },
  adminServiceTypes: {
    list: '/admin/service-types',
    create: '/admin/service-types',
    byId: (id: string) => `/admin/service-types/${id}`,
    status: (id: string) => `/admin/service-types/${id}/status`,
  },
  vehicleTypes: {
    list: '/vehicle-types',
    byId: (id: string) => `/vehicle-types/${id}`,
  },
  adminVehicleTypes: {
    list: '/admin/vehicle-types',
    create: '/admin/vehicle-types',
    byId: (id: string) => `/admin/vehicle-types/${id}`,
    status: (id: string) => `/admin/vehicle-types/${id}/status`,
  },
  vehicles: {
    mine: '/me/vehicles',
    byId: (id: string) => `/me/vehicles/${id}`,
    setDefault: (id: string) => `/me/vehicles/${id}/set-default`,
  },
  adminVehicles: {
    list: '/admin/vehicles',
    byId: (id: string) => `/admin/vehicles/${id}`,
  },
  shifts: {
    available: '/shifts/available',
  },
  adminShifts: {
    list: '/admin/shifts',
    create: '/admin/shifts',
    byId: (id: string) => `/admin/shifts/${id}`,
    status: (id: string) => `/admin/shifts/${id}/status`,
  },
  loyalty: {
    mine: '/me/loyalty',
    transactions: '/me/loyalty/transactions',
  },
  vouchers: {
    mine: '/me/vouchers',
    byId: (id: string) => `/me/vouchers/${id}`,
  },
  tierConfigs: {
    list: '/tier-configs',
    byId: (id: string) => `/tier-configs/${id}`,
  },
  adminTierConfigs: {
    list: '/admin/tier-configs',
    byId: (id: string) => `/admin/tier-configs/${id}`,
    status: (id: string) => `/admin/tier-configs/${id}/status`,
  },
  adminUsers: {
    list: '/admin/users',
    create: '/admin/users',
    byId: (id: string) => `/admin/users/${id}`,
    role: (id: string) => `/admin/users/${id}/role`,
    status: (id: string) => `/admin/users/${id}/status`,
    resetPassword: (id: string) => `/admin/users/${id}/reset-password`,
  },
  chat: {
    message: '/chat/message',
    session: (sessionId: string) => `/chat/sessions/${sessionId}`,
  },
  adminChatKnowledge: {
    list: '/admin/chat-knowledge',
    create: '/admin/chat-knowledge',
    byId: (id: string) => `/admin/chat-knowledge/${id}`,
  },
  payments: {
    webhook: '/payments/webhook',
  },
} as const;
