import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Nguyễn Văn Minh',
    time: '2 ngày trước',
    rating: 5,
    text: 'Dịch vụ tuyệt vời! Xe mình sau khi rửa sạch bóng, lớp phủ nano giữ được rất lâu. Nhân viên thân thiện và chuyên nghiệp. Sẽ quay lại thường xuyên.',
    avatar: 'M',
    color: 'bg-cyan-500',
  },
  {
    name: 'Trần Thị Lan',
    time: '1 tuần trước',
    rating: 5,
    text: 'Mình đăng ký gói Kim Cương và rất hài lòng. Đặt lịch qua app dễ dàng, không phải chờ đợi. Xe sạch đẹp như mới, đáng đồng tiền bát gạo.',
    avatar: 'L',
    color: 'bg-purple-500',
  },
  {
    name: 'Lê Hoàng Phúc',
    time: '2 tuần trước',
    rating: 5,
    text: 'Tốc độ rửa nhanh mà chất lượng không thua kém gì. Công nghệ hiện đại, không lo trầy xước. Gói thành viên tiết kiệm hơn nhiều so với rửa xe truyền thống.',
    avatar: 'P',
    color: 'bg-emerald-500',
  },
  {
    name: 'Phạm Bảo Châu',
    time: '3 tuần trước',
    rating: 5,
    text: 'Cơ sở sạch sẽ, thoáng mát. Khu vực chờ có wifi, có nước uống miễn phí. Dịch vụ chuyên nghiệp từ A đến Z. Recommend 100% cho mọi người!',
    avatar: 'C',
    color: 'bg-rose-500',
  },
];

export function TestimonialsSection() {
  return (
    <section className='py-32 bg-background px-4 relative overflow-hidden reveal-on-scroll'>
      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest'>
            <Star className='w-4 h-4 fill-current' />
            Customer Success
          </div>
          <h2 className='text-4xl sm:text-5xl font-black text-foreground mb-6 tracking-tight'>
            Khách hàng nói gì về <span className='text-primary'>WAVE</span>?
          </h2>
          <p className='text-foreground/50 max-w-2xl mx-auto text-lg font-medium leading-relaxed'>
            Hàng nghìn chủ xe sang đã tin tưởng và hài lòng với chất lượng phục vụ 5 sao của chúng tôi.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {testimonials.map((t) => (
            <div
              key={t.name}
              className='bg-white rounded-[2rem] p-8 shadow-xl shadow-primary/5 border border-border/50 hover:shadow-primary/10 hover:-translate-y-2 transition-all relative group'
            >
              <Quote className='absolute top-6 right-8 w-10 h-10 text-primary/5 group-hover:text-primary/10 transition-colors' />

              <div className='flex items-center gap-4 mb-6'>
                <div
                  className={`w-12 h-12 rounded-full ${t.color.replace('cyan', 'primary').replace('purple', 'indigo').replace('emerald', 'emerald').replace('rose', 'red')} flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/10`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className='font-black text-foreground text-base tracking-tight'>
                    {t.name}
                  </div>
                  <div className='text-foreground/30 text-xs font-bold uppercase tracking-wider'>{t.time}</div>
                </div>
              </div>

              <div className='flex gap-1 mb-4'>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className='w-4 h-4 text-yellow-500 fill-current'
                  />
                ))}
              </div>

              <p className='text-foreground/60 text-sm font-medium leading-relaxed italic'>"{t.text}"</p>
            </div>
          ))}
        </div>

        {/* Overall rating summary */}
        <div className='mt-20 flex flex-col lg:flex-row items-center justify-between gap-10 bg-linear-to-br from-primary to-secondary rounded-[2.5rem] p-10 lg:p-16 text-white shadow-2xl shadow-primary/20 relative overflow-hidden'>
          {/* Decorative background for the summary box */}
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32' />
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32' />
          
          <div className='text-center lg:text-left relative z-10'>
            <div className='flex items-center justify-center lg:justify-start gap-4 mb-4'>
              <span className='text-7xl lg:text-8xl font-black tracking-tighter'>4.9</span>
              <div className='flex flex-col'>
                <div className='flex gap-1'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className='w-6 h-6 text-yellow-300 fill-current'
                    />
                  ))}
                </div>
                <span className='text-white/70 font-bold text-sm mt-1 uppercase tracking-widest'>Average Rating</span>
              </div>
            </div>
            <p className='text-white/80 max-w-md text-lg font-medium'>
              Dựa trên hơn 10,000 lượt đánh giá thực tế từ khách hàng thân thiết.
            </p>
          </div>

          <div className='flex flex-wrap justify-center gap-10 lg:gap-20 relative z-10'>
            <div className='text-center'>
              <div className='text-5xl font-black mb-2'>10K+</div>
              <div className='text-white/60 text-xs font-black uppercase tracking-widest'>5-Star Reviews</div>
            </div>
            <div className='text-center'>
              <div className='text-5xl font-black mb-2'>50K+</div>
              <div className='text-white/60 text-xs font-black uppercase tracking-widest'>Happy Cars</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
