'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';
import {
  User,
  Bell,
  Ticket,
  Star,
  Car,
  History,
  CalendarClock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Sidebar nhóm theo tác vụ: tiêu đề nhóm KHÔNG bấm được, item luôn là link.
 * Active tính theo prefix dài nhất khớp pathname để trang con
 * (/profile/orders/[id], /profile/loyalty/transactions) vẫn sáng đúng mục.
 */
const menuGroups: {
  heading: string;
  items: { label: string; href: string; icon: typeof User }[];
}[] = [
  {
    heading: 'Tài khoản',
    items: [
      { label: 'Hồ sơ cá nhân', href: '/profile', icon: User },
      { label: 'Xe của tôi', href: '/profile/vehicles', icon: Car },
    ],
  },
  {
    heading: 'Lịch rửa xe',
    items: [
      { label: 'Lịch sử rửa xe', href: '/profile/orders', icon: CalendarClock },
    ],
  },
  {
    heading: 'Ưu đãi',
    items: [
      { label: 'Hạng thành viên', href: '/profile/loyalty', icon: Star },
      {
        label: 'Lịch sử điểm thưởng',
        href: '/profile/loyalty/transactions',
        icon: History,
      },
      { label: 'Voucher của tôi', href: '/profile/my-voucher', icon: Ticket },
    ],
  },
  {
    heading: 'Khác',
    items: [
      { label: 'Thông báo', href: '/profile/notifications', icon: Bell },
    ],
  },
];

export default function ProfileSidebar() {
  const authUser = useAuthStore((s) => s.authUser);
  const pathname = usePathname();

  const initials = getInitials(authUser?.name);

  // Item active = href là prefix dài nhất của pathname trong toàn bộ menu.
  const allHrefs = menuGroups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className='flex flex-col gap-5'>
      {/* User Summary */}
      <div className='flex items-center gap-3 px-2'>
        <div className='w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-border shrink-0'>
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
        <div className='flex flex-col min-w-0'>
          <span className='font-heading font-bold text-foreground truncate capitalize'>
            {authUser?.name || 'Người dùng'}
          </span>
          <Link
            href='/profile'
            className='text-xs font-semibold text-primary hover:underline underline-offset-2'
          >
            Xem hồ sơ
          </Link>
        </div>
      </div>

      {/* Menu theo nhóm */}
      <nav className='space-y-5' aria-label='Menu tài khoản'>
        {menuGroups.map((group) => (
          <div key={group.heading}>
            <p className='px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-placeholder select-none'>
              {group.heading}
            </p>
            <ul className='space-y-0.5'>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-muted-foreground font-medium hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
