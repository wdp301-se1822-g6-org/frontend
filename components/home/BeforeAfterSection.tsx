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
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
  }, [updateSlider]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  }, [updateSlider]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    updateSlider(e.touches[0].clientX);
  }, [updateSlider]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    updateSlider(e.touches[0].clientX);
  }, [updateSlider]);

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
      className='py-16 bg-foreground relative overflow-hidden'
    >
      {/* Background blobs */}
      <div className='absolute top-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -ml-40 -mt-40 pointer-events-none' />
      <div className='absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl -mr-40 -mb-40 pointer-events-none' />

      <div className='max-w-7xl mx-auto px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>

          {/* LEFT — Draggable Before/After Slider */}
          <div className='order-2 lg:order-1'>
            {/* Labels above */}
            <div className='flex justify-between mb-3 px-1'>
              <span className='text-xs font-black uppercase tracking-[0.2em] text-white/40'>
                Trước khi rửa
              </span>
              <span className='text-xs font-black uppercase tracking-[0.2em] text-primary'>
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
                <div className='absolute top-4 right-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg'>
                  SAU
                </div>
              </div>

              {/* BEFORE image (clipped to left portion) */}
              <div
                className='absolute inset-0 overflow-hidden'
                style={{ width: `${sliderPos}%` }}
              >
                <div className='relative w-full h-full' style={{ width: `${(100 / sliderPos) * 100}%` }}>
                  <Image
                    src='/car-before.png'
                    alt='Xe trước khi rửa'
                    fill
                    className='object-cover'
                    draggable={false}
                  />
                </div>
                {/* Before label badge */}
                <div className='absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-white/20'>
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
            <p className='text-center text-white/30 text-xs font-semibold mt-4 tracking-wider'>
              ← Kéo để so sánh →
            </p>
          </div>

          {/* RIGHT — Content */}
          <div className='order-1 lg:order-2 flex flex-col gap-7'>
            {/* Label */}
            <div className='flex items-center gap-3'>
              <div className='w-8 h-0.5 bg-primary' />
              <span className='text-primary text-xs font-black uppercase tracking-[0.25em]'>
                Vệ sinh & Rửa xe
              </span>
            </div>

            {/* Heading */}
            <div>
              <h2 className='text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight'>
                Làm sạch nội thất{' '}
                <span className='text-primary'>toàn diện</span>{' '}
                — Kết quả thấy ngay
              </h2>
            </div>

            {/* Description */}
            <p className='text-white/50 text-base leading-relaxed'>
              WAVE áp dụng quy trình vệ sinh xe chuyên sâu với hóa chất
              sinh học cao cấp, thiết bị hút bụi công suất lớn và kỹ thuật
              viên được đào tạo bài bản. Nội thất xe của bạn sẽ như mới
              hoàn toàn sau mỗi lần chăm sóc.
            </p>

            {/* Feature list */}
            <ul className='flex flex-col gap-4'>
              {[
                { text: 'Vệ sinh ghế da & ghế vải chuyên nghiệp', highlight: false },
                { text: 'Hút bụi toàn bộ thảm sàn & khe hốc', highlight: false },
                { text: 'Khử mùi và diệt khuẩn 99.9% bằng UV', highlight: true },
                { text: 'Đánh bóng tableau & làm sạch kính', highlight: false },
              ].map(({ text, highlight }) => (
                <li key={text} className='flex items-start gap-3'>
                  <CheckCircle2
                    className={`w-5 h-5 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-white/40'}`}
                  />
                  <span className={`text-sm font-semibold leading-relaxed ${highlight ? 'text-white' : 'text-white/60'}`}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Stats row */}
            <div className='flex gap-8 pt-2'>
              <div>
                <p className='text-3xl font-black text-white'>500<span className='text-primary'>+</span></p>
                <p className='text-xs font-bold text-white/40 uppercase tracking-widest mt-1'>Xe đã phục vụ</p>
              </div>
              <div className='w-px bg-white/10' />
              <div>
                <p className='text-3xl font-black text-white'>100<span className='text-primary'>%</span></p>
                <p className='text-xs font-bold text-white/40 uppercase tracking-widest mt-1'>Khách hài lòng</p>
              </div>
              <div className='w-px bg-white/10' />
              <div>
                <p className='text-3xl font-black text-white'>60<span className='text-primary'>p</span></p>
                <p className='text-xs font-bold text-white/40 uppercase tracking-widest mt-1'>Hoàn thành</p>
              </div>
            </div>

            {/* CTA */}
            <div className='flex items-center gap-4 pt-2'>
              <a
                href='#services'
                className='inline-flex items-center gap-3 bg-primary text-white font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-primary/30'
              >
                <Sparkles className='w-4 h-4' />
                Đặt lịch ngay
              </a>
              <div className='h-px flex-1 bg-white/10' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
