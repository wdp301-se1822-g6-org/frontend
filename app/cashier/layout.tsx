'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { CashierSidebar } from '@/components/cashier/CashierSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function CashierLayout({ children }: LayoutProps) {
  return (
    <ProtectedRoute allowedRoles={['cashier']}>
      <div className='flex min-h-screen bg-slate-50 text-slate-900'>
        <CashierSidebar />
        <div className='flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden'>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
