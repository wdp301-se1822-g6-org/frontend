'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * WasherGuard — bọc bất kỳ nội dung washer nào.
 * - Chưa đăng nhập → redirect /login
 * - Đã đăng nhập nhưng không phải washer → trang lỗi 403
 */
export function WasherGuard({ children }: { children: React.ReactNode }) {
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

  // Chờ hydration + khởi tạo
  if (!_hasHydrated || !isInitialized) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50/50'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm font-semibold text-slate-500'>Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập (đang chờ useEffect chạy và redirect)
  if (!authUser) {
    return null;
  }

  // Không phải washer
  if (authUser.role !== 'washer') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50/50 p-4'>
        <div className='bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-12 max-w-md w-full text-center'>
          <div className='w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6'>
            <ShieldAlert className='w-8 h-8 text-rose-500' />
          </div>
          <h1 className='text-2xl font-black text-slate-800 mb-3'>Không có quyền truy cập</h1>
          <p className='text-slate-500 text-sm leading-relaxed mb-8'>
            Trang này chỉ dành cho Nhân viên rửa xe (Washer).
            Tài khoản của bạn ({authUser.role}) không có quyền truy cập Workspace washer.
          </p>
          <button
            onClick={() => router.replace('/')}
            className='w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20'
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Washer hợp lệ
  return <>{children}</>;
}
