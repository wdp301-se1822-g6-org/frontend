'use client';

import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const testimonials = [
  {
    name: 'Nguyễn Văn Minh',
    time: '2 ngày trước',
    title: 'Rửa xe sạch & Bóng đẹp',
    rating: 5,
    text: 'Dịch vụ tuyệt vời! Xe mình sau khi rửa sạch bóng, lớp phủ nano giữ được rất lâu. Nhân viên thân thiện và chuyên nghiệp. Sẽ quay lại thường xuyên.',
    avatar: 'M',
    color: 'bg-cyan-500',
    imgSrc: null,
  },
  {
    name: 'Trần Thị Lan',
    time: '1 tuần trước',
    title: 'Dịch vụ thực sự tốt',
    rating: 5,
    text: 'Mình đăng ký gói Kim Cương và rất hài lòng. Đặt lịch qua app dễ dàng, không phải chờ đợi. Xe sạch đẹp như mới, đáng đồng tiền bát gạo.',
    avatar: 'L',
    color: 'bg-purple-500',
    imgSrc: null,
  },
  {
    name: 'Lê Hoàng Phúc',
    time: '2 tuần trước',
    title: 'Chất lượng không đổi',
    rating: 5,
    text: 'Tốc độ rửa nhanh mà chất lượng không thua kém gì. Công nghệ hiện đại, không lo trầy xước. Gói thành viên tiết kiệm hơn nhiều so với rửa xe thông thường.',
    avatar: 'P',
    color: 'bg-emerald-500',
    imgSrc: null,
  },
  {
    name: 'Phạm Bảo Châu',
    time: '3 tuần trước',
    title: 'Rất đáng để giới thiệu',
    rating: 5,
    text: 'Cơ sở sạch sẽ, thoáng mát. Khu vực chờ có wifi, nước uống miễn phí. Dịch vụ chuyên nghiệp từ A đến Z, rất đáng để giới thiệu cho mọi người.',
    avatar: 'C',
    color: 'bg-rose-500',
    imgSrc: null,
  },
];

function StarRow({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className='flex gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/20 fill-foreground/10'}`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setActive(idx);
        setAnimating(false);
      }, 300);
    },
    [animating],
  );

  const prev = () =>
    goTo((active - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((active + 1) % testimonials.length);

  // Auto-play
  useEffect(() => {
    const t = setInterval(() => {
      goTo((active + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(t);
  }, [active, goTo]);

  // Show 2 cards: active + next
  const visible = [active, (active + 1) % testimonials.length];

  return (
    <section
      id='testimonials'
      className='py-12 sm:py-16 bg-background relative overflow-hidden'
    >
      {/* Watermark text */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none select-none'>
        <span className='text-[clamp(4rem,15vw,12rem)] font-black text-foreground/[0.03] tracking-widest uppercase'>
          REVIEW
        </span>
      </div>

      {/* Dashed header line */}
      <div className='flex items-center justify-center gap-4 mb-12'>
        <div className='h-px flex-1 max-w-[180px] border-t border-dashed border-border' />
        <div className='w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center'>
          <Star className='w-4 h-4 text-primary fill-primary' />
        </div>
        <div className='h-px flex-1 max-w-[180px] border-t border-dashed border-border' />
      </div>

      <div className='max-w-7xl mx-auto px-4 relative z-10'>
        {/* Heading */}
        <div className='text-center mb-10 sm:mb-16'>
          <p className='text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-3'>
            Đánh giá từ khách hàng
          </p>
          <h1 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading text-foreground leading-[1.15] mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
            Khách hàng nói gì về <span className='text-primary'>WAVE</span>?
          </h1>
          <p className='text-foreground/50 max-w-xl mx-auto text-base font-medium leading-relaxed'>
            Hàng nghìn chủ xe sang đã tin tưởng và hài lòng với chất lượng phục
            vụ 5 sao của chúng tôi.
          </p>
        </div>

        {/* Cards carousel */}
        <div className='relative'>
          <div
            className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 transition-opacity duration-300'
            style={{ opacity: animating ? 0 : 1 }}
          >
            {visible.map((idx) => {
              const t = testimonials[idx];
              return (
                <div
                  key={`${idx}-${t.name}`}
                  className='bg-card rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 shadow-lg shadow-primary/5 border border-border/60 hover:-translate-y-1 transition-all duration-300 flex gap-4 sm:gap-5'
                >
                  {/* Avatar */}
                  <div className='shrink-0'>
                    <div
                      className={`w-14 h-14 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                    >
                      {t.avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className='flex flex-col gap-3 flex-1'>
                    {/* Name + time */}
                    <div>
                      <p className='font-bold text-foreground text-base tracking-tight'>
                        {t.name}
                      </p>
                      <p className='text-muted-foreground text-xs font-medium'>
                        {t.time}
                      </p>
                    </div>

                    {/* Stars */}
                    <StarRow
                      rating={t.rating}
                      size='sm'
                    />

                    {/* Title */}
                    <p className='font-semibold text-foreground text-sm'>
                      {t.title}
                    </p>

                    {/* Review text */}
                    <p className='text-muted-foreground text-sm leading-relaxed italic relative'>
                      <Quote className='inline w-4 h-4 text-primary/30 mr-1 -mt-1' />
                      {t.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          <div className='flex items-center justify-center gap-6 mt-10'>
            <button
              onClick={prev}
              className='w-11 h-11 rounded-full border-2 border-border hover:border-primary hover:bg-primary hover:text-white text-foreground/50 flex items-center justify-center transition-all duration-200'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>

            {/* Dots */}
            <div className='flex gap-2'>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === active
                      ? 'w-7 h-2.5 bg-primary'
                      : 'w-2.5 h-2.5 bg-border hover:bg-primary/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className='w-11 h-11 rounded-full border-2 border-border hover:border-primary hover:bg-primary hover:text-white text-foreground/50 flex items-center justify-center transition-all duration-200'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Overall rating summary bar */}
        <div className='mt-12 sm:mt-16 flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10 bg-linear-to-br from-primary/8 via-primary/5 to-transparent border border-primary/15 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 lg:px-16 shadow-sm relative overflow-hidden'>
          <div className='absolute -top-24 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute -bottom-24 -left-16 w-72 h-72 bg-primary/[0.07] rounded-full blur-3xl pointer-events-none' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.06] pointer-events-none' />

          {/* Score */}
          <div className='flex items-center gap-5 relative z-10'>
            <span className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-primary'>
              4.9
            </span>
            <div>
              <StarRow
                rating={5}
                size='lg'
              />
              <span className='text-muted-foreground text-xs font-semibold uppercase tracking-wider mt-1 block'>
                Đánh giá trung bình
              </span>
            </div>
          </div>

          <div className='w-px h-16 bg-primary/15 hidden lg:block relative z-10' />

          {/* Description */}
          <p className='text-muted-foreground text-sm font-medium max-w-xs relative z-10 leading-relaxed'>
            Dựa trên hơn 10,000 lượt đánh giá thực tế từ khách hàng thân thiết.
          </p>

          <div className='flex gap-8 sm:gap-12 lg:ml-auto relative z-10'>
            <div className='text-center'>
              <p className='text-3xl sm:text-4xl font-bold text-foreground tabular-nums'>
                10K+
              </p>
              <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-1'>
                Đánh giá 5 sao
              </p>
            </div>
            <div className='text-center'>
              <p className='text-3xl sm:text-4xl font-bold text-foreground tabular-nums'>
                50K+
              </p>
              <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-1'>
                Xe đã phục vụ
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
