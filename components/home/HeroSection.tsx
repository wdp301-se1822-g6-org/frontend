'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Waves } from 'lucide-react';

import Image from 'next/image';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className='relative flex items-center overflow-hidden bg-background pt-24 pb-16'>
      {/* Sophisticated Background */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,var(--primary)_0.2px,transparent_0.2px)] [background-size:40px_40px] opacity-10' />
        <div className='absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent' />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>

          {/* Left Content */}
          <div className='flex flex-col items-start text-left max-w-xl'>
            <div className='inline-flex items-center gap-2.5 bg-card shadow-sm border border-border px-4 py-1.5 rounded-full mb-5 animate-fade-in-up'>
              <div className='w-2 h-2 bg-primary rounded-full animate-pulse' />
              <span className='text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/50'>
                The Future of Car Care
              </span>
            </div>

            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-[1.15] mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
              Nâng Tầm Trải Nghiệm<br />
              <span className='text-primary'>Chăm Sóc Xe</span>
            </h1>

            <p className='text-muted-foreground text-base mb-7 leading-relaxed animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards'>
              WAVE kết hợp công nghệ hiện đại và dịch vụ tận tâm
              để mang lại vẻ đẹp hoàn mỹ cho chiếc xe của bạn. Quy trình
              chuẩn quốc tế, minh bạch và tiện lợi.
            </p>

            <div className='flex flex-wrap gap-3 w-full animate-fade-in-up [animation-delay:600ms] opacity-0 fill-mode-forwards'>
              <Button
                size='xl'
                onClick={() => router.push('/register')}
                className='rounded-xl shadow-lg shadow-primary/15'
              >
                Đặt lịch ngay
              </Button>
              <Button
                size='xl'
                variant='ghost'
                onClick={() =>
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
                }
                className='text-foreground/70 hover:text-primary group'
              >
                Khám phá dịch vụ
                <Waves className='w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform' />
              </Button>
            </div>

            {/* Subtle Stats */}
            <div className='mt-7 grid grid-cols-3 gap-6 border-t border-border pt-6 w-full animate-fade-in-up [animation-delay:800ms] opacity-0 fill-mode-forwards'>
              {[
                { value: '15K+', label: 'Khách hàng' },
                { value: '60K+', label: 'Lượt dịch vụ' },
                { value: '4.9/5', label: 'Đánh giá' },
              ].map((s) => (
                <div key={s.label}>
                  <div className='text-2xl font-bold text-foreground'>{s.value}</div>
                  <div className='text-[10px] font-semibold text-muted-foreground uppercase mt-1 tracking-widest'>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual - Triple Image Staggered Stack */}
          <div className='relative hidden lg:block h-[480px]'>
            {/* Image 1 - Main (Bottom Right) */}
            <div className='absolute bottom-0 right-0 w-[78%] aspect-square rounded-[2.5rem] overflow-hidden border-[6px] border-card shadow-xl z-10 animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards'>
              <Image src='/h1.jpg' alt='WAVE 1' fill priority sizes='(max-width: 1024px) 100vw, 80vw' className='object-cover hover:scale-110 transition-transform duration-1000' />
            </div>

            {/* Image 2 - Top Left Overlay */}
            <div className='absolute top-6 left-0 w-[52%] aspect-square rounded-[2rem] overflow-hidden border-[5px] border-card shadow-xl z-20 animate-fade-in-up [animation-delay:600ms] opacity-0 fill-mode-forwards rotate-[-6deg] hover:rotate-0 transition-transform duration-500'>
              <Image src='/h4.jpg' alt='WAVE 2' fill priority sizes='(max-width: 1024px) 100vw, 55vw' className='object-cover' />
            </div>

            {/* Image 3 - Small Accent (Bottom Left) */}
            <div className='absolute bottom-8 left-16 w-[38%] aspect-[4/3] rounded-2xl overflow-hidden border-[5px] border-card shadow-xl z-30 animate-fade-in-up [animation-delay:800ms] opacity-0 fill-mode-forwards rotate-[10deg] hover:rotate-0 transition-transform duration-500'>
              <Image src='/h7.jpg' alt='WAVE 3' fill priority sizes='(max-width: 1024px) 100vw, 40vw' className='object-cover' />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
