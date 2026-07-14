'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';
import {
  User,
  Bell,
  Ticket,
  Pencil,
  Star,
  Car,
  History,
  Lock,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type MenuGroup = {
  heading: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    heading: 'Tài khoản',
    items: [
      { label: 'Hồ sơ', href: '/profile', icon: User },
      { label: 'Xe của tôi', href: '/profile/vehicles', icon: Car },
      { label: 'Đổi mật khẩu', href: '/', icon: Lock },
    ],
  },
  {
    heading: 'Dịch vụ',
    items: [
      { label: 'Lịch sử rửa xe', href: '/profile/orders', icon: History },
      { label: 'Thông báo', href: '/', icon: Bell },
    ],
  },
  {
    heading: 'Ưu đãi',
    items: [
      { label: 'Khách hàng thân thiết', href: '/profile/loyalty', icon: Star },
      {
        label: 'Lịch sử điểm thưởng',
        href: '/profile/loyalty/transactions',
        icon: Coins,
      },
      { label: 'Voucher của tôi', href: '/profile/my-voucher', icon: Ticket },
    ],
  },
];

const allItems = menuGroups.flatMap((group) => group.items);

// Chọn item khớp cụ thể nhất (prefix dài nhất) để tránh highlight cả item cha
// "/profile" khi đang ở route con như "/profile/orders".
function getActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of allItems) {
    if (item.href === '/') continue;
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

export default function ProfileSidebar() {
  const authUser = useAuthStore((s) => s.authUser);
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  const initials = getInitials(authUser?.name);

  return (
    <div className='rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5'>
      {/* User Summary */}
      <div className='flex items-center gap-3'>
        <div className='flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-primary/10 font-bold text-primary shadow-sm'>
          {authUser?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authUser.avatarUrl}
              alt={authUser.name}
              className='size-full object-cover'
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className='min-w-0'>
          <p className='truncate font-semibold text-foreground'>
            {authUser?.name || 'Người dùng'}
          </p>
          <Link
            href='/profile'
            className='mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary'
          >
            <Pencil className='size-3' />
            Sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* Mobile / tablet: horizontal scrollable menu */}
      <nav className='-mx-4 mt-4 overflow-x-auto px-4 lg:hidden'>
        <div className='flex w-max gap-2 pb-1'>
          {allItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === activeHref;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium transition-colors duration-150',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className='size-[18px] shrink-0' />
                <span className='whitespace-nowrap'>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: grouped vertical menu */}
      <nav className='mt-4 hidden space-y-5 border-t border-border pt-4 lg:block'>
        {menuGroups.map((group) => (
          <div key={group.heading} className='space-y-1'>
            <p className='px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
              {group.heading}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-medium transition-colors duration-150',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {active && (
                    <span className='absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary' />
                  )}
                  <Icon className='size-[18px] shrink-0' />
                  <span className='truncate'>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
