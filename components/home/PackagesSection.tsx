'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type WashPackage = {
  id: string;
  name: string;
  badge: string | null;
  pricePerWash: string;
  priceMonthly: string | null;
  highlight: boolean;
  /** Gradient nhận diện gói (kim cương / vàng / bạc / nhanh) - màu sản phẩm có chủ đích. */
  gradient: string;
  features: string[];
};

const packages: WashPackage[] = [
  {
    id: 'diamond',
    name: 'Gói Kim Cương',
    badge: 'Phổ biến nhất',
    pricePerWash: '150,000đ',
    priceMonthly: '499,000đ',
    highlight: true,
    gradient: 'from-cyan-500 to-blue-600',
    features: [
      'Rửa áp lực cao toàn xe',
      'Phủ nano bảo vệ sơn',
      'Vệ sinh gầm xe',
      'Đánh bóng vành bánh',
      'Xịt khô & lau bóng',
      'Thơm xe cao cấp',
      'Ưu tiên đặt lịch',
    ],
  },
  {
    id: 'gold',
    name: 'Gói Vàng',
    badge: null,
    pricePerWash: '100,000đ',
    priceMonthly: '349,000đ',
    highlight: false,
    gradient: 'from-yellow-500 to-amber-600',
    features: [
      'Rửa áp lực cao toàn xe',
      'Phủ wax bảo vệ sơn',
      'Vệ sinh gầm xe',
      'Đánh bóng vành bánh',
      'Xịt khô & lau bóng',
    ],
  },
  {
    id: 'silver',
    name: 'Gói Bạc',
    badge: null,
    pricePerWash: '70,000đ',
    priceMonthly: '249,000đ',
    highlight: false,
    gradient: 'from-slate-400 to-slate-600',
    features: [
      'Rửa áp lực cao toàn xe',
      'Vệ sinh gầm xe',
      'Đánh bóng vành bánh',
      'Lau khô cơ bản',
    ],
  },
  {
    id: 'bronze',
    name: 'Gói Nhanh',
    badge: 'Nhanh nhất',
    pricePerWash: '50,000đ',
    priceMonthly: null,
    highlight: false,
    gradient: 'from-orange-400 to-orange-600',
    features: [
      'Rửa nước áp lực',
      'Xịt khô nhanh',
      'Hoàn thành trong 10 phút',
    ],
  },
];

export function PackagesSection() {
  const router = useRouter();

  return (
    <section id='booking' className='bg-card px-4 py-16'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-14 text-center'>
          <Badge className='mb-4 gap-1.5 px-4 py-1.5 text-sm'>
            <Star className='size-4 fill-current' />
            Bảng giá dịch vụ
          </Badge>
          <h2 className='mb-4 font-heading text-4xl font-bold text-foreground'>
            Chọn gói rửa xe phù hợp
          </h2>
          <p className='mx-auto max-w-xl text-lg text-muted-foreground'>
            Đa dạng gói dịch vụ từ cơ bản đến cao cấp, đáp ứng mọi nhu cầu của
            bạn với chi phí tối ưu nhất.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-md',
                pkg.highlight
                  ? 'border-primary shadow-md ring-1 ring-primary/20'
                  : 'border-border shadow-xs',
              )}
            >
              {pkg.badge && (
                <div
                  className={cn(
                    'absolute top-4 right-4 rounded-full bg-linear-to-r px-3 py-1 text-xs font-semibold text-white',
                    pkg.gradient,
                  )}
                >
                  {pkg.badge}
                </div>
              )}

              <div
                className={cn(
                  'bg-linear-to-br p-6 text-white',
                  pkg.gradient,
                )}
              >
                <h3 className='mb-3 font-heading text-lg font-bold'>
                  {pkg.name}
                </h3>
                <div>
                  <span className='text-3xl font-extrabold'>
                    {pkg.pricePerWash}
                  </span>
                  <span className='text-sm text-white/70'>/lần</span>
                </div>
                {pkg.priceMonthly && (
                  <div className='mt-1 text-sm text-white/80'>
                    hoặc{' '}
                    <span className='font-semibold text-white'>
                      {pkg.priceMonthly}
                    </span>
                    /tháng
                  </div>
                )}
              </div>

              <div className='flex flex-1 flex-col gap-4 p-6'>
                <ul className='flex-1 space-y-2.5'>
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className='flex items-start gap-2.5 text-sm text-foreground/80'
                    >
                      <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={pkg.highlight ? 'default' : 'outline'}
                  onClick={() => router.push('/register')}
                  className='mt-2 h-10 w-full rounded-full'
                >
                  Đăng ký ngay
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
