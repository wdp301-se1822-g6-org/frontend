'use client';

import { WasherGuard } from '@/components/washer/WasherGuard';
import { WasherSidebar } from '@/components/washer/WasherSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function WasherLayout({ children }: LayoutProps) {
  return (
    <WasherGuard>
      <div className='flex min-h-screen bg-slate-50 text-slate-900'>
        <WasherSidebar />
        <div className='flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden'>
          {children}
        </div>
      </div>
    </WasherGuard>
  );
}
