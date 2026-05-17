import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className='flex min-h-screen bg-muted/30'>
        <AdminSidebar />
        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
