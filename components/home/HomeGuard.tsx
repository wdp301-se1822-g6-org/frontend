'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function HomeGuard() {
  const { authUser, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && authUser) {
      const role = authUser.role;
      if (role === 'admin') router.replace('/admin');
      else if (role === 'manager') router.replace('/manager');
      else if (role === 'washer') router.replace('/washer');
      else if (role === 'cashier') router.replace('/cashier');
    }
  }, [authUser, _hasHydrated, router]);

  return null;
}
