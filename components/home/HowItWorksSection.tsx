'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { UserPlus, CalendarCheck, Star, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Tạo tài khoản',
    desc: 'Đăng ký miễn phí chỉ trong 1 phút. Thêm thông tin xe và bắt đầu hành trình thành viên của bạn.',
    color: 'bg-cyan-500',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Đặt lịch rửa xe',
    desc: 'Chọn ngày, giờ và gói dịch vụ phù hợp. Hạng thành viên cao hơn cho phép đặt lịch sớm hơn.',
    color: 'bg-blue-500',
  },
  {
    step: '03',
    icon: Star,
    title: 'Tích điểm & nâng hạng',
    desc: 'Mỗi lần rửa xe tích lũy điểm. Đổi điểm lấy ưu đãi và tự động nâng hạng thành viên.',
    color: 'bg-yellow-500',
  },
];

export function HowItWorksSection() {
  const router = useRouter();

  return (
    <section className='py-32 bg-primary px-4 relative overflow-hidden reveal-on-scroll'>
      <div className='absolute top-0 left-0 w-full h-24 bg-linear-to-b from-background to-transparent opacity-10' />
      
      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 bg-white/10 text-secondary text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest'>
            Bắt đầu dễ dàng
          </div>
          <h2 className='text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight'>
            Chỉ 3 bước để <span className='text-secondary'>bắt đầu</span>
          </h2>
          <p className='text-white/50 max-w-2xl mx-auto text-lg font-medium leading-relaxed'>
            Tham gia cùng hàng nghìn khách hàng đang tận hưởng trải nghiệm rửa
            xe thông minh mỗi ngày với quy trình tối giản.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 relative'>
          {/* Connector lines (desktop) */}
          <div className='hidden md:block absolute top-14 left-1/3 right-1/3 h-px bg-linear-to-r from-secondary/40 via-secondary/20 to-secondary/40' />

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className='relative flex flex-col items-center text-center group'>
                <div className='relative mb-8'>
                  <div
                    className={`w-20 h-20 rounded-3xl ${s.color.replace('cyan', 'secondary').replace('blue', 'primary').replace('yellow', 'secondary')} flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 border-2 border-white/20`}
                  >
                    <Icon className='w-10 h-10 text-white' />
                  </div>
                  <span className='absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary border-2 border-white/20 text-white text-xs font-black flex items-center justify-center shadow-lg'>
                    {s.step}
                  </span>
                </div>
                <h3 className='text-white font-black text-2xl mb-4 tracking-tight'>{s.title}</h3>
                <p className='text-white/50 text-base font-medium leading-relaxed max-w-xs'>
                  {s.desc}
                </p>
                {i < steps.length - 1 && (
                  <ArrowRight className='md:hidden w-8 h-8 text-white/20 mt-8' />
                )}
              </div>
            );
          })}
        </div>

        <div className='text-center mt-20'>
          <Button
            onClick={() => router.push('/register')}
            className='bg-secondary hover:bg-secondary/90 text-white border-0 h-14 px-12 text-lg font-black rounded-full shadow-2xl shadow-secondary/30 hover:scale-105 active:scale-95 transition-all'
          >
            Đăng ký miễn phí ngay
          </Button>
        </div>
      </div>
    </section>
  );
}
