'use client';

import Image from 'next/image';
import {
  CheckCircle2,
  Leaf,
  Zap,
  Headphones,
  Award,
} from 'lucide-react';
import { useRef } from 'react';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id='about'
      ref={sectionRef}
      className='py-12 sm:py-16 bg-background overflow-hidden relative'
    >
      {/* Background decorations */}
      <div className='absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none' />
      <div className='absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -ml-36 -mb-36 pointer-events-none' />

      <div className='max-w-7xl mx-auto px-4'>
        {/* Section Header */}
        <div className='text-center mb-12 sm:mb-16 lg:mb-20'>
          <div className='flex items-center justify-center gap-4 mb-4'>
            <div className='h-px w-16 bg-border' />
            <div className='w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center'>
              <Award className='w-5 h-5 text-primary' />
            </div>
            <div className='h-px w-16 bg-border' />
          </div>
          <p className='text-[11px] uppercase font-semibold tracking-[0.3em] text-primary mb-3'>
            VỀ CHÚNG TÔI
          </p>
          <h1 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading text-foreground leading-[1.15] mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
            Câu chuyện <span className='text-primary'>WAVE</span>
          </h1>
        </div>

        {/* Main Layout: Left Image | Center Content | Right Image+Stats */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
          {/* LEFT - Worker Image */}
          <div className='lg:col-span-3 flex justify-center order-1 lg:order-none'>
            <div className='relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 group w-full max-w-[300px] aspect-[3/5]'>
              <Image
                src='/about-worker.png'
                alt='Nhân viên rửa xe chuyên nghiệp'
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-700'
              />
              {/* Overlay badge */}
              <div className='absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-border/50 whitespace-nowrap'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                  <span className='text-[11px] uppercase tracking-widest text-foreground/70'>
                    Đội ngũ chuyên nghiệp
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER - Content */}
          <div className='lg:col-span-5 flex flex-col gap-6 lg:gap-7 lg:px-4'>
            <div>
              <p className='text-sm font-semibold text-primary uppercase tracking-widest mb-3'>
                Thiết bị hiện đại & Công nghệ tiên tiến
              </p>
              <h3 className='font-heading text-2xl sm:text-3xl lg:text-4xl text-foreground leading-tight tracking-tight mb-5'>
                Rửa xe chuyên nghiệp
              </h3>
              <p className='text-foreground/60 text-base leading-relaxed text-justify'>
                WAVE là nền tảng đặt lịch rửa xe thông minh, kết hợp công nghệ
                hiện đại và đội ngũ kỹ thuật viên được đào tạo bài bản. Chúng
                tôi cam kết mang lại dịch vụ chăm sóc xe chất lượng cao nhất với
                chi phí hợp lý nhất.
              </p>
            </div>

            {/* Feature Pills */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div className='flex items-start gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/10'>
                <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
                  <Leaf className='w-4 h-4 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>
                    Hóa chất thân thiện
                  </p>
                  <p className='text-xs text-foreground/50 leading-relaxed mt-1'>
                    100% hóa chất sinh học, an toàn cho sơn xe
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 bg-secondary/5 rounded-2xl p-4 border border-secondary/10'>
                <div className='w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0'>
                  <Zap className='w-4 h-4 text-secondary' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>
                    Máy móc cao cấp
                  </p>
                  <p className='text-xs text-foreground/50 leading-relaxed mt-1'>
                    Thiết bị nhập khẩu châu Âu, áp lực chuẩn
                  </p>
                </div>
              </div>
            </div>

            {/* Checkmarks */}
            <ul className='flex flex-col gap-3'>
              {[
                'Máy rửa xe chuyên nghiệp nhập khẩu',
                'Cam kết hài lòng 100% hoặc hoàn tiền',
                'Đội ngũ kỹ thuật viên được chứng nhận',
                'Quy trình rửa xe chuẩn quốc tế',
              ].map((item) => (
                <li
                  key={item}
                  className='flex items-center gap-3'
                >
                  <CheckCircle2 className='w-5 h-5 text-primary shrink-0' />
                  <span className='text-sm font-semibold text-foreground/70'>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div>
              <a
                href='#services'
                className='inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-primary/20'
              >
                Xem dịch vụ của chúng tôi
              </a>
            </div>
          </div>

          {/* RIGHT - Car Image + Stats */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            {/* Car image */}
            <div className='relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 group h-[360px] sm:h-[440px] lg:h-[500px]'>
              <Image
                src='/about-car.png'
                alt='Xe sạch sau khi rửa chuyên nghiệp'
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-700'
              />
              <div className='absolute inset-0 bg-linear-to-t from-primary/30 to-transparent' />
            </div>
            <div className='flex items-center gap-4 bg-white rounded-2xl p-4 shadow-xl shadow-primary/5 border border-border/50'>
              <div className='w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20'>
                <Headphones className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-xs uppercase tracking-widest text-primary'>
                  Hỗ trợ 24/7
                </p>
                <p className='text-sm font-bold text-foreground'>
                  Luôn sẵn sàng hỗ lắng nghe bạn
                </p>
                <p className='text-xs text-foreground/50'>Hotline: 1800 1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
