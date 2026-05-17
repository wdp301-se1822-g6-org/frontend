'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      id='scroll-to-top'
      onClick={scrollTop}
      aria-label='Cuộn lên đầu trang'
      className={`
        fixed bottom-8 right-8 z-50
        w-12 h-12 rounded-full
        bg-primary text-white shadow-lg shadow-primary/30
        flex items-center justify-center
        hover:bg-primary/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/40
        active:scale-95
        transition-all duration-300
        ${visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      <ArrowUp className='w-5 h-5' />
    </button>
  );
}
