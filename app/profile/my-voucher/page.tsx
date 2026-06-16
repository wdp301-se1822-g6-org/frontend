'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, Loader2, Info, Gift, Percent } from 'lucide-react';
import { useVouchers } from '@/hooks/vouchers/useVouchers';
import { Voucher, VoucherStatus } from '@/types/voucher';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';

type FilterKey = 'all' | VoucherStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unused', label: 'Chưa sử dụng' },
  { key: 'used', label: 'Đã sử dụng' },
  { key: 'expired', label: 'Hết hạn' },
];

const TYPE_LABEL: Record<string, string> = {
  free_wash: 'Rửa xe miễn phí',
};

function isExpired(v: Voucher): boolean {
  if (v.status === 'expired') return true;
  return v.status === 'unused' && new Date(v.expiresAt).getTime() < Date.now();
}

function effectiveStatus(v: Voucher): VoucherStatus {
  if (v.status === 'used') return 'used';
  if (isExpired(v)) return 'expired';
  return 'unused';
}

function VoucherCard({ v }: { v: Voucher }) {
  const router = useRouter();
  const status = effectiveStatus(v);
  const disabled = status !== 'unused';

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => router.push(`/profile/my-voucher/${v.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/profile/my-voucher/${v.id}`);
        }
      }}
      className={cn(
        'flex rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        disabled
          ? 'border-border/60 opacity-70'
          : 'border-border/60 hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      {/* Left colored stub */}
      <div className='relative w-32 shrink-0 bg-gradient-to-br from-primary to-blue-700 text-white flex flex-col items-center justify-center p-4 text-center'>
        <span className='text-[10px] font-black uppercase tracking-widest text-white/70'>
          {v.type === 'free_wash' ? 'Tặng' : 'Giảm'}
        </span>
        {v.type === 'free_wash' ? (
          <Gift className='w-9 h-9 my-1' />
        ) : (
          <span className='text-2xl font-black leading-none my-1 flex items-center'>
            <Percent className='w-5 h-5' />
          </span>
        )}
        <span className='text-[10px] font-bold uppercase tracking-wide bg-white/15 rounded-full px-2 py-0.5 mt-1'>
          {v.code}
        </span>
        {/* notch decorations */}
        <span className='absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F5F5F5]' />
      </div>

      {/* Right content */}
      <div className='flex-1 p-4 flex flex-col justify-between min-w-0'>
        <div>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-heading font-bold text-foreground leading-snug'>
              {TYPE_LABEL[v.type] ?? v.type}
            </h3>
            <span className='shrink-0 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-md px-1.5 py-0.5'>
              Mới
            </span>
          </div>
          <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
            {v.grantedReason ||
              `Giảm tối đa ${formatCurrency(v.discountCapVnd)} cho dịch vụ rửa xe.`}
          </p>
        </div>

        <div className='flex items-end justify-between gap-2 mt-3'>
          <div>
            <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1'>
              <Calendar className='w-3 h-3' /> Hạn sử dụng
            </p>
            <p className='text-sm font-bold text-foreground'>
              {formatDate(v.expiresAt)}
            </p>
          </div>

          {status === 'unused' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push('/booking');
              }}
              className='rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90'
            >
              Dùng ngay
            </button>
          ) : (
            <span
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-bold',
                status === 'used'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-red-50 text-red-500',
              )}
            >
              {status === 'used' ? 'Đã sử dụng' : 'Hết hạn'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyVoucherPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data: vouchers = [], isLoading, error } = useVouchers(
    filter === 'all' ? undefined : filter,
  );

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-black text-foreground flex items-center gap-2'>
          <Ticket className='w-7 h-7 text-primary' /> Voucher của tôi
        </h1>
        <p className='text-sm text-muted-foreground'>
          Sử dụng các mã giảm giá để tối ưu chi phí chăm sóc xe của bạn.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterKey)}
      >
        <TabsList className='bg-transparent border-b border-border/60 rounded-none p-0 h-auto w-full justify-start gap-6'>
          {FILTERS.map((f) => (
            <TabsTrigger
              key={f.key}
              value={f.key}
              className='flex-none rounded-none border-b-2 border-transparent px-0 pb-2 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none'
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className='flex flex-col items-center justify-center min-h-[300px] gap-3'>
          <Loader2 className='w-8 h-8 text-primary animate-spin' />
          <p className='text-sm text-muted-foreground font-semibold'>
            Đang tải voucher...
          </p>
        </div>
      ) : error ? (
        <div className='bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 space-y-2'>
          <Info className='w-8 h-8 mx-auto' />
          <h3 className='font-heading font-bold text-lg'>Đã xảy ra lỗi</h3>
          <p className='text-sm'>
            Không thể tải danh sách voucher. Vui lòng thử lại sau.
          </p>
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title='Chưa có voucher nào'
          description='Bạn chưa có voucher trong mục này. Hãy rửa xe thường xuyên để nhận thêm ưu đãi nhé!'
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {vouchers.map((v) => (
            <VoucherCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}
