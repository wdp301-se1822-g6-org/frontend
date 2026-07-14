import Image from 'next/image';
import { CalendarCheck, Gauge, Gift } from 'lucide-react';

const points = [
  { icon: CalendarCheck, text: 'Đặt lịch rửa xe chỉ trong 30 giây' },
  { icon: Gauge, text: 'Theo dõi tiến độ rửa xe theo thời gian thực' },
  { icon: Gift, text: 'Tích điểm và nhận ưu đãi cho mỗi lần rửa' },
];

/**
 * Panel thương hiệu bên trái của màn hình xác thực (split-screen).
 * Thuần trình bày — ẩn trên mobile, hiện từ breakpoint lg.
 */
export function AuthBrandPanel() {
  return (
    <aside className='relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between'>
      {/* Lớp nền tạo chiều sâu: ảnh mờ + gradient brand + hoa văn chấm */}
      <div className='absolute inset-0 opacity-15'>
        <Image
          src='/h4.jpg'
          alt=''
          fill
          sizes='(max-width: 1024px) 0vw, 40vw'
          className='object-cover'
        />
      </div>
      <div className='absolute inset-0 bg-linear-to-br from-primary via-primary to-primary/80' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white_0.5px,transparent_0.5px)] [background-size:22px_22px] opacity-10' />

      {/* Logo */}
      <div className='relative z-10 flex items-center gap-2.5'>
        <div className='flex size-9 items-center justify-center rounded-xl bg-white/15 font-heading text-lg font-bold'>
          W
        </div>
        <span className='font-heading text-xl font-bold tracking-tight'>
          WAVE
        </span>
      </div>

      {/* Thông điệp giá trị */}
      <div className='relative z-10 space-y-6'>
        <h2 className='font-heading text-3xl font-bold leading-tight tracking-tight text-balance'>
          Chăm sóc xe của bạn, gọn gàng trong một ứng dụng
        </h2>
        <ul className='space-y-3.5'>
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className='flex items-center gap-3'>
              <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15'>
                <Icon className='size-4' />
              </span>
              <span className='text-sm font-medium text-primary-foreground/90'>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Số liệu tin cậy */}
      <div className='relative z-10 flex items-center gap-8 border-t border-white/15 pt-6'>
        <div>
          <p className='font-heading text-2xl font-bold tabular-nums'>15K+</p>
          <p className='text-xs text-primary-foreground/70'>
            Khách hàng tin dùng
          </p>
        </div>
        <div>
          <p className='font-heading text-2xl font-bold tabular-nums'>4.9/5</p>
          <p className='text-xs text-primary-foreground/70'>Điểm hài lòng</p>
        </div>
      </div>
    </aside>
  );
}
