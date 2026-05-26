'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function AuthNavbar() {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center gap-4'>
            {/* Logo */}
            <Link
              href='/'
              className='flex items-center gap-2.5 shrink-0'
            >
              <Image
                src='/logo-wave.jpg'
                alt='WAVE'
                width={36}
                height={36}
                className='rounded-full object-cover shadow-sm'
              />
              <span className='text-foreground font-black text-2xl tracking-tighter'>
                WAVE
              </span>
            </Link>

            {/* Separator & Page Title */}
            <div className='h-6 w-px bg-border mx-2 hidden sm:block' />
            <span className='text-xl font-semibold text-foreground hidden sm:block'>
              {isLoginPage ? 'Đăng nhập' : 'Đăng ký'}
            </span>
          </div>

          <Link
            href={isLoginPage ? '/register' : '/login'}
            className='text-primary font-semibold hover:underline transition-all'
          >
            {isLoginPage ? 'Bạn chưa có tài khoản?' : 'Bạn đã có tài khoản?'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
