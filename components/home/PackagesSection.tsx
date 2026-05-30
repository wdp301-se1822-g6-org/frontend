'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Clock, Ticket, Loader2, Star } from 'lucide-react';
import { getActiveServiceTypes } from '@/lib/customer-api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

type ServiceType = {
  id: string;
  name: string;
  description?: string;
  basePrice: string;
  estimatedMinutes: number;
  checklistTemplate: string[];
  isVoucherEligible: boolean;
};

export function PackagesSection() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['service-types', 'public'],
    queryFn: getActiveServiceTypes,
  });

  const raw: ServiceType[] = data?.data?.data ?? data?.data ?? [];
  // Ẩn các dịch vụ thử nghiệm (vd "Test PayOS Wash") khỏi landing public.
  const services = raw.filter((s) => !/\btest\b/i.test(s.name));

  return (
    <section
      id='services-pricing'
      className='scroll-mt-20 bg-background py-20 sm:py-24'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='max-w-2xl'>
          <p className='text-sm font-semibold tracking-wide text-primary'>
            Bảng giá dịch vụ
          </p>
          <h2 className='mt-3 font-heading text-[26px] font-bold tracking-tight text-foreground sm:text-[32px]'>
            Bảng giá theo từng lần rửa
          </h2>
          <p className='mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base'>
            Giá hiển thị minh bạch theo từng dịch vụ. Khách hàng có thể xem chi
            phí trước khi xác nhận đặt lịch. Hạng thành viên và voucher có thể
            giảm thêm khi đặt.
          </p>
        </div>

        {isLoading && (
          <div className='mt-12 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-[15px] text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            Đang tải danh mục dịch vụ…
          </div>
        )}

        {isError && (
          <div className='mt-12 rounded-xl border border-border bg-card py-16 text-center text-[15px] text-muted-foreground'>
            Không tải được danh mục dịch vụ lúc này. Vui lòng thử lại sau.
          </div>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <div className='mt-12 rounded-xl border border-border bg-card py-16 text-center text-[15px] text-muted-foreground'>
            Chưa có gói dịch vụ nào đang mở. Vui lòng quay lại sau.
          </div>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <div className='mt-12 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {services.map((svc) => {
              const featured = /premium/i.test(svc.name);
              return (
                <article
                  key={svc.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm transition-all hover:shadow-md',
                    featured
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {featured && (
                    <span className='absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[12px] font-semibold text-primary-foreground'>
                      <Star className='size-3 fill-current' />
                      Phổ biến
                    </span>
                  )}

                  <h3 className='font-heading text-xl font-bold text-foreground'>
                    {svc.name}
                  </h3>
                  {svc.description && (
                    <p className='mt-1.5 text-[15px] leading-relaxed text-muted-foreground'>
                      {svc.description}
                    </p>
                  )}

                  <div className='mt-5 flex items-baseline gap-1.5'>
                    <span className='font-heading text-[34px] leading-none font-bold text-foreground'>
                      {formatCurrency(Number(svc.basePrice))}
                    </span>
                    <span className='text-[15px] text-muted-foreground'>
                      / lần
                    </span>
                  </div>

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <span className='inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-[13px] font-medium text-foreground/70'>
                      <Clock className='size-3.5' />
                      {svc.estimatedMinutes} phút
                    </span>
                    {svc.isVoucherEligible && (
                      <span className='inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary'>
                        <Ticket className='size-3.5' />
                        Dùng được voucher
                      </span>
                    )}
                  </div>

                  {svc.checklistTemplate.length > 0 && (
                    <ul className='mt-6 flex-1 space-y-2.5'>
                      {svc.checklistTemplate.map((item) => (
                        <li
                          key={item}
                          className='flex items-start gap-2.5 text-[15px] text-foreground/80'
                        >
                          <Check className='mt-0.5 size-4.5 shrink-0 text-primary' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    onClick={() => router.push('/booking')}
                    variant={featured ? 'default' : 'outline'}
                    className='mt-7 h-11 w-full text-[15px]'
                  >
                    Đặt lịch ngay
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
