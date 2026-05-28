import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from 'next/font/google';

import AppProvider from '@/providers/AppProvider';
import ChatbotWidget from '@/components/shared/ChatbotWidget';

import './globals.css';

const beVietnam = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'WAVE',
  icons: {
    icon: '/logo-wave.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='vi'
      className={`${beVietnam.variable} ${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className='min-h-full flex flex-col font-sans'>
        <AppProvider>
          {children}
          <ChatbotWidget />
        </AppProvider>
      </body>
    </html>
  );
}
