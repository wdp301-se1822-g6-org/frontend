'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronsLeftRight, Sparkles, CheckCircle2 } from 'lucide-react';

export function BeforeAfterSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      updateSlider(e.clientX);
    },
    [updateSlider],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      updateSlider(e.clientX);
    },
    [updateSlider],
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider],
  );

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  return (
    <section
      id='before-after'
      className='py-12 sm:py-16 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--primary)/8_0%,transparent_55%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--primary)_6%,var(--background))_100%)]'
    >
      {/* Background blobs */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-32 -left-24 w-md h-112 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute -bottom-32 -right-24 w-md h-112 rounded-full bg-fuchsia-400/20 blur-3xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.07]' />
      </div>
      {/* Top & bottom accent lines */}
      <div className='absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/30 to-transparent' />
      <div className='absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-fuchsia-400/30 to-transparent' />

      <div className='max-w-7xl mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center'>
          {/* LEFT — Draggable Before/After Slider */}
          <div className='order-2 lg:order-1'>
            {/* Labels above */}
            <div className='flex justify-between mb-3 px-1'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                Trước khi rửa
              </span>
              <span className='text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
                Sau khi rửa
              </span>
            </div>

            {/* Slider container */}
            <div
              ref={containerRef}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              className='relative w-full rounded-[2rem] overflow-hidden cursor-col-resize select-none shadow-2xl'
              style={{ aspectRatio: '4/3' }}
            >
              {/* AFTER image (full) */}
              <div className='absolute inset-0'>
                <Image
                  src='/car-after.png'
                  alt='Xe sau khi rửa sạch'
                  fill
                  className='object-cover'
                  draggable={false}
                />
                {/* After label badge */}
                <div className='absolute top-4 right-4 bg-primary text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg'>
                  SAU
                </div>
              </div>

              {/* BEFORE image (clipped to left portion) */}
              <div
                className='absolute inset-0 overflow-hidden'
                style={{ width: `${sliderPos}%` }}
              >
                <div
                  className='relative w-full h-full'
                  style={{ width: `${(100 / sliderPos) * 100}%` }}
                >
                  <Image
                    src='/car-before.png'
                    alt='Xe trước khi rửa'
                    fill
                    className='object-cover'
                    draggable={false}
                  />
                </div>
                {/* Before label badge */}
                <div className='absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-white/20'>
                  TRƯỚC
                </div>
              </div>

              {/* Divider line */}
              <div
                className='absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                style={{ left: `${sliderPos}%` }}
              />

              {/* Drag handle */}
              <div
                className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10'
                style={{ left: `${sliderPos}%` }}
              >
                <div className='w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white ring-2 ring-primary/30 hover:scale-110 transition-transform'>
                  <ChevronsLeftRight className='w-5 h-5 text-primary' />
                </div>
              </div>
            </div>

            {/* Drag hint */}
            <p className='text-center text-muted-foreground text-xs font-semibold mt-4 tracking-wider'>
              ← Kéo để so sánh →
            </p>
          </div>

          {/* RIGHT — Content */}
          <div className='order-1 lg:order-2 flex flex-col gap-5 sm:gap-7'>
            {/* Label */}
            <div className='flex items-center gap-3'>
              <span className='text-primary text-xs font-semibold uppercase tracking-[0.25em]'>
                Vệ sinh & Rửa xe
              </span>
            </div>

            {/* Heading */}
            <div>
              <h2 className='font-heading text-[1.75rem] sm:text-4xl lg:text-5xl text-foreground leading-tight tracking-tight'>
                Làm sạch nội thất{' '}
                <span className='bg-linear-to-r from-primary via-purple-500 to-fuchsia-500 bg-clip-text text-transparent'>
                  toàn diện
                </span>
              </h2>
            </div>

            {/* Description */}
            <p className='text-muted-foreground text-base leading-relaxed'>
              WAVE áp dụng quy trình vệ sinh xe chuyên sâu với hóa chất sinh học
              cao cấp, thiết bị hút bụi công suất lớn và kỹ thuật viên được đào
              tạo bài bản. Nội thất xe của bạn sẽ như mới hoàn toàn sau mỗi lần
              chăm sóc.
            </p>

            {/* Feature list */}
            <ul className='flex flex-col gap-4'>
              {[
                {
                  text: 'Vệ sinh ghế da & ghế vải chuyên nghiệp',
                  highlight: false,
                },
                {
                  text: 'Hút bụi toàn bộ thảm sàn & khe hốc',
                  highlight: false,
                },
                {
                  text: 'Khử mùi và diệt khuẩn 99.9% bằng UV',
                  highlight: true,
                },
                { text: 'Đánh bóng tableau & làm sạch kính', highlight: false },
              ].map(({ text, highlight }) => (
                <li
                  key={text}
                  className='flex items-start gap-3'
                >
                  <CheckCircle2
                    className={`w-5 h-5 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-semibold leading-relaxed ${highlight ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className='flex items-center gap-4 pt-2'>
              <a
                href='#services'
                className='inline-flex items-center gap-3 bg-primary text-white font-semibold px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-primary/30'
              >
                <Sparkles className='w-4 h-4' />
                Đặt lịch ngay
              </a>
              <div className='h-px flex-1 bg-primary/15' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
