'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { authUser, isInitialized, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated || !isInitialized) return;

    if (!authUser) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = authUser.role || 'customer';
      if (!allowedRoles.includes(userRole)) {
        switch (userRole) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'manager':
            router.replace('/manager');
            break;
          case 'washer':
            router.replace('/washer');
            break;
          case 'cashier':
            router.replace('/cashier');
            break;
          case 'customer':
          default:
            router.replace('/');
            break;
        }
      }
    }
  }, [authUser, isInitialized, _hasHydrated, allowedRoles, router]);

  if (!_hasHydrated || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = authUser.role || 'customer';
    if (!allowedRoles.includes(userRole)) return null;
  }

  return <>{children}</>;
}
