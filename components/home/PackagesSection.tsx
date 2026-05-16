'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const packages = [
  {
    id: 'diamond',
    name: 'Gói Kim Cương',
    badge: 'Phổ biến nhất',
    pricePerWash: '150,000đ',
    priceMonthly: '499,000đ',
    highlight: true,
    color: 'from-cyan-500 to-blue-600',
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
    color: 'from-yellow-500 to-amber-600',
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
    color: 'from-slate-400 to-slate-600',
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
    color: 'from-orange-400 to-orange-600',
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
    <section id='packages' className='py-24 bg-white px-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-14'>
          <div className='inline-flex items-center gap-2 bg-cyan-50 text-cyan-600 text-sm px-4 py-1.5 rounded-full mb-4 font-medium'>
            <Star className='w-4 h-4 fill-current' />
            Bảng giá dịch vụ
          </div>
          <h2 className='text-4xl font-bold text-gray-900 mb-4'>
            Chọn gói rửa xe phù hợp
          </h2>
          <p className='text-gray-500 max-w-xl mx-auto text-lg'>
            Đa dạng gói dịch vụ từ cơ bản đến cao cấp, đáp ứng mọi nhu cầu
            của bạn với chi phí tối ưu nhất.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                'relative rounded-2xl border flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1',
                pkg.highlight
                  ? 'border-cyan-400 shadow-lg shadow-cyan-100 ring-2 ring-cyan-400/30'
                  : 'border-gray-200 shadow-sm',
              )}
            >
              {pkg.badge && (
                <div
                  className={cn(
                    'absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full text-white',
                    `bg-gradient-to-r ${pkg.color}`,
                  )}
                >
                  {pkg.badge}
                </div>
              )}

              {/* Card Header */}
              <div
                className={cn(
                  'p-6 bg-gradient-to-br text-white',
                  pkg.color,
                )}
              >
                <h3 className='text-lg font-bold mb-3'>{pkg.name}</h3>
                <div>
                  <span className='text-3xl font-extrabold'>
                    {pkg.pricePerWash}
                  </span>
                  <span className='text-white/70 text-sm'>/lần</span>
                </div>
                {pkg.priceMonthly && (
                  <div className='mt-1 text-white/80 text-sm'>
                    hoặc{' '}
                    <span className='font-semibold text-white'>
                      {pkg.priceMonthly}
                    </span>
                    /tháng
                  </div>
                )}
              </div>

              {/* Features */}
              <div className='flex-1 p-6 flex flex-col gap-4'>
                <ul className='space-y-2.5 flex-1'>
                  {pkg.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2.5 text-sm text-gray-700'>
                      <Check className='w-4 h-4 text-cyan-500 shrink-0 mt-0.5' />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => router.push('/register')}
                  className={cn(
                    'w-full h-10 rounded-full text-sm font-semibold mt-2 border-0',
                    pkg.highlight
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
                  )}
                >
                  Đăng ký ngay
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
