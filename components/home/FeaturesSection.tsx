import {
  CalendarCheck,
  Receipt,
  Car,
  Gift,
  ListChecks,
  Bot,
} from 'lucide-react';

/**
 * Mỗi feature gắn với một module/endpoint BE có thật:
 * - Đặt lịch: POST /me/orders + GET /me/orders/available-slots
 * - Xem trước giá: POST /me/orders/preview (tier discount + voucher + golden hour)
 * - Quản lý xe: /me/vehicles (vehicle-types: Motorbike/Car/SUV)
 * - Theo dõi tiến trình: GET /me/orders, order status state machine
 * - Tích điểm & voucher: loyalty + voucher (FREE_WASH tự cấp sau 10 đơn hoàn tất)
 * - Trợ lý: chat module (Gemini) — ChatbotWidget đã mount toàn cục
 */
const features = [
  {
    icon: CalendarCheck,
    title: 'Đặt lịch theo khung giờ',
    desc: 'Chọn ngày, giờ và dịch vụ phù hợp. Hệ thống chỉ hiển thị các khung giờ còn khả dụng.',
  },
  {
    icon: Receipt,
    title: 'Xem trước chi phí',
    desc: 'Biết trước giá dịch vụ trước khi đặt lịch, hạn chế phát sinh chi phí ngoài dự kiến.',
  },
  {
    icon: Car,
    title: 'Quản lý xe cá nhân',
    desc: 'Lưu thông tin xe, biển số và loại xe để đặt lịch nhanh hơn cho những lần sau.',
  },
  {
    icon: ListChecks,
    title: 'Theo dõi tiến trình',
    desc: 'Cập nhật trạng thái từ lúc tiếp nhận, đang rửa, hoàn tất đến khi bàn giao xe.',
  },
  {
    icon: Gift,
    title: 'Tích điểm và nhận voucher',
    desc: 'Tích điểm sau mỗi lần sử dụng dịch vụ và nhận ưu đãi theo hạng thành viên.',
  },
  {
    icon: Bot,
    title: 'Trợ lý hỗ trợ đặt lịch',
    desc: 'Chatbot hỗ trợ giải đáp thắc mắc, hướng dẫn đặt lịch và kiểm tra thông tin dịch vụ.',
  },
];

export function FeaturesSection() {
  return (
    <section id='features' className='scroll-mt-20 bg-background py-20 sm:py-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl'>
          <p className='text-sm font-semibold tracking-wide text-primary'>
            Dành cho khách hàng
          </p>
          <h2 className='mt-3 font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]'>
            Những gì bạn có thể làm trên WAVE
          </h2>
          <p className='mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            Từ đặt lịch, thanh toán đến theo dõi tiến trình rửa xe, mọi thao tác
            đều được quản lý tập trung trong một hệ thống.
          </p>
        </div>

        <div className='mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className='rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md'
            >
              <span className='flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <h3 className='mt-5 font-heading text-lg font-bold text-foreground'>
                {title}
              </h3>
              <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>
                {desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
