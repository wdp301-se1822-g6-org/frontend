import {
  CalendarCheck,
  History,
  Car,
  Gift,
  Bell,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: CalendarCheck,
    title: 'Đặt lịch trực tuyến',
    desc: 'Chọn ngày, giờ và dịch vụ phù hợp ngay trên web hoặc app. Nhận xác nhận tức thì, không cần gọi điện.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: History,
    title: 'Lịch sử rửa xe',
    desc: 'Xem toàn bộ lịch sử các lần rửa xe: thời gian, dịch vụ, chi phí và điểm tích lũy của từng lần.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Car,
    title: 'Quản lý xe cá nhân',
    desc: 'Lưu thông tin nhiều xe, nhận gợi ý dịch vụ phù hợp với từng loại xe và theo dõi tình trạng xe.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Gift,
    title: 'Tích điểm & Đổi thưởng',
    desc: 'Mỗi lần rửa xe tích điểm loyalty. Đổi điểm lấy giảm giá, rửa xe miễn phí hoặc dịch vụ bổ sung.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Bell,
    title: 'Thông báo thời gian thực',
    desc: 'Nhận thông báo khi xe được nhận, đang rửa và sẵn sàng. Không cần ngồi đợi mà vẫn nắm tiến độ.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Bảo đảm chất lượng',
    desc: 'Cam kết hoàn tiền hoặc rửa lại miễn phí nếu không đạt tiêu chuẩn. Chất lượng luôn được đặt lên hàng đầu.',
    color: 'bg-rose-50 text-rose-600',
  },
];

export function FeaturesSection() {
  return (
    <section
      id='services'
      className='py-32 bg-background px-4 relative overflow-hidden'
    >
      <div className='max-w-7xl mx-auto relative z-10'>
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-[0.2em] animate-fade-in-up'>
            <ShieldCheck className='w-4 h-4' />
            Platform Excellence
          </div>
          <h2 className='text-5xl sm:text-6xl font-black text-foreground mb-6 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
            Giải pháp <span className='text-primary'>Toàn diện</span>
          </h2>
          <p className='text-foreground/50 max-w-2xl mx-auto text-xl font-medium leading-relaxed animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards'>
            Tích hợp công nghệ AI và quy trình tự động hóa để mang lại trải nghiệm 
            chăm sóc xe mượt mà nhất cho bạn.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-2 gap-6 h-auto lg:h-[700px]'>
          
          {/* Main Feature - Large Card */}
          <div className='md:col-span-2 lg:col-span-2 lg:row-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 border border-border/50 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 animate-fade-in-up [animation-delay:500ms] opacity-0 fill-mode-forwards'>
            <div>
              <div className='w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform'>
                <CalendarCheck className='w-8 h-8' />
              </div>
              <h3 className='text-3xl font-black text-foreground mb-4 tracking-tight'>{features[0].title}</h3>
              <p className='text-foreground/50 text-lg leading-relaxed'>{features[0].desc}</p>
            </div>
            <div className='mt-10 h-40 bg-linear-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/5 relative overflow-hidden'>
               <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] [background-size:20px_20px] opacity-20' />
               <div className='absolute bottom-4 left-4 right-4 h-12 bg-white rounded-xl shadow-lg border border-border/50 flex items-center px-4 gap-3 animate-float'>
                 <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                 <span className='text-[10px] font-black uppercase tracking-widest text-foreground/40'>Live Booking Enabled</span>
               </div>
            </div>
          </div>

          {/* Medium Card - Right Top */}
          <div className='lg:col-span-2 bg-primary rounded-[2.5rem] p-10 shadow-2xl shadow-primary/20 flex flex-col justify-center text-white group hover:-translate-y-2 transition-all duration-500 animate-fade-in-up [animation-delay:600ms] opacity-0 fill-mode-forwards relative overflow-hidden'>
             <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16' />
             <div className='w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
               <Car className='w-7 h-7' />
             </div>
             <h3 className='text-2xl font-black mb-2 tracking-tight'>{features[2].title}</h3>
             <p className='text-white/70 text-sm leading-relaxed'>{features[2].desc}</p>
          </div>

          {/* Small Cards - Bottom */}
          <div className='bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-border/50 group hover:-translate-y-2 transition-all duration-500 animate-fade-in-up [animation-delay:700ms] opacity-0 fill-mode-forwards'>
             <div className='w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform'>
               <History className='w-6 h-6' />
             </div>
             <h3 className='text-lg font-black text-foreground mb-2 tracking-tight'>{features[1].title}</h3>
             <p className='text-foreground/50 text-xs leading-relaxed'>{features[1].desc}</p>
          </div>

          <div className='bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-border/50 group hover:-translate-y-2 transition-all duration-500 animate-fade-in-up [animation-delay:800ms] opacity-0 fill-mode-forwards'>
             <div className='w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600 mb-6 group-hover:scale-110 transition-transform'>
               <Gift className='w-6 h-6' />
             </div>
             <h3 className='text-lg font-black text-foreground mb-2 tracking-tight'>{features[3].title}</h3>
             <p className='text-foreground/50 text-xs leading-relaxed'>{features[3].desc}</p>
          </div>

        </div>
      </div>
    </section>
  );
}
