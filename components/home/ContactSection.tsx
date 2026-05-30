'use client';

import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';

/**
 * Kênh hỗ trợ tức thì thật sự là trợ lý ảo (chat module / ChatbotWidget) đã gắn
 * sẵn ở góc màn hình. Không có form gửi liên hệ vì BE chưa có endpoint nhận.
 */
const contactItems = [
  { icon: MapPin, label: 'Địa chỉ', value: 'TP. Hồ Chí Minh' },
  { icon: Clock, label: 'Giờ mở cửa', value: '07:00 – 21:00, Thứ 2 – Chủ nhật' },
  { icon: Phone, label: 'Hotline', value: '1800 6868' },
  { icon: Mail, label: 'Email', value: 'support@wave.vn' },
];

export function ContactSection() {
  return (
    <section
      id='contact'
      className='scroll-mt-20 border-t border-border bg-muted/30 py-20 sm:py-24'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-10 lg:grid-cols-2'>
          <div>
            <p className='text-sm font-semibold tracking-wide text-primary'>
              Liên hệ
            </p>
            <h2 className='mt-3 font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]'>
              Cần hỗ trợ trước khi đặt lịch?
            </h2>
            <p className='mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
              Đội ngũ WAVE có thể hỗ trợ bạn chọn dịch vụ phù hợp, kiểm tra lịch
              trống và giải đáp các câu hỏi trước khi đặt lịch.
            </p>
            <div className='mt-6 inline-flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 text-[15px] font-medium text-foreground'>
              <MessageCircle className='size-5 text-primary' />
              Trợ lý sẵn sàng hỗ trợ đặt lịch — mở ô chat ở góc dưới bên phải
            </div>
          </div>

          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {contactItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className='rounded-xl border border-border bg-card p-5 shadow-sm'
              >
                <span className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <Icon className='size-5' />
                </span>
                <dt className='mt-3.5 text-[13px] font-medium tracking-wide text-muted-foreground'>
                  {label}
                </dt>
                <dd className='mt-1 text-[15px] font-semibold text-foreground'>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
