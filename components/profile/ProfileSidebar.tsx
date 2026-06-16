'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';
import { User, Bell, Ticket, Pencil, Star, Car, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    title: 'Tài Khoản Của Tôi',
    icon: User,
    color: 'text-blue-500',
    subItems: [
      { label: 'Hồ Sơ', href: '/profile' },
      { label: 'Xe Của Tôi', href: '/profile/vehicles' },
      { label: 'Đổi Mật Khẩu', href: '/' },
    ],
  },
  {
    title: 'Lịch sử rửa xe',
    icon: Car,
    color: 'text-orange-500',
    href: '/profile/orders',
  },
  {
    title: 'Thông Báo',
    icon: Bell,
    color: 'text-red-500',
    href: '/',
  },

  {
    title: 'Khách hàng thân thiết',
    icon: Star,
    color: 'text-yellow-500',
    href: '/profile/loyalty',
  },
  {
    title: 'Lịch sử điểm thưởng',
    icon: History,
    color: 'text-green-500',
    href: '/profile/loyalty/transactions',
  },
  {
    title: 'Voucher của tôi',
    icon: Ticket,
    color: 'text-blue-500',
    href: '/profile/vouchers',
  },
];

export default function ProfileSidebar() {
  const authUser = useAuthStore((s) => s.authUser);
  const pathname = usePathname();

  const initials = getInitials(authUser?.name);

  return (
    <div className='flex flex-col gap-6'>
      {/* User Summary */}
      <div className='flex items-center gap-3 px-2'>
        <div className='relative group'>
          <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-background shadow-sm'>
            {authUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authUser.avatarUrl}
                alt={authUser.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>
        <div className='flex flex-col'>
          <span className='font-bold text-foreground truncate max-w-[150px]'>
            {authUser?.name || 'Người dùng'}
          </span>
          <Link
            href='/profile'
            className='flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors'
          >
            <Pencil className='w-3 h-3' />
            Sửa Hồ Sơ
          </Link>
        </div>
      </div>

      {/* Menu */}
      <nav className='space-y-1'>
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive =
            item.href === pathname ||
            item.subItems?.some((si) => si.href === pathname);

          return (
            <div
              key={idx}
              className='space-y-1'
            >
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                  item.subItems && isActive && 'bg-primary/5 text-primary',
                  !item.subItems &&
                    (pathname === item.href
                      ? 'bg-primary/5 text-primary'
                      : 'hover:bg-accent/50'),
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-md bg-card shadow-sm',
                    item.color,
                  )}
                >
                  <Icon className='w-4 h-4' />
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className='text-sm font-semibold flex-1'
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className='text-sm font-semibold flex-1'>
                    {item.title}
                  </span>
                )}
              </div>

              {item.subItems && (
                <div className='ml-11 flex flex-col gap-1'>
                  {item.subItems.map((sub, sIdx) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sIdx}
                        href={sub.href}
                        className={cn(
                          'text-sm py-1 transition-colors',
                          isSubActive
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-primary',
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
