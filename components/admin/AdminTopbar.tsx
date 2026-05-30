'use client';

import { Bell, Search } from 'lucide-react';

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <header className='sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-8 py-4 gap-4'>
      {/* Title */}
      <div>
        <h1 className='font-heading text-xl font-black text-foreground tracking-tight'>{title}</h1>
        {subtitle && <p className='text-foreground/60 text-xs font-medium mt-0.5'>{subtitle}</p>}
      </div>

      <div className='flex items-center gap-4 ml-auto'>
        {/* Date */}
        <span className='hidden sm:block text-xs font-semibold text-foreground/60 uppercase tracking-wider'>
          {dateStr}
        </span>

        {/* Search */}
        <div className='relative hidden md:block'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55' />
          <input
            type='text'
            placeholder='Tìm kiếm...'
            className='pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-background transition-all w-48'
          />
        </div>

        {/* Notification */}
        <button className='relative w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center hover:border-primary/30 transition-colors'>
          <Bell className='w-4 h-4 text-foreground/60' />
          <span className='absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full' />
        </button>

        {/* Avatar */}
        <div className='w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20'>
          A
        </div>
      </div>
    </header>
  );
}
