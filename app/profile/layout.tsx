import { Navbar } from '@/components/home/Navbar';
import ProfileSidebar from '@/components/profile/ProfileSidebar';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-muted transition-colors duration-300'>
      <Navbar />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8'>
          {/* Sidebar */}
          <aside className='md:col-span-3'>
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <main className='md:col-span-9'>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
