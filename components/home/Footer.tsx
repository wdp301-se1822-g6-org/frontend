import Image from 'next/image';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

const socialIcons = [
  {
    label: 'Facebook',
    href: '#',
    svg: (
      <svg
        viewBox='0 0 24 24'
        fill='currentColor'
        className='w-4 h-4'
      >
        <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    svg: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='w-4 h-4'
      >
        <rect
          width='20'
          height='20'
          x='2'
          y='2'
          rx='5'
          ry='5'
        />
        <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
        <line
          x1='17.5'
          x2='17.51'
          y1='6.5'
          y2='6.5'
        />
      </svg>
    ),
  },
  {
    label: 'Youtube',
    href: '#',
    svg: (
      <svg
        viewBox='0 0 24 24'
        fill='currentColor'
        className='w-4 h-4'
      >
        <path d='M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z' />
        <polygon
          fill='#06111F'
          points='9.75 15.02 15.5 12 9.75 8.98 9.75 15.02'
        />
      </svg>
    ),
  },
];

const footerLinks = {
  services: [
    { label: 'Đặt lịch rửa xe', href: '/booking' },
    { label: 'Bảng giá dịch vụ', href: '/#services-pricing' },
    { label: 'Hạng thành viên', href: '/#loyalty' },
    { label: 'Tính năng', href: '/#features' },
  ],
  support: [
    { label: 'Đăng nhập', href: '/login' },
    { label: 'Tạo tài khoản', href: '/register' },
    { label: 'Liên hệ', href: '/#contact' },
  ],
};

export function Footer() {
  return (
    <footer className='bg-background text-foreground px-4 border-t border-border'>
      <div className='max-w-7xl mx-auto'>
        {/* Main footer */}
        <div className='py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10'>
          {/* Brand */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-3 mb-6'>
              <Image
                src='/logo-wave.jpg'
                alt='WAVE'
                width={40}
                height={40}
                className='rounded-full object-cover border border-border shadow-sm'
              />
              <span className='font-heading font-black text-2xl tracking-tight text-foreground'>
                WAVE
              </span>
            </div>
            <p className='mb-6 text-[14px] leading-relaxed text-foreground/65'>
              Nền tảng đặt lịch và theo dõi quy trình rửa xe, giúp khách hàng chủ
              động thời gian và cửa hàng quản lý dịch vụ hiệu quả hơn.
            </p>
            <div className='flex gap-4'>
              {socialIcons.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className='w-10 h-10 rounded-xl bg-accent/30 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-sm'
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className='mb-4 font-heading text-[15px] font-semibold text-foreground'>Dịch vụ</h4>
            <ul className='space-y-2.5'>
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='text-[14px] text-foreground/65 transition-colors hover:text-primary'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='mb-4 font-heading text-[15px] font-semibold text-foreground'>Hỗ trợ</h4>
            <ul className='space-y-2.5'>
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='text-[14px] text-foreground/65 transition-colors hover:text-primary'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className='mb-4 font-heading text-[15px] font-semibold text-foreground'>Liên hệ</h4>
            <ul className='space-y-3'>
              <li className='flex items-start gap-3 text-[14px] text-foreground/70'>
                <MapPin className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                123 Đường Lê Văn Việt, Quận 9, TP.HCM
              </li>
              <li className='flex items-center gap-3 text-[14px] text-foreground/70'>
                <Clock className='w-5 h-5 text-primary shrink-0' />
                07:00 – 21:00 (Thứ 2 – Chủ nhật)
              </li>
              <li className='flex items-center gap-3 text-[14px] text-foreground/70'>
                <Phone className='w-5 h-5 text-primary shrink-0' />
                1800 6868
              </li>
              <li className='flex items-center gap-3 text-[14px] text-foreground/70'>
                <Mail className='w-5 h-5 text-primary shrink-0' />
                support@wave.vn
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='flex flex-col items-center justify-between gap-4 border-t border-border py-8 text-[13px] font-medium text-foreground/55 sm:flex-row'>
          <span>© 2025 WAVE. Bảo lưu mọi quyền.</span>
          <div className='flex gap-6'>
            <a
              href='#'
              className='hover:text-primary transition-colors'
            >
              Bảo mật
            </a>
            <a
              href='#'
              className='hover:text-primary transition-colors'
            >
              Điều khoản
            </a>
            <a
              href='#'
              className='hover:text-primary transition-colors'
            >
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
