'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function MembershipBanner() {
  const router = useRouter();

  return (
    <section className='bg-background pb-20 sm:pb-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-start gap-7 rounded-2xl border border-border bg-primary/4 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10'>
          <div className='max-w-2xl'>
            <h2 className='font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]'>
              Tạo tài khoản và đặt lịch lần đầu
            </h2>
            <p className='mt-3 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
              Đăng ký miễn phí để lưu thông tin xe, đặt lịch nhanh hơn và nhận ưu
              đãi dành cho thành viên mới.
            </p>
          </div>
          <div className='flex shrink-0 flex-wrap gap-3'>
            <Button
              onClick={() => router.push('/register')}
              className='h-12 px-7 text-base'
            >
              Đăng ký ngay
              <ArrowRight className='size-4' />
            </Button>
            <Button
              variant='outline'
              onClick={() =>
                document
                  .getElementById('services-pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className='h-12 px-7 text-base'
            >
              Xem dịch vụ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
