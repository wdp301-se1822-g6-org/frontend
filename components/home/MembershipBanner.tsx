'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function MembershipBanner() {
  return (
    <section
      id='promotions'
      className='py-10 px-4 bg-background'
    >
      <div className='max-w-7xl mx-auto'>
        <div className='relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] bg-linear-to-br from-primary/10 via-sky-50/30 to-background border border-primary/15 px-5 sm:px-10 py-6 sm:py-10 shadow-sm'>
          {/* Decorative layers */}
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute -top-24 -left-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl' />
            <div className='absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.06]' />
          </div>

          <div className='relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8'>
            <div className='flex items-start sm:items-center gap-4 sm:gap-6'>
              <div>
                <div className='inline-flex items-center text-primary text-[10px] font-black uppercase tracking-[0.25em]'>
                  Chương trình thành viên đặc biệt
                </div>
                <div className='font-heading text-foreground text-xl sm:text-2xl lg:text-3xl mt-2 tracking-tight'>
                  Đặt lịch sớm - Ưu đãi lớn với hạng{' '}
                  <span className='bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent font-black'>
                    Platinum
                  </span>
                </div>
                <div className='text-muted-foreground text-sm mt-2 font-medium max-w-xl'>
                  Tích lũy điểm thưởng không giới hạn và nhận ngay những đặc
                  quyền cao cấp nhất.
                </div>
              </div>
            </div>

            <Button
              onClick={() =>
                document
                  .getElementById('loyalty')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className='group bg-primary hover:bg-primary/90 text-white border-0 h-12 px-8 text-sm font-bold rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer'
            >
              Khám phá ngay
              <ArrowRight className='w-4 h-4 ml-1 transition-transform group-hover:translate-x-1' />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
