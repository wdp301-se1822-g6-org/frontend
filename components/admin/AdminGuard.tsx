'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * AdminGuard — bọc bất kỳ nội dung admin nào.
 * - Chưa đăng nhập → redirect /login
 * - Đã đăng nhập nhưng không phải admin → trang lỗi 403
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authUser, _hasHydrated, isInitialized, initAuth } = useAuthStore();

  // Khởi tạo auth nếu chưa
  useEffect(() => {
    if (_hasHydrated && !isInitialized) {
      initAuth();
    }
  }, [_hasHydrated, isInitialized, initAuth]);

  // Chờ hydration + khởi tạo
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

  // Chưa đăng nhập
  if (!authUser) {
    router.replace('/login');
    return null;
  }

  // Không phải admin
  if (authUser.role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-muted/30 p-4'>
        <div className='bg-white rounded-3xl border border-border shadow-2xl shadow-primary/5 p-12 max-w-md w-full text-center'>
          <div className='w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6'>
            <ShieldAlert className='w-8 h-8 text-rose-500' />
          </div>
          <h1 className='text-2xl font-black text-foreground mb-3'>Không có quyền truy cập</h1>
          <p className='text-foreground/50 text-sm leading-relaxed mb-8'>
            Trang này chỉ dành cho quản trị viên.
            Tài khoản của bạn ({authUser.role}) không có quyền truy cập dashboard admin.
          </p>
          <button
            onClick={() => router.replace('/')}
            className='w-full py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20'
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Admin hợp lệ
  return <>{children}</>;
}
