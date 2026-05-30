'use client';

import { getMyLoyalty, getTierConfigs } from '@/lib/customer-api';
import { useAuthStore } from '@/store/useAuthStore';
import { LoyaltyAccount, TierConfig, TierName } from '@/types/loyalty';
import { formatNumber } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import {
  Crown,
  Sparkles,
  Award,
  Calendar,
  Coins,
  Ticket,
  Info,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Style thẻ thành viên theo hạng thật của BE: None / Bronze / Silver / Gold.
const tierStyles: Record<
  string,
  { gradient: string; badgeBg: string; chipBg: string }
> = {
  none: {
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
    badgeBg: 'bg-slate-800/80 text-slate-200 border-slate-600',
    chipBg: 'bg-slate-500/20',
  },
  bronze: {
    gradient: 'from-amber-700 via-orange-800 to-amber-950',
    badgeBg: 'bg-amber-950/70 text-amber-200 border-amber-700',
    chipBg: 'bg-amber-600/20',
  },
  silver: {
    gradient: 'from-slate-400 via-slate-500 to-slate-700',
    badgeBg: 'bg-slate-700/80 text-slate-100 border-slate-400',
    chipBg: 'bg-slate-300/20',
  },
  gold: {
    gradient: 'from-amber-400 via-yellow-600 to-amber-800',
    badgeBg: 'bg-amber-900/60 text-amber-100 border-amber-400',
    chipBg: 'bg-amber-400/20',
  },
};

const TIER_LABELS: Record<TierName, string> = {
  None: 'Cơ bản',
  Bronze: 'Bronze',
  Silver: 'Silver',
  Gold: 'Gold',
};

const VOUCHER_THRESHOLD = 10; // BE cấp voucher rửa miễn phí sau mỗi 10 đơn hoàn tất.

export default function LoyaltyPage() {
  const authUser = useAuthStore((s) => s.authUser);

  const {
    data: loyaltyData,
    isLoading: isLoyaltyLoading,
    error: loyaltyError,
  } = useQuery({
    queryKey: ['my-loyalty'],
    queryFn: getMyLoyalty,
  });

  const { data: tierConfigsData, isLoading: isTiersLoading } = useQuery({
    queryKey: ['tier-configs'],
    queryFn: getTierConfigs,
  });

  const loyalty: LoyaltyAccount | null =
    loyaltyData?.data?.data ?? loyaltyData?.data ?? null;
  const tiers: TierConfig[] =
    tierConfigsData?.data?.data ?? tierConfigsData?.data ?? [];

  const isLoading = isLoyaltyLoading || isTiersLoading;

  const currentTierName = loyalty?.tierName ?? 'None';
  const currentStyle =
    tierStyles[currentTierName.toLowerCase()] ?? tierStyles.none;

  const sortedTiers = [...tiers].sort(
    (a, b) => a.priorityLevel - b.priorityLevel,
  );
  const currentTierConfig = sortedTiers.find(
    (t) => t.tierName === currentTierName,
  );
  const currentTierIndex = sortedTiers.findIndex(
    (t) => t.tierName === currentTierName,
  );
  const nextTierConfig =
    currentTierIndex !== -1 && currentTierIndex < sortedTiers.length - 1
      ? sortedTiers[currentTierIndex + 1]
      : null;

  const points = loyalty?.pointsBalance ?? 0;
  const pointsToNext = nextTierConfig
    ? Math.max(nextTierConfig.minLoyaltyPoints - points, 0)
    : 0;
  const tierProgress = nextTierConfig
    ? Math.min((points / nextTierConfig.minLoyaltyPoints) * 100, 100)
    : 100;

  const washesToward = loyalty?.successfulWashesTowardVoucher ?? 0;
  const voucherProgress = Math.min(
    (washesToward / VOUCHER_THRESHOLD) * 100,
    100,
  );

  if (isLoading) {
    return (
      <div className='flex min-h-100 flex-col items-center justify-center gap-3'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-sm font-semibold text-muted-foreground'>
          Đang tải dữ liệu thành viên...
        </p>
      </div>
    );
  }

  if (loyaltyError) {
    return (
      <div className='mx-auto mt-8 max-w-lg space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive'>
        <Info className='mx-auto h-8 w-8' />
        <h3 className='font-heading text-lg font-bold'>Đã xảy ra lỗi</h3>
        <p className='text-sm'>
          Không thể kết nối đến máy chủ để lấy thông tin thành viên. Vui lòng thử
          lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div>
        <h1 className='flex items-center gap-2 font-heading text-2xl font-bold text-foreground'>
          <Award className='h-7 w-7 text-primary' /> Khách hàng thân thiết
        </h1>
        <p className='text-sm text-muted-foreground'>
          Tích điểm qua mỗi đơn hoàn tất để lên hạng và mở thêm ưu đãi.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
        {/* Left: E-Card & progress */}
        <div className='space-y-6 lg:col-span-7'>
          {/* E-Membership Card */}
          <div
            className={`relative flex aspect-[1.586/1] flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br p-8 text-white shadow-lg ${currentStyle.gradient}`}
          >
            <div className='z-10 flex items-start justify-between'>
              <div className='space-y-1'>
                <p className='text-[10px] font-bold tracking-widest text-white/60 uppercase'>
                  Thẻ thành viên WAVE
                </p>
                <h3 className='font-heading text-lg font-bold tracking-wide'>
                  WAVE
                </h3>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase backdrop-blur-md ${currentStyle.badgeBg}`}
              >
                <Crown className='h-3.5 w-3.5' /> {TIER_LABELS[currentTierName]}
              </div>
            </div>

            <div className='z-10 my-4 flex items-center gap-4'>
              <div
                className={`relative flex h-9 w-11 flex-col justify-around overflow-hidden rounded-md border border-white/20 p-1 ${currentStyle.chipBg}`}
              >
                <div className='h-px w-full bg-white/20' />
                <div className='h-px w-full bg-white/20' />
                <div className='h-px w-full bg-white/20' />
              </div>
              <div>
                <p className='text-xs font-medium text-white/70'>Chủ thẻ</p>
                <p className='text-sm font-bold tracking-wide uppercase sm:text-base'>
                  {authUser?.name || 'KHÁCH HÀNG'}
                </p>
              </div>
            </div>

            <div className='z-10 grid grid-cols-2 gap-4 border-t border-white/15 pt-4'>
              <div>
                <p className='flex items-center gap-1 text-[9px] font-bold tracking-widest text-white/50 uppercase'>
                  <Coins className='h-3 w-3' /> Điểm tích lũy
                </p>
                <p className='text-lg font-bold tracking-wide'>
                  {formatNumber(points)}{' '}
                  <span className='text-xs font-semibold text-white/70'>
                    điểm
                  </span>
                </p>
              </div>
              <div className='text-right'>
                <p className='flex items-center justify-end gap-1 text-[9px] font-bold tracking-widest text-white/50 uppercase'>
                  <Calendar className='h-3 w-3' /> Tổng lượt rửa
                </p>
                <p className='text-sm font-bold'>
                  {formatNumber(loyalty?.totalSuccessfulWashes ?? 0)} lượt
                </p>
              </div>
            </div>
          </div>

          {/* Tier progress */}
          <Card className='rounded-2xl border-border'>
            <CardContent className='space-y-5 p-6'>
              <div className='flex items-center justify-between border-b border-border pb-4'>
                <h3 className='flex items-center gap-2 font-heading font-semibold text-foreground'>
                  <Sparkles className='h-5 w-5 text-primary' /> Lộ trình lên hạng
                </h3>
                <span className='text-sm font-semibold text-foreground'>
                  {formatNumber(points)} điểm
                </span>
              </div>

              {nextTierConfig ? (
                <div className='space-y-4'>
                  <div className='flex items-end justify-between text-sm'>
                    <span className='font-medium text-muted-foreground'>
                      Tiến độ tới hạng{' '}
                      <span className='font-semibold text-foreground'>
                        {TIER_LABELS[nextTierConfig.tierName]}
                      </span>
                    </span>
                    <span className='font-semibold text-primary'>
                      {formatNumber(points)} /{' '}
                      {formatNumber(nextTierConfig.minLoyaltyPoints)}
                    </span>
                  </div>
                  <div className='h-2.5 overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full rounded-full bg-primary transition-all duration-500'
                      style={{ width: `${tierProgress}%` }}
                    />
                  </div>
                  <div className='flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground'>
                    <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                    <p>
                      Bạn cần thêm{' '}
                      <strong className='text-foreground'>
                        {formatNumber(pointsToNext)} điểm
                      </strong>{' '}
                      để lên hạng{' '}
                      <strong className='text-primary'>
                        {TIER_LABELS[nextTierConfig.tierName]}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground'>
                  <Crown className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                  <p>
                    Bạn đang ở hạng cao nhất{' '}
                    <strong className='text-foreground'>
                      {TIER_LABELS[currentTierName]}
                    </strong>
                    . Tiếp tục tích điểm để duy trì hạng qua kỳ reset thường niên.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Free-wash voucher progress */}
          <Card className='rounded-2xl border-border'>
            <CardContent className='space-y-4 p-6'>
              <div className='flex items-center justify-between'>
                <h3 className='flex items-center gap-2 font-heading font-semibold text-foreground'>
                  <Ticket className='h-5 w-5 text-primary' /> Voucher rửa miễn phí
                </h3>
                <span className='text-sm font-semibold text-foreground'>
                  {washesToward} / {VOUCHER_THRESHOLD}
                </span>
              </div>
              <div className='h-2.5 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-all duration-500'
                  style={{ width: `${voucherProgress}%` }}
                />
              </div>
              <p className='text-sm text-muted-foreground'>
                Còn{' '}
                <strong className='text-foreground'>
                  {Math.max(VOUCHER_THRESHOLD - washesToward, 0)} đơn hoàn tất
                </strong>{' '}
                nữa là hệ thống tự cấp một voucher rửa miễn phí (có giới hạn giá
                trị và thời hạn sử dụng).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: current benefits */}
        <div className='lg:col-span-5'>
          <Card className='flex h-full flex-col rounded-2xl border-border'>
            <CardHeader className='border-b border-border pb-4'>
              <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                <Crown className='h-5 w-5 text-primary' /> Đặc quyền hạng hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent className='flex-1 space-y-4 p-6'>
              {currentTierConfig ? (
                <>
                  <BenefitRow
                    icon={<Award className='h-5 w-5 text-primary' />}
                    label='Ưu đãi giảm giá'
                    value={
                      currentTierConfig.discountPercent > 0
                        ? `Giảm ${currentTierConfig.discountPercent}% trong khung giờ vàng`
                        : 'Chưa có ưu đãi giảm giá'
                    }
                  />
                  <BenefitRow
                    icon={<Calendar className='h-5 w-5 text-primary' />}
                    label='Cửa sổ đặt lịch'
                    value={`Đặt trước tối đa ${currentTierConfig.bookingWindowDays} ngày`}
                  />
                  <BenefitRow
                    icon={<Coins className='h-5 w-5 text-primary' />}
                    label='Hệ số tích điểm'
                    value={`${currentTierConfig.pointsPer1000Vnd} điểm / 1.000đ chi tiêu`}
                  />
                </>
              ) : (
                <p className='py-6 text-center text-sm text-muted-foreground'>
                  Chưa có cấu hình đặc quyền cho hạng của bạn.
                </p>
              )}
            </CardContent>
            <div className='border-t border-border bg-muted/30 p-6'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Info className='h-4 w-4 shrink-0' />
                <p>
                  Hạng được xác định theo điểm tích lũy. Điểm được reset định kỳ
                  hằng năm.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tiers comparison */}
      <div className='space-y-4'>
        <div>
          <h2 className='flex items-center gap-2 font-heading text-lg font-semibold text-foreground'>
            <Crown className='h-5 w-5 text-primary' /> So sánh các hạng thành viên
          </h2>
          <p className='text-xs text-muted-foreground'>
            Lộ trình thăng hạng theo điểm tích lũy và quyền lợi đi kèm.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
          {sortedTiers.map((t) => {
            const isMyTier = t.tierName === currentTierName;
            const style = tierStyles[t.tierName.toLowerCase()] ?? tierStyles.none;
            return (
              <div
                key={t.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all ${
                  isMyTier
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {isMyTier && (
                  <div className='absolute top-0 right-0 z-10 flex items-center gap-1 rounded-bl-2xl bg-primary px-3 py-1 text-[9px] font-bold tracking-wide text-primary-foreground uppercase'>
                    <Crown className='h-3 w-3' /> Hạng của bạn
                  </div>
                )}
                <div
                  className={`relative bg-linear-to-br p-5 text-white ${style.gradient}`}
                >
                  <Crown className='mb-2 h-6 w-6' />
                  <h3 className='font-heading text-lg font-bold tracking-wide'>
                    {TIER_LABELS[t.tierName]}
                  </h3>
                  <p className='mt-1 text-[11px] font-medium text-white/70'>
                    {t.minLoyaltyPoints === 0
                      ? 'Mặc định khi đăng ký'
                      : `Từ ${formatNumber(t.minLoyaltyPoints)} điểm`}
                  </p>
                </div>
                <div className='flex flex-col gap-3.5 p-5 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-muted-foreground'>
                      Giảm giá (giờ vàng)
                    </span>
                    <span className='text-sm font-bold text-primary'>
                      {t.discountPercent}%
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-muted-foreground'>
                      Đặt lịch trước
                    </span>
                    <span className='font-semibold text-foreground'>
                      {t.bookingWindowDays} ngày
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-muted-foreground'>
                      Tích điểm
                    </span>
                    <span className='font-semibold text-foreground'>
                      {t.pointsPer1000Vnd} / 1.000đ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BenefitRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3'>
      <div className='rounded-lg bg-card p-2 shadow-sm'>{icon}</div>
      <div>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold text-foreground'>{value}</p>
      </div>
    </div>
  );
}
