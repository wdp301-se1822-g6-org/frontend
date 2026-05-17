'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthNavbar } from '@/components/auth/AuthNavbar';
import { Footer } from '@/components/home/Footer';

interface LayoutProps {
  children: React.ReactNode;
}
export default function AuthLayout({ children }: LayoutProps) {
  const { accessToken, isInitialized, authUser } = useAuthStore();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (accessToken && authUser) {
      if (authUser.role === 'admin') {
        router.replace('/admin');
      } else if (authUser.role === 'cashier') {
        router.replace('/cashier');
      } else if (authUser.role === 'washer') {
        router.replace('/washer');
      } else if (authUser.role === 'manager') {
        router.replace('/manager');
      } else {
        router.replace('/');
      }
    } else if (accessToken && !authUser) {
      setAccessToken(null);
      setUser(null);
    }
  }, [isInitialized, accessToken, authUser]);

  if (!isInitialized) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-background'>
        <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
      </main>
    );
  }

  if (accessToken && authUser) return null;

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <AuthNavbar />
      <main className='flex-1 flex flex-col mt-20'>
        {children}
      </main>
      <Footer />
    </div>
  );
}
