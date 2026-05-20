'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Role } from '@/constants';

type RoleGuardProps = {
  /** Các role được phép thấy nội dung. */
  allow: Role[];
  children: ReactNode;
  /** Hiển thị khi người dùng không đủ quyền (mặc định: ẩn). */
  fallback?: ReactNode;
};

/**
 * Ẩn/hiện UI theo role — gom logic kiểm tra quyền rải rác về một chỗ.
 * Lưu ý: đây chỉ là guard ở tầng UI; việc chặn truy cập route vẫn do
 * layout/route group và BE đảm nhiệm.
 */
export function RoleGuard({ allow, children, fallback = null }: RoleGuardProps) {
  const authUser = useAuthStore((state) => state.authUser);

  if (!authUser || !allow.includes(authUser.role as Role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
