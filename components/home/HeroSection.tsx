'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Crown, Waves } from 'lucide-react';

import Image from 'next/image';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className='relative min-h-[85vh] flex items-center overflow-hidden bg-background pt-24 pb-12'>
      {/* Sophisticated Background */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,var(--primary)_0.2px,transparent_0.2px)] [background-size:40px_40px] opacity-10' />
        <div className='absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent' />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
        <div className='grid lg:grid-cols-2 gap-16 items-center'>

          {/* Left Content */}
          <div className='flex flex-col items-start text-left max-w-xl'>
            <div className='inline-flex items-center gap-3 bg-white shadow-sm border border-border px-5 py-2 rounded-full mb-10 animate-fade-in-up'>
              <div className='w-2 h-2 bg-primary rounded-full animate-pulse' />
              <span className='text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40'>
                The Future of Car Care
              </span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] mb-8 tracking-tighter animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
              Nâng Tầm Trải Nghiệm<br />
              <span className='text-primary'>Chăm Sóc Xe</span>
            </h1>

            <p className='text-foreground/50 text-lg mb-12 leading-relaxed font-medium animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards'>
              WAVE kết hợp công nghệ hiện đại và dịch vụ tận tâm
              để mang lại vẻ đẹp hoàn mỹ cho chiếc xe của bạn. Quy trình
              chuẩn quốc tế, minh bạch và tiện lợi.
            </p>

            <div className='flex flex-wrap gap-4 w-full animate-fade-in-up [animation-delay:600ms] opacity-0 fill-mode-forwards'>
              <Button
                onClick={() => router.push('/register')}
                className='bg-primary hover:bg-primary/90 text-white h-14 px-10 text-lg font-black rounded-2xl shadow-xl shadow-primary/10 transition-all'
              >
                Đặt lịch ngay
              </Button>
              <Button
                variant='ghost'
                onClick={() =>
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
                }
                className='h-14 px-8 text-lg font-black text-foreground/60 hover:text-primary transition-colors group'
              >
                Khám phá dịch vụ
                <Waves className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
              </Button>
            </div>

            {/* Subtle Stats */}
            <div className='mt-8 grid grid-cols-3 gap-8 border-t border-border pt-10 w-full animate-fade-in-up [animation-delay:800ms] opacity-0 fill-mode-forwards'>
              {[
                { value: '15K+', label: 'Clients' },
                { value: '60K+', label: 'Services' },
                { value: '4.9/5', label: 'Rating' },
              ].map((s) => (
                <div key={s.label}>
                  <div className='text-2xl font-black text-foreground'>{s.value}</div>
                  <div className='text-[10px] font-black text-foreground/30 uppercase mt-1 tracking-widest'>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual - Triple Image Staggered Stack */}
          <div className='relative hidden lg:block h-[600px]'>
            {/* Image 1 - Main (Bottom Right) */}
            <div className='absolute bottom-0 right-0 w-[80%] aspect-square rounded-[3rem] overflow-hidden border-[8px] border-white shadow-2xl z-10 animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards'>
              <Image src='/h1.jpg' alt='WAVE 1' fill priority sizes='(max-width: 1024px) 100vw, 80vw' className='object-cover hover:scale-110 transition-transform duration-1000' />
            </div>

            {/* Image 2 - Top Left Overlay */}
            <div className='absolute top-10 left-0 w-[55%] aspect-square rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl z-20 animate-fade-in-up [animation-delay:600ms] opacity-0 fill-mode-forwards rotate-[-6deg] hover:rotate-0 transition-transform duration-500'>
              <Image src='/h4.jpg' alt='WAVE 2' fill priority sizes='(max-width: 1024px) 100vw, 55vw' className='object-cover' />
            </div>

            {/* Image 3 - Small Accent (Bottom Left) */}
            <div className='absolute bottom-10 left-20 w-[40%] aspect-[4/3] rounded-3xl overflow-hidden border-[6px] border-white shadow-2xl z-30 animate-fade-in-up [animation-delay:800ms] opacity-0 fill-mode-forwards rotate-[10deg] hover:rotate-0 transition-transform duration-500'>
              <Image src='/h7.jpg' alt='WAVE 3' fill priority sizes='(max-width: 1024px) 100vw, 40vw' className='object-cover' />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
