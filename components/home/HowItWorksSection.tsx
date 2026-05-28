'use client';

import { useRouter } from 'next/navigation';
import {
  UserPlus,
  CalendarCheck,
  Star,
  Rocket,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Tạo tài khoản',
    desc: 'Đăng ký miễn phí chỉ trong 1 phút. Thêm thông tin xe và bắt đầu hành trình thành viên của bạn.',
    badge: 'from-cyan-400 to-cyan-500',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Đặt lịch rửa xe',
    desc: 'Chọn ngày, giờ và gói dịch vụ phù hợp. Hạng thành viên cao hơn cho phép đặt lịch sớm hơn.',
    badge: 'from-blue-400 to-indigo-500',
  },
  {
    step: '03',
    icon: Star,
    title: 'Tích điểm & nâng hạng',
    desc: 'Mỗi lần rửa xe tích lũy điểm. Đổi điểm lấy ưu đãi và tự động nâng hạng thành viên.',
    badge: 'from-purple-400 to-fuchsia-500',
  },
];

export function HowItWorksSection() {
  const router = useRouter();

  return (
    <section className='relative overflow-hidden py-10 sm:py-14 px-4 reveal-on-scroll bg-[radial-gradient(ellipse_at_top,var(--primary)/8_0%,transparent_55%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--primary)_6%,var(--background))_100%)]'>
      {/* Decorative background waves */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-32 -left-24 w-md h-112 rounded-full bg-primary/25 blur-3xl' />
        <div className='absolute -bottom-32 -right-24 w-md h-112 rounded-full bg-fuchsia-400/25 blur-3xl' />
        <div className='absolute top-1/3 left-1/2 -translate-x-1/2 w-88 h-88 rounded-full bg-purple-300/20 blur-3xl' />
        {/* Dot grid */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.07]' />
      </div>
      {/* Top & bottom accent lines */}
      <div className='absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/30 to-transparent' />
      <div className='absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-fuchsia-400/30 to-transparent' />

      <div className='max-w-5xl mx-auto relative z-10'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full mb-5 uppercase tracking-[0.2em]'>
            Bắt đầu dễ dàng
          </div>
          <h1 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading text-foreground leading-[1.15] mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
            Chỉ 3 bước để{' '}
            <span className='bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500 bg-clip-text text-transparent'>
              bắt đầu
            </span>
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto text-sm font-medium leading-relaxed'>
            Tham gia cùng hàng nghìn khách hàng đang tận hưởng trải nghiệm rửa
            xe thông minh mỗi ngày với quy trình tối giản.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 relative items-start'>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className='relative flex flex-col items-center text-center group'
              >
                {/* Dotted connector to next step (desktop) */}
                {i < steps.length - 1 && (
                  <div className='hidden md:flex absolute top-10 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] items-center justify-center gap-2'>
                    <span className='flex-1 border-t-2 border-dashed border-primary/25' />
                    <span className='w-1.5 h-1.5 rounded-full bg-primary/50' />
                    <span className='flex-1 border-t-2 border-dashed border-primary/25' />
                  </div>
                )}

                <div className='relative mb-5'>
                  {/* Glow halo */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-linear-to-br ${s.badge} opacity-30 blur-2xl scale-110 group-hover:opacity-50 transition-opacity`}
                  />
                  {/* Glassmorphic icon card */}
                  <div
                    className={`relative w-20 h-20 rounded-2xl bg-linear-to-br ${s.badge} flex items-center justify-center shadow-[0_12px_30px_-6px_color-mix(in_oklab,var(--primary)_45%,transparent)] ring-1 ring-white/40 transition-all group-hover:-translate-y-1 group-hover:scale-[1.05]`}
                  >
                    <Icon
                      className='w-9 h-9 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]'
                      strokeWidth={1.85}
                    />
                  </div>
                  {/* Numbered badge */}
                  <span className='absolute -top-2 -right-2 w-9 h-9 rounded-full bg-background text-foreground text-xs font-black flex items-center justify-center shadow-md ring-2 ring-primary/30'>
                    {s.step}
                  </span>
                </div>
                <h3 className='font-heading text-foreground font-black text-lg mb-2 tracking-tight'>
                  {s.title}
                </h3>
                <p className='text-muted-foreground text-sm font-medium leading-relaxed max-w-xs'>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className='text-center mt-12 flex flex-col items-center gap-3'>
          <button
            onClick={() => router.push('/register')}
            className='group relative inline-flex items-center gap-2.5 px-7 h-12 rounded-full text-white text-sm font-semibold bg-linear-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.7)] hover:shadow-[0_15px_40px_-10px_rgba(168,85,247,0.9)] hover:scale-[1.02] active:scale-95 transition-all'
          >
            <Rocket className='w-4 h-4' />
            <span>Đăng ký miễn phí ngay</span>
            <ChevronRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
          </button>
          <div className='inline-flex items-center gap-2 text-muted-foreground text-xs font-medium'>
            <ShieldCheck className='w-3.5 h-3.5' />
            <span>Miễn phí 100% • Không cần thẻ tín dụng</span>
          </div>
        </div>
      </div>
    </section>
  );
}
