'use client';

import { ManagerGuard } from '@/components/manager/ManagerGuard';
import { ManagerSidebar } from '@/components/manager/ManagerSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ManagerLayout({ children }: LayoutProps) {
  return (
    <ManagerGuard>
      <div className='flex min-h-screen bg-slate-50 text-slate-900'>
        <ManagerSidebar />
        <div className='flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden'>
          {children}
        </div>
      </div>
    </ManagerGuard>
  );
}
