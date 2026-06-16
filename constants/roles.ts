/**
 * Vai trò người dùng - mirror BE `src/features/auth/types/role.enum.ts`.
 * KHÔNG đổi giá trị string nếu BE chưa đổi.
 */
export const ROLES = {
  CUSTOMER: 'customer',
  CASHIER: 'cashier',
  WASHER: 'washer',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Trang đích mặc định sau khi đăng nhập, theo role. */
export const ROLE_HOME: Record<Role, string> = {
  customer: '/',
  cashier: '/cashier',
  washer: '/washer',
  manager: '/manager',
  admin: '/admin',
};

/** Nhãn hiển thị tiếng Việt cho role. */
export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Khách hàng',
  cashier: 'Thu ngân',
  washer: 'Nhân viên rửa xe',
  manager: 'Quản lý',
  admin: 'Quản trị viên',
};

/** Lấy trang đích an toàn cho một role bất kỳ (fallback về trang chủ). */
export function getRoleHome(role?: string | null): string {
  if (role && role in ROLE_HOME) return ROLE_HOME[role as Role];
  return '/';
}
