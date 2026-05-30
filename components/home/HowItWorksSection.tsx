'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus, CalendarCheck, Car, BadgeCheck } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Tạo tài khoản',
    desc: 'Đăng ký bằng email hoặc số điện thoại để lưu thông tin cá nhân, xe và lịch sử dịch vụ.',
  },
  {
    icon: CalendarCheck,
    title: 'Chọn lịch và thanh toán',
    desc: 'Chọn dịch vụ, khung giờ phù hợp và thanh toán online hoặc trả tại cửa hàng.',
  },
  {
    icon: Car,
    title: 'Mang xe đến cửa hàng',
    desc: 'Nhân viên tiếp nhận xe, xác nhận thông tin đặt lịch và chuyển xe vào quy trình xử lý.',
  },
  {
    icon: BadgeCheck,
    title: 'Hoàn tất và đánh giá',
    desc: 'Nhận thông báo khi xe hoàn tất, kiểm tra kết quả và đánh giá chất lượng dịch vụ.',
  },
];

export function HowItWorksSection() {
  const router = useRouter();

  return (
    <section className='border-y border-border bg-muted/30 py-20 sm:py-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl'>
          <p className='text-sm font-semibold tracking-wide text-primary'>
            Quy trình
          </p>
          <h2 className='mt-3 font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]'>
            Từ đặt lịch đến nhận xe, chỉ trong 4 bước
          </h2>
          <p className='mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            Hệ thống giúp khách hàng đặt lịch nhanh, cửa hàng tiếp nhận rõ ràng
            và cập nhật tiến trình theo từng trạng thái.
          </p>
        </div>

        <ol className='mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li
              key={title}
              className='relative rounded-xl border border-border bg-card p-6 shadow-sm'
            >
              <div className='flex items-center justify-between'>
                <span className='flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <Icon className='size-6' />
                </span>
                <span className='font-heading text-3xl font-bold text-primary/25'>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className='mt-5 font-heading text-lg font-bold text-foreground'>
                {title}
              </h3>
              <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>
                {desc}
              </p>
            </li>
          ))}
        </ol>

        <div className='mt-10'>
          <Button
            onClick={() => router.push('/booking')}
            className='h-12 px-7 text-base'
          >
            Bắt đầu đặt lịch
          </Button>
        </div>
      </div>
    </section>
  );
}
