'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';

export function MembershipBanner() {
  const router = useRouter();

  return (
    <section id='promotions' className='bg-linear-to-r from-primary via-primary/90 to-primary/80 py-12 px-4 shadow-inner'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8'>
        <div className='flex items-center gap-6'>
          <div className='bg-white/10 backdrop-blur-md rounded-2xl p-4 shrink-0 border border-white/20 shadow-lg'>
            <Crown className='w-8 h-8 text-secondary' />
          </div>
          <div>
            <div className='text-white/60 text-xs font-black uppercase tracking-[0.2em]'>
              Chương trình thành viên đặc biệt
            </div>
            <div className='text-white text-2xl sm:text-3xl font-black mt-1'>
              Đặt lịch sớm — Ưu đãi lớn với hạng{' '}
              <span className='text-secondary'>Platinum</span>
            </div>
            <div className='text-white/70 text-sm mt-2 font-medium'>
              Tích lũy điểm thưởng không giới hạn và nhận ngay những đặc quyền cao cấp nhất.
            </div>
          </div>
        </div>

        <Button
          onClick={() =>
            document.getElementById('loyalty')?.scrollIntoView({ behavior: 'smooth' })
          }
          className='bg-secondary hover:bg-secondary/90 text-white border-0 h-12 px-10 text-base font-bold rounded-full shadow-xl shadow-secondary/20 transition-all hover:scale-105 active:scale-95 shrink-0'
        >
          Khám phá ngay
        </Button>
      </div>
    </section>
  );
}
