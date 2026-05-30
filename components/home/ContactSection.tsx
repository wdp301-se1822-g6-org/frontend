'use client';

import { MapPin, Phone, Mail, Send, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const locations = [
  {
    name: 'WAVE - Chi nhánh Quận 1',
    address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '028 1234 5678',
    hours: 'Thứ 2 – CN: 07:00 – 21:00',
  },
  {
    name: 'WAVE - Chi nhánh Quận 7',
    address: '456 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP.HCM',
    phone: '028 8765 4321',
    hours: 'Thứ 2 – CN: 07:00 – 21:00',
  },
  {
    name: 'WAVE - Chi nhánh Bình Thạnh',
    address: '789 Xô Viết Nghệ Tĩnh, Phường 26, Bình Thạnh, TP.HCM',
    phone: '028 1122 3344',
    hours: 'Thứ 2 – CN: 07:00 – 21:00',
  },
  {
    name: 'WAVE - Chi nhánh Thủ Đức',
    address: '321 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 5566 7788',
    hours: 'Thứ 2 – CN: 07:00 – 21:00',
  },
];

export function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <section
      id='contact'
      className='py-12 sm:py-16 bg-muted/50 relative overflow-hidden'
    >
      {/* Blobs */}
      <div className='absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none' />
      <div className='absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -ml-36 -mb-36 pointer-events-none' />

      <div className='max-w-7xl mx-auto px-4 relative z-10'>
        {/* Heading */}
        <div className='text-center mb-10 sm:mb-16'>
          <p className='text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-3'>
            Địa điểm & Liên hệ
          </p>
          <h1 className='text-[1.75rem] sm:text-4xl lg:text-5xl font-heading text-foreground leading-[1.15] mb-4 tracking-tight animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards'>
            Dịch vụ rửa xe <span className='text-primary'>WAVE</span>
          </h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start'>
          {/* LEFT — Locations */}
          <div className='flex flex-col gap-5'>
            <p className='text-sm font-semibold uppercase tracking-widest text-foreground/40 mb-2'>
              Hệ thống chi nhánh
            </p>
            {locations.map((loc) => (
              <div
                key={loc.name}
                className='group bg-white rounded-2xl p-6 border border-border/50 shadow-lg shadow-primary/5 hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer'
              >
                <div className='flex items-start gap-4'>
                  <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300'>
                    <MapPin className='w-5 h-5 text-primary group-hover:text-white transition-colors duration-300' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-black text-foreground text-sm tracking-tight mb-1 group-hover:text-primary transition-colors'>
                      {loc.name}
                    </p>
                    <p className='text-foreground/50 text-xs leading-relaxed mb-2'>
                      {loc.address}
                    </p>
                    <div className='flex flex-wrap gap-4'>
                      <span className='flex items-center gap-1.5 text-xs font-semibold text-foreground/60'>
                        <Phone className='w-3 h-3 text-primary' />
                        {loc.phone}
                      </span>
                      <span className='flex items-center gap-1.5 text-xs font-semibold text-foreground/60'>
                        <Clock className='w-3 h-3 text-primary' />
                        {loc.hours}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className='w-4 h-4 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1' />
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Contact Form */}
          <div className='bg-linear-to-br from-primary/8 via-purple-100/40 to-fuchsia-100/40 border border-primary/15 rounded-[1.75rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-sm relative overflow-hidden'>
            {/* Decorative blobs inside card */}
            <div className='absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute -bottom-12 -left-12 w-44 h-44 bg-fuchsia-300/15 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.06] pointer-events-none' />

            <div className='relative z-10'>
              <h3 className='font-heading text-xl sm:text-2xl font-semibold text-foreground mb-2 tracking-tight'>
                Liên hệ với chúng tôi
              </h3>
              <p className='text-muted-foreground text-sm mb-8'>
                Chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>

              <form
                onSubmit={handleSubmit}
                className='flex flex-col gap-5'
              >
                {/* Name */}
                <div>
                  <label className='block text-foreground/70 text-xs font-semibold uppercase tracking-widest mb-2'>
                    Họ và tên
                  </label>
                  <input
                    id='contact-name'
                    type='text'
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder='Nguyễn Văn A'
                    className='w-full bg-white/70 border border-primary/15 rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white transition-all'
                  />
                </div>

                {/* Email */}
                <div>
                  <label className='block text-foreground/70 text-xs font-semibold uppercase tracking-widest mb-2'>
                    Email
                  </label>
                  <div className='relative'>
                    <input
                      id='contact-email'
                      type='email'
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder='email@example.com'
                      className='w-full bg-white/70 border border-primary/15 rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white transition-all pr-10'
                    />
                    <Mail className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50' />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className='block text-foreground/70 text-xs font-semibold uppercase tracking-widest mb-2'>
                    Tin nhắn
                  </label>
                  <textarea
                    id='contact-message'
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder='Bạn muốn hỏi về dịch vụ nào?'
                    className='w-full bg-white/70 border border-primary/15 rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white transition-all resize-none'
                  />
                </div>

                {/* Submit */}
                <button
                  type='submit'
                  className='flex items-center justify-center gap-3 bg-primary text-white font-semibold px-8 py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-primary/25 mt-2'
                >
                  {sent ? (
                    <>✓ Đã gửi thành công!</>
                  ) : (
                    <>
                      <Send className='w-4 h-4' />
                      Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
