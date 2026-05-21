'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AuthGuard — Bảo vệ các trang yêu cầu đăng nhập như Profile, Xe Của Tôi.
 * - Chưa đăng nhập → redirect /login
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authUser, _hasHydrated, isInitialized, initAuth } = useAuthStore();

  // Khởi tạo auth nếu chưa
  useEffect(() => {
    if (_hasHydrated && !isInitialized) {
      initAuth();
    }
  }, [_hasHydrated, isInitialized, initAuth]);

  // Xử lý logic redirect trong useEffect thay vì render
  useEffect(() => {
    if (_hasHydrated && isInitialized && !authUser) {
      router.replace('/login');
    }
  }, [_hasHydrated, isInitialized, authUser, router]);

  // Chờ hydration + khởi tạo hoàn tất từ store
  if (!_hasHydrated || !isInitialized) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-muted/30'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
          <p className='text-sm font-semibold text-foreground/50'>Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập (đang chờ useEffect chạy và redirect) → trả về null để không nháy nội dung
  if (!authUser) {
    return null;
  }

  // Đã đăng nhập → Cho phép hiển thị nội dung
  return <>{children}</>;
}
