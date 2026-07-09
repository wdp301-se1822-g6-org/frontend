'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Crown, Star, CalendarDays, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierConfigs } from '@/lib/customer-api';
import { formatNumber } from '@/lib/format';

/** Shape thật của GET /tier-configs (xem BE tier-config). */
interface TierConfig {
  id: string;
  tierName: string; // None | Bronze | Silver | Gold
  minLoyaltyPoints: number;
  bookingWindowDays: number;
  pointsPer1000Vnd: number;
  discountPercent: number; // chỉ áp dụng trong khung giờ vàng
  isActive: boolean;
}

// Nhãn tiếng Việt + tông màu cho từng hạng. "None" là hạng khởi điểm.
const TIER_META: Record<
  string,
  { label: string; icon: typeof Star; highlight?: boolean }
> = {
  None: { label: 'Cơ bản', icon: Star },
  Bronze: { label: 'Bronze', icon: Star },
  Silver: { label: 'Silver', icon: Star },
  Gold: { label: 'Gold', icon: Crown, highlight: true },
};

export function LoyaltyTiersSection() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tier-configs-public'],
    queryFn: async () => {
      const res = await getTierConfigs();
      return (res.data?.data ?? res.data ?? []) as TierConfig[];
    },
  });

  const tiers = (data ?? [])
    .filter((t) => t.isActive)
    .sort((a, b) => a.minLoyaltyPoints - b.minLoyaltyPoints);

  return (
    <section
      id='loyalty'
      className='py-12 sm:py-16 bg-background px-4 relative overflow-hidden'
    >
      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-[0.08em]'>
            <Crown className='w-4 h-4' />
            Chương trình thành viên
          </div>
          <h2 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading font-semibold text-foreground leading-[1.15] mb-4 tracking-tight'>
            Hạng thành viên & <span className='text-primary'>đặc quyền</span>
          </h2>
          <p className='text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg'>
            Tích điểm qua mỗi lần rửa để tự động lên hạng. Hạng càng cao,
            ưu đãi giờ vàng và cửa sổ đặt lịch càng lớn.
          </p>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='h-80 rounded-xl border border-border bg-muted/40 animate-pulse'
              />
            ))}
          </div>
        ) : isError || tiers.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-border rounded-xl bg-muted/30 max-w-md mx-auto'>
            <p className='text-sm text-muted-foreground'>
              Chưa tải được thông tin hạng thành viên. Vui lòng thử lại sau.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {tiers.map((tier) => {
              const meta = TIER_META[tier.tierName] ?? {
                label: tier.tierName,
                icon: Star,
              };
              const Icon = meta.icon;
              const highlight = meta.highlight;
              return (
                <div
                  key={tier.id}
                  className={cn(
                    'relative rounded-xl border flex flex-col overflow-hidden transition-colors bg-card',
                    highlight
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border',
                  )}
                >
                  {highlight && (
                    <div className='absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground'>
                      Hạng cao nhất
                    </div>
                  )}

                  {/* Header */}
                  <div className='p-6 border-b border-border'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          highlight ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <h3 className='font-heading text-xl font-semibold text-foreground'>
                        {meta.label}
                      </h3>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {tier.minLoyaltyPoints === 0
                        ? 'Áp dụng ngay khi đăng ký'
                        : `Từ ${formatNumber(tier.minLoyaltyPoints)} điểm tích lũy`}
                    </p>
                  </div>

                  {/* Perks — chỉ nêu đúng cơ chế BE */}
                  <div className='flex-1 p-5 flex flex-col gap-4'>
                    <ul className='space-y-2.5 flex-1 text-sm text-foreground'>
                      <li className='flex items-start gap-2'>
                        <Check className='w-4 h-4 shrink-0 mt-0.5 text-primary' />
                        Tích {tier.pointsPer1000Vnd} điểm / 1.000đ chi tiêu
                      </li>
                      <li className='flex items-start gap-2'>
                        <Sparkles className='w-4 h-4 shrink-0 mt-0.5 text-warning' />
                        Giảm {tier.discountPercent}% khi đặt khung giờ vàng
                      </li>
                      <li className='flex items-start gap-2'>
                        <CalendarDays className='w-4 h-4 shrink-0 mt-0.5 text-primary' />
                        Đặt lịch trước tối đa {tier.bookingWindowDays} ngày
                      </li>
                      <li className='flex items-start gap-2 text-muted-foreground'>
                        <Check className='w-4 h-4 shrink-0 mt-0.5 text-primary' />
                        Voucher rửa miễn phí sau mỗi 10 lượt rửa hợp lệ
                      </li>
                    </ul>

                    <Button
                      onClick={() => router.push('/register')}
                      variant={highlight ? 'default' : 'outline'}
                      className='w-full rounded-lg text-sm font-semibold'
                    >
                      Bắt đầu ngay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className='text-center text-sm text-muted-foreground mt-10'>
          Hạng thành viên tự động nâng theo tổng điểm tích lũy. Ưu đãi giảm giá
          chỉ áp dụng trong khung giờ vàng.
        </p>
      </div>
    </section>
  );
}
