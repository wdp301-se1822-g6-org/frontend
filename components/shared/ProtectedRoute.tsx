'use client';

import { Spinner } from '@/components/ui/spinner';
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
  const { authUser, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;

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
  }, [authUser, _hasHydrated, allowedRoles, router]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 text-indigo-600" />
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
