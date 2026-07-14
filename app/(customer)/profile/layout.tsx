import { Navbar } from '@/components/home/Navbar';
import ProfileSidebar from '@/components/profile/ProfileSidebar';

// Bảo vệ route do app/(customer)/layout.tsx lo (ProtectedRoute allowedRoles=['customer']).
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#F5F5F5] dark:bg-background transition-colors duration-300'>
      <Navbar />
      <div className='w-full px-4 pt-24 pb-12 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-7 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8'>
          {/* Sidebar */}
          <aside className='lg:sticky lg:top-24 lg:self-start'>
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <main className='min-w-0'>{children}</main>
        </div>
      </div>
    </div>
  );
}
