'use client';

import { useEffect } from 'react';

export default function PWAHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Chỉ đăng ký Service Worker trong môi trường production để tránh xung đột HMR cache lúc dev
      if (process.env.NODE_ENV !== 'production') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Unregistered stale Service Worker in development mode.');
              }
            });
          }
        });
        return;
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered successfully with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
