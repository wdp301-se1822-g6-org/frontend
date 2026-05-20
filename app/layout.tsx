import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppProvider from "@/providers/AppProvider";
import "./globals.css";

// Một hệ font duy nhất cho toàn hệ thống. Heading khác body bằng size/weight,
// không bằng font-family — đảm bảo giao diện đồng nhất giữa mọi màn hình.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "WAVE",
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
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
