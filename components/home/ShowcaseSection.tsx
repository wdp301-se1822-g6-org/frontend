'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';

const images = [
  { src: '/h1.jpg', size: 'lg', title: 'Perfect Shine' },
  { src: '/h2.jpg', size: 'sm', title: 'Deep Cleaning' },
  { src: '/h3.jpg', size: 'sm', title: 'Interior Detail' },
  { src: '/h4.jpg', size: 'md', title: 'Premium Foam' },
  { src: '/h5.jpg', size: 'md', title: 'Luxury Care' },
  { src: '/h6.jpg', size: 'sm', title: 'Engine Clean' },
  { src: '/h7.jpg', size: 'lg', title: 'Final Touch' },
];

export function ShowcaseSection() {
  return (
    <section className='py-32 bg-background px-4 relative overflow-hidden reveal-on-scroll'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-[0.2em]'>
            <Camera className='w-4 h-4' />
            Visual Excellence
          </div>
          <h2 className='text-5xl font-black text-foreground mb-6 tracking-tight'>
            Nghệ Thuật <span className='text-primary'>Chăm Sóc Xe</span>
          </h2>
          <p className='text-foreground/50 max-w-2xl mx-auto text-lg font-medium leading-relaxed'>
            Từng chi tiết nhỏ nhất đều được WAVE chăm chút tỉ mỉ để mang lại 
            vẻ đẹp nguyên bản và đẳng cấp cho xế yêu của bạn.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px] md:h-[800px]'>
          {/* Image 2 */}
          <div className='relative group overflow-hidden rounded-[2.5rem] shadow-2xl'>
            <Image src='/h2.jpg' alt='Showcase' fill sizes='(max-width: 768px) 100vw, 50vw' className='object-cover transition-transform duration-700 group-hover:scale-110' />
            <div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10'>
              <span className='text-white font-black text-3xl tracking-tighter'>Deep Cleaning</span>
            </div>
          </div>

          {/* Image 3 */}
          <div className='relative group overflow-hidden rounded-[2.5rem] shadow-2xl'>
            <Image src='/h3.jpg' alt='Showcase' fill sizes='(max-width: 768px) 100vw, 50vw' className='object-cover transition-transform duration-700 group-hover:scale-110' />
            <div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10'>
              <span className='text-white font-black text-3xl tracking-tighter'>Interior Perfection</span>
            </div>
          </div>

          {/* Image 5 */}
          <div className='relative group overflow-hidden rounded-[2.5rem] shadow-2xl'>
            <Image src='/h5.jpg' alt='Showcase' fill sizes='(max-width: 768px) 100vw, 50vw' className='object-cover transition-transform duration-700 group-hover:scale-110' />
          </div>

          {/* Image 6 */}
          <div className='relative group overflow-hidden rounded-[2.5rem] shadow-2xl'>
            <Image src='/h6.jpg' alt='Showcase' fill sizes='(max-width: 768px) 100vw, 50vw' className='object-cover transition-transform duration-700 group-hover:scale-110' />
          </div>
        </div>
      </div>
    </section>
  );
}
