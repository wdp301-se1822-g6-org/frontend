'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, Crown, CalendarDays, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  {
    id: 'member',
    name: 'Member',
    icon: Star,
    color: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-300',
    accentColor: 'text-slate-600',
    bgAccent: 'bg-slate-50',
    bookingWindow: '7 ngày',
    pointsRate: '1 điểm / 1,000đ',
    highlight: false,
    badge: null,
    perks: [
      'Đặt lịch trước 7 ngày',
      'Tích 1 điểm / 1,000đ chi tiêu',
      'Xem lịch sử rửa xe',
      'Quản lý xe cá nhân',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: Star,
    color: 'from-slate-400 to-slate-500',
    borderColor: 'border-slate-400',
    accentColor: 'text-slate-500',
    bgAccent: 'bg-slate-50',
    bookingWindow: '10 ngày',
    pointsRate: '1.5 điểm / 1,000đ',
    highlight: false,
    badge: null,
    perks: [
      'Đặt lịch trước 10 ngày',
      'Tích 1.5 điểm / 1,000đ',
      'Giảm 5% mỗi lần rửa',
      'Ưu tiên hàng đợi',
      'Đổi điểm lấy dịch vụ',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: Crown,
    color: 'from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-400',
    accentColor: 'text-yellow-600',
    bgAccent: 'bg-yellow-50',
    bookingWindow: '12 ngày',
    pointsRate: '2 điểm / 1,000đ',
    highlight: true,
    badge: 'Phổ biến',
    perks: [
      'Đặt lịch trước 12 ngày',
      'Tích 2 điểm / 1,000đ',
      'Giảm 10% mỗi lần rửa',
      'Ưu tiên hàng đợi cao',
      'Đổi điểm lấy rửa miễn phí',
      'Thông báo khuyến mãi sớm',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: Zap,
    color: 'from-primary to-secondary',
    borderColor: 'border-primary/20',
    accentColor: 'text-primary',
    bgAccent: 'bg-primary/5',
    bookingWindow: '14 ngày',
    pointsRate: '3 điểm / 1,000đ',
    highlight: true,
    badge: 'Đặc quyền VIP',
    perks: [
      'Đặt lịch trước 14 ngày',
      'Tích 3 điểm / 1,000đ',
      'Giảm 15% mỗi lần rửa',
      'Ưu tiên tuyệt đối',
      'Rửa miễn phí hàng tháng',
      'Hỗ trợ khách hàng VIP',
      'Tặng quà sinh nhật đặc biệt',
    ],
  },
];

export function LoyaltyTiersSection() {
  const router = useRouter();

  return (
    <section id='loyalty' className='py-24 bg-background px-4 relative overflow-hidden'>
      <div className='absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent' />
      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest'>
            <Crown className='w-4 h-4' />
            Chương trình thành viên
          </div>
          <h2 className='text-4xl sm:text-5xl font-black text-foreground mb-6 tracking-tight'>
            Hạng thành viên & <span className='text-primary'>Đặc quyền</span>
          </h2>
          <p className='text-foreground/50 max-w-2xl mx-auto text-lg font-medium'>
            Càng dùng nhiều, càng nhận nhiều ưu đãi. Hạng thành viên tự động
            nâng cấp theo chi tiêu tích lũy của bạn.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={cn(
                  'relative rounded-2xl border-2 flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1',
                  tier.highlight
                    ? `${tier.borderColor} shadow-lg ring-2 ring-yellow-400/20`
                    : `${tier.borderColor} shadow-sm`,
                )}
              >
                {tier.badge && (
                  <div
                    className={cn(
                      'absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r',
                      tier.color,
                    )}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Header */}
                <div className={cn('p-6 bg-gradient-to-br text-white', tier.color)}>
                  <div className='flex items-center gap-2 mb-3'>
                    <Icon className='w-5 h-5' />
                    <h3 className='text-xl font-bold'>{tier.name}</h3>
                  </div>
                  <div className='flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-2'>
                    <CalendarDays className='w-4 h-4 shrink-0' />
                    <span className='text-sm font-medium'>
                      Đặt trước{' '}
                      <span className='font-bold text-base'>
                        {tier.bookingWindow}
                      </span>
                    </span>
                  </div>
                  <div className='mt-2 text-white/80 text-sm'>
                    {tier.pointsRate}
                  </div>
                </div>

                {/* Perks */}
                <div className='flex-1 p-5 flex flex-col gap-4'>
                  <ul className='space-y-2.5 flex-1'>
                    {tier.perks.map((perk) => (
                      <li
                        key={perk}
                        className='flex items-start gap-2 text-sm text-gray-700'
                      >
                        <Check
                          className={cn(
                            'w-4 h-4 shrink-0 mt-0.5',
                            tier.accentColor,
                          )}
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => router.push('/register')}
                    className={cn(
                      'w-full h-10 rounded-full text-sm font-semibold mt-1 border-0 bg-gradient-to-r text-white',
                      tier.color,
                      tier.highlight
                        ? 'shadow-md shadow-yellow-200'
                        : 'opacity-90 hover:opacity-100',
                    )}
                  >
                    Bắt đầu ngay
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade note */}
        <p className='text-center text-sm text-foreground/40 mt-12 font-medium'>
          Hạng thành viên được tự động nâng cấp dựa trên tổng chi tiêu tích lũy trong 12 tháng.
        </p>
      </div>
    </section>
  );
}
