'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { axiosInstance } from '@/lib/axios';

const navItems = [
  { href: '/manager',             icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/manager/orders',      icon: CalendarCheck,   label: 'Đơn đặt lịch' },
  { href: '/manager/work-orders', icon: Wrench,          label: 'Vận hành rửa xe' },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { setAccessToken, setUser, authUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
      router.replace('/login');
    }
  };

  const initials =
    authUser?.name
      ?.split(' ')
      .map((w: string) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() ?? 'M';

  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0 border-r border-slate-800 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className='flex items-center gap-2 px-4 py-5 border-b border-slate-800/60'>
        <Link href='/' className='flex items-center gap-2.5 shrink-0 flex-1 min-w-0'>
          <Image
            src='/logo-wave.jpg'
            alt='WAVE'
            width={34}
            height={34}
            className='rounded-full object-cover shadow-sm ring-2 ring-white/10 shrink-0'
          />
          {!collapsed && (
            <span className='text-white font-black text-xl tracking-tighter truncate'>
              WAVE <span className='text-indigo-400 text-xs font-bold ml-1 uppercase'>Manager</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          className='shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/40 hover:text-white transition-all duration-200'
        >
          {collapsed ? (
            <ChevronRight className='w-4 h-4' />
          ) : (
            <ChevronLeft className='w-4 h-4' />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className='flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto'>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== '/manager' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className='w-5 h-5 shrink-0' />
              {!collapsed && (
                <span className='text-sm font-semibold truncate'>{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile info + Logout */}
      <div className='px-3 py-4 border-t border-slate-800/60 flex flex-col gap-2'>
        {!collapsed && authUser && (
          <div className='flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5'>
            <div className='w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-xs shrink-0'>
              {initials}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-black text-white truncate'>{authUser.name}</p>
              <p className='text-[10px] text-slate-400 truncate'>{authUser.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full text-left'
        >
          <LogOut className='w-5 h-5 shrink-0' />
          {!collapsed && <span className='text-sm font-semibold'>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
