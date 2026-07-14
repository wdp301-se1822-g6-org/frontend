'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ChevronDown, Calendar } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const { authUser } = useAuthStore();

  const handleBooking = () => {
    router.push(authUser?.role === 'customer' ? '/booking' : '/register');
  };

  return (
    <section className='w-full bg-[#0A1628] text-white pt-24 pb-12 overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        
        {/* Centered Heading & CTA */}
        <div className='flex flex-col items-center text-center gap-6 max-w-3xl mx-auto mb-10'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight'>
            Xe sạch từng góc nhỏ —{' '}
            <span className='text-sky-400 block sm:inline'>Chỉ mất vài phút.</span>
          </h1>
          <p className='text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed'>
            Dịch vụ rửa xe chuyên nghiệp tiêu chuẩn cao cấp. Đặt lịch nhanh, nhận xe đúng giờ, bảo đảm chất lượng.
          </p>
          
          <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
            <button
              onClick={handleBooking}
              className='inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-sky-500/25 transition-all text-sm cursor-pointer'
            >
              <Calendar className='w-4 h-4' />
              Đặt lịch ngay
            </button>
            <button
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className='inline-flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all cursor-pointer'
            >
              Tìm hiểu thêm
              <ChevronDown className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Centered Image Frame aligned with Navbar container */}
        <div className='relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900'>
          <div className='relative aspect-[16/8] w-full'>
            <Image
              src='/hero-maserati.png'
              alt='Maserati Detailing'
              fill
              priority
              sizes='(max-width: 1280px) 100vw, 1280px'
              className='object-cover object-center'
            />
            {/* Soft gradient shadow on image */}
            <div className='absolute inset-0 bg-gradient-to-t from-[#0A1628]/40 via-transparent to-transparent' />
          </div>
        </div>

      </div>
    </section>
  );
}
