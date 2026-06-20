'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false, // disable aggressive refetch on tab focus
      retry: 1, // retry failed queries once
    },
  },
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const { initAuth, _hasHydrated } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!_hasHydrated || initialized.current) return;
    initialized.current = true;
    initAuth();

    // Scroll Reveal Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('animate-fade-in-up');
          target.style.opacity = '1';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, [initAuth, _hasHydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position='top-right' closeButton />
    </QueryClientProvider>
  );
}
