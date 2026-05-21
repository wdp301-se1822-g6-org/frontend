/** Đường dẫn route tập trung — tránh hard-code chuỗi path rải rác trong app. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  profile: '/profile',
  booking: '/booking',
  vehicles: '/vehicles',
  washHistory: '/wash-history',
  cashier: '/cashier',
  washer: '/washer',
  manager: '/manager',
  admin: '/admin',
} as const;

export type RouteKey = keyof typeof ROUTES;
