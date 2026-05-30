'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock3, Loader2, Ticket, Coins } from 'lucide-react';
import { getTierConfigs } from '@/lib/customer-api';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

/** Shape thật từ BE `GET /tier-configs` (camelCase). Tier names: None/Bronze/Silver/Gold. */
type TierConfigDto = {
  id: string;
  tierName: 'None' | 'Bronze' | 'Silver' | 'Gold';
  minLoyaltyPoints: number;
  bookingWindowDays: number;
  priorityLevel: number;
  pointsPer1000Vnd: number;
  discountPercent: number;
  isActive: boolean;
};

const TIER_LABELS: Record<TierConfigDto['tierName'], string> = {
  None: 'Cơ bản',
  Bronze: 'Bronze',
  Silver: 'Silver',
  Gold: 'Gold',
};

export function LoyaltyTiersSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tier-configs', 'public'],
    queryFn: getTierConfigs,
  });

  const tiers: TierConfigDto[] = (data?.data?.data ?? data?.data ?? [])
    .slice()
    .sort(
      (a: TierConfigDto, b: TierConfigDto) => a.priorityLevel - b.priorityLevel,
    );

  const topPriority = tiers.length
    ? Math.max(...tiers.map((t) => t.priorityLevel))
    : -1;

  return (
    <section
      id='loyalty'
      className='scroll-mt-20 border-y border-border bg-muted/30 py-20 sm:py-24'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl'>
          <p className='text-sm font-semibold tracking-wide text-primary'>
            Thành viên & tích điểm
          </p>
          <h2 className='mt-3 font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]'>
            Hạng thành viên theo điểm tích lũy
          </h2>
          <p className='mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            Mỗi lần hoàn tất dịch vụ, khách hàng được cộng điểm để nâng hạng, mở
            khóa ưu đãi tốt hơn và nhận voucher theo từng cấp thành viên. Số liệu
            dưới đây lấy trực tiếp từ cấu hình hệ thống.
          </p>
        </div>

        {isLoading && (
          <div className='mt-12 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-[15px] text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            Đang tải hạng thành viên…
          </div>
        )}

        {isError && (
          <div className='mt-12 rounded-xl border border-border bg-card py-16 text-center text-[15px] text-muted-foreground'>
            Không tải được cấu hình hạng thành viên lúc này.
          </div>
        )}

        {!isLoading && !isError && tiers.length > 0 && (
          <div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {tiers.map((tier) => {
              const isTop = tier.priorityLevel === topPriority;
              return (
                <div
                  key={tier.id}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-card p-7 shadow-sm',
                    isTop
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-border',
                  )}
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='font-heading text-xl font-bold text-foreground'>
                      {TIER_LABELS[tier.tierName]}
                    </h3>
                    {isTop && (
                      <span className='rounded-full bg-primary px-2.5 py-1 text-[12px] font-semibold text-primary-foreground'>
                        Cao nhất
                      </span>
                    )}
                  </div>

                  <p className='mt-1.5 text-[14px] font-medium text-muted-foreground'>
                    {tier.minLoyaltyPoints === 0
                      ? 'Mặc định khi đăng ký'
                      : `Từ ${formatNumber(tier.minLoyaltyPoints)} điểm tích lũy`}
                  </p>

                  <ul className='mt-6 space-y-3.5 border-t border-border pt-6 text-[15px]'>
                    <li className='flex items-start gap-2.5'>
                      <Clock3 className='mt-0.5 size-4.5 shrink-0 text-primary' />
                      <span className='text-foreground/80'>
                        Đặt lịch trước{' '}
                        <span className='font-semibold text-foreground'>
                          {tier.bookingWindowDays} ngày
                        </span>
                      </span>
                    </li>
                    <li className='flex items-start gap-2.5'>
                      <Coins className='mt-0.5 size-4.5 shrink-0 text-primary' />
                      <span className='text-foreground/80'>
                        Tích{' '}
                        <span className='font-semibold text-foreground'>
                          {tier.pointsPer1000Vnd} điểm
                        </span>{' '}
                        / 1.000đ chi tiêu
                      </span>
                    </li>
                    <li className='flex items-start gap-2.5'>
                      <Ticket className='mt-0.5 size-4.5 shrink-0 text-primary' />
                      <span className='text-foreground/80'>
                        {tier.discountPercent > 0 ? (
                          <>
                            Giảm{' '}
                            <span className='font-semibold text-foreground'>
                              {tier.discountPercent}%
                            </span>{' '}
                            trong khung giờ vàng
                          </>
                        ) : (
                          'Có thể sử dụng mã giảm giá'
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <p className='mt-8 max-w-3xl text-[14px] leading-relaxed text-muted-foreground'>
          <span className='font-semibold text-foreground'>Lưu ý:</span> mức giảm
          theo hạng chỉ áp dụng trong khung giờ vàng do hệ thống cấu hình. Điểm
          thưởng có thể bị trừ khi khách đặt lịch nhưng không đến, và được reset
          theo chính sách hằng năm. Sau mỗi 10 đơn hoàn tất, tài khoản được tự
          động cấp một voucher rửa miễn phí (có giới hạn giá trị và thời hạn).
        </p>
      </div>
    </section>
  );
}
