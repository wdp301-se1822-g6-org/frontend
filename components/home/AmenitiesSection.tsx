import { Wifi, Coffee, Gift, Camera, Wind, MapPin } from 'lucide-react';

const amenities = [
  {
    icon: Wind,
    title: 'Máy hút bụi miễn phí',
    desc: '10 trạm hút bụi không dây hiện đại, hoàn toàn miễn phí cho khách hàng.',
    color: 'bg-cyan-500',
  },
  {
    icon: Wifi,
    title: 'Wi-Fi tốc độ cao',
    desc: 'Kết nối internet miễn phí tốc độ cao trong suốt thời gian chờ xe.',
    color: 'bg-blue-500',
  },
  {
    icon: Coffee,
    title: 'Khu vực chờ tiện nghi',
    desc: 'Phòng chờ thoáng mát, có nước uống và máy pha cà phê tự động.',
    color: 'bg-amber-500',
  },
  {
    icon: Gift,
    title: 'Thẻ quà tặng',
    desc: 'Mua thẻ quà tặng WAVE — lựa chọn hoàn hảo cho người thân và bạn bè.',
    color: 'bg-rose-500',
  },
  {
    icon: Camera,
    title: 'Camera an ninh 24/7',
    desc: 'Hệ thống camera giám sát toàn khu vực, đảm bảo an toàn tuyệt đối cho xe của bạn.',
    color: 'bg-purple-500',
  },
  {
    icon: MapPin,
    title: 'Nhiều cơ sở thuận tiện',
    desc: 'Mạng lưới cơ sở rộng khắp thành phố, dễ dàng tìm điểm gần nhất.',
    color: 'bg-emerald-500',
  },
];

export function AmenitiesSection() {
  return (
    <section className='py-12 sm:py-16 bg-background px-4 relative overflow-hidden reveal-on-scroll'>
      {/* Decorative background elements */}
      <div className='absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -ml-36' />
      <div className='absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] -mr-48 -mt-48' />

      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-12 sm:mb-16 lg:mb-20'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-[0.2em]'>
            <div className='w-1.5 h-1.5 bg-primary rounded-full animate-pulse' />
            Exclusive Amenities
          </div>
          <h2 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading text-foreground mb-4 sm:mb-6 tracking-tight'>
            Trải Nghiệm <span className='text-primary'>Toàn Diện</span>
          </h2>
          <p className='text-foreground/50 max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed'>
            Chúng tôi không chỉ rửa xe — WAVE mang đến một không gian nghỉ ngơi
            đẳng cấp với các tiện ích hoàn toàn miễn phí.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
          {amenities.map((a, index) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className='group relative bg-white/40 backdrop-blur-xl border border-white/80 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 animate-fade-in-up'
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className='absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]' />

                <div className='relative z-10'>
                  <div className='w-16 h-16 bg-white rounded-2xl shadow-lg border border-border/50 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500'>
                    <div className='absolute inset-0 bg-primary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity' />
                    <Icon className='w-8 h-8 relative z-10' />
                  </div>

                  <h3 className='font-heading text-xl sm:text-2xl font-black text-foreground mb-3 sm:mb-4 tracking-tight group-hover:text-primary transition-colors'>
                    {a.title}
                  </h3>

                  <p className='text-foreground/50 text-sm leading-relaxed font-medium'>
                    {a.desc}
                  </p>
                </div>

                <div className='absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary/10 rounded-br-xl group-hover:border-primary/30 transition-colors' />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
