'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { AppSidebar } from '@/components/sidebar/AppSidebar';


interface LayoutProps {
  children: React.ReactNode;
}

export default function WasherLayout({ children }: LayoutProps) {
  return (
    <ProtectedRoute allowedRoles={['washer']}>
      <div className='flex min-h-screen bg-slate-50 text-slate-900'>
        <AppSidebar role='washer' />
        <div className='flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden'>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
