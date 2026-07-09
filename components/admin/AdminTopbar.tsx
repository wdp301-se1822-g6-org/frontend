'use client';

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
        <h1 className='font-heading text-xl font-semibold text-foreground tracking-tight'>{title}</h1>
        {subtitle && <p className='text-muted-foreground text-xs mt-0.5'>{subtitle}</p>}
      </div>

      <div className='flex items-center gap-4 ml-auto'>
        {/* Date */}
        <span className='hidden sm:block text-xs font-medium text-muted-foreground'>
          {dateStr}
        </span>
      </div>
    </header>
  );
}
