"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CalendarClock, CreditCard, Activity } from "lucide-react";

const trustPoints = [
  { icon: CalendarClock, label: "Đặt lịch theo khung giờ trống" },
  {
    icon: CreditCard,
    label: "Thanh toán online qua PayOS hoặc trả tại cửa hàng",
  },
  { icon: Activity, label: "Theo dõi trạng thái xe theo thời gian thực" },
];

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="border-b border-border bg-background pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <div className="flex flex-col items-start">
            <h1 className="font-heading text-[34px] leading-[1.12] font-bold tracking-tight text-foreground sm:text-5xl">
              Đặt lịch rửa xe và theo dõi
              <span className="text-primary"> toàn bộ quy trình</span> trong một
              nơi
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              WAVE giúp khách hàng chọn khung giờ, thanh toán online, theo dõi
              trạng thái xe theo thời gian thực và nhận voucher thành viên sau
              mỗi lần sử dụng dịch vụ.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => router.push("/booking")}
                className="h-12 px-7 text-base"
              >
                Đặt lịch ngay
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/register")}
                className="h-12 px-7 text-base"
              >
                Tạo tài khoản
              </Button>
            </div>

            <ul className="mt-10 flex w-full flex-col gap-4 border-t border-border pt-8">
              {trustPoints.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-[15px] font-medium text-foreground"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right visual */}
          <div className="relative hidden aspect-4/3 w-full overflow-hidden rounded-2xl border border-border shadow-sm lg:block">
            <Image
              src="/h1.jpg"
              alt="Dịch vụ chăm sóc xe tại WAVE"
              fill
              priority
              sizes="(max-width: 1024px) 0vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
