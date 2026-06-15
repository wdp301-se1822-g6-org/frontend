'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { axiosInstance } from '@/lib/axios';
import { SIDEBAR_CONFIG } from './sidebar-config';

type Props = {
  role: keyof typeof SIDEBAR_CONFIG;
};

export function AppSidebar({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { setAccessToken, setUser, authUser } = useAuthStore();
  const config = SIDEBAR_CONFIG[role];

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
      className={`sticky top-0 h-screen self-start flex flex-col bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 text-slate-700 transition-all duration-300 shrink-0 border-r backdrop-blur-sm ${collapsed ? 'w-[72px]' : 'w-64'
        }`}
    >
      {/* Logo */}
      <div className='flex items-center gap-2 px-4 py-5 border-b border-slate-800/60'>
        <Image
          src='/logo-wave.jpg'
          alt='WAVE'
          width={34}
          height={34}
          className='rounded-full object-cover shadow-sm ring-2 ring-white/10 shrink-0'
        />
        {!collapsed && (
          <span className='text-slate-700 font-black text-xl tracking-tighter truncate'>
            WAVE <span className='text-indigo-400 text-xs font-bold ml-1 uppercase'>{config.title}</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          className="
    absolute
    -right-3
    top-6
    z-50
    h-7
    w-7
    rounded-full
    border
    border-slate-200
    bg-white
    shadow-md
    flex
    items-center
    justify-center
    text-slate-500
    hover:text-slate-900
    hover:shadow-lg
    transition-all
  "
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''
              }`}
          />
        </button>
      </div>

      {/* Nav Items */}
      <nav className='flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto'>
        {config.navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                ? config.activeClass
                : 'text-slate-400 hover:text-black hover:bg-indigo-50'
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
            <div className={`w-8 h-8 rounded-full ${config.avatarClass} flex items-center justify-center text-white font-black text-xs shrink-0`}>
              {initials}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-black truncate'>{authUser.name}</p>
              <p className='text-xs text-slate-800 truncate'>{authUser.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all w-full text-left'
        >
          <LogOut className='w-5 h-5 shrink-0' />
          {!collapsed && <span className='text-sm font-semibold'>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
