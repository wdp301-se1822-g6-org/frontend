'use client';

import { getMyVouchers } from '@/lib/customer-api';
import { formatCurrency } from '@/lib/format';
import type { Voucher } from '@/types/order';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Ticket, Loader2, Info, CheckCircle2, Clock } from 'lucide-react';

const statusConfig: Record<
  string,
  { label: string; badge: string; ring: string }
> = {
  unused: {
    label: 'Khả dụng',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    ring: 'border-emerald-200',
  },
  used: {
    label: 'Đã dùng',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
    ring: 'border-slate-200',
  },
  expired: {
    label: 'Hết hạn',
    badge: 'bg-rose-50 text-rose-700 border border-rose-100',
    ring: 'border-rose-200',
  },
};

const tabs: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unused', label: 'Khả dụng' },
  { value: 'used', label: 'Đã dùng' },
  { value: 'expired', label: 'Hết hạn' },
];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

export default function MyVouchersPage() {
  const [tab, setTab] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-vouchers', 'all'],
    queryFn: async (): Promise<Voucher[]> => {
      const res = await getMyVouchers();
      return res.data?.data ?? res.data ?? [];
    },
  });

  const vouchers = useMemo(() => {
    const list = data ?? [];
    if (tab === 'all') return list;
    return list.filter((v) => v.status === tab);
  }, [data, tab]);

  const unusedCount = (data ?? []).filter((v) => v.status === 'unused').length;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div>
        <h1 className='font-heading text-2xl font-black text-foreground flex items-center gap-2'>
          <Ticket className='w-7 h-7 text-primary' /> Voucher Của Tôi
        </h1>
        <p className='text-sm text-muted-foreground'>
          Các voucher rửa miễn phí của bạn. Áp dụng khi đặt lịch để được giảm giá.
          {unusedCount > 0 && (
            <span className='font-bold text-emerald-600'>
              {' '}
              Bạn đang có {unusedCount} voucher khả dụng.
            </span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className='flex flex-wrap items-center gap-1.5 bg-white border border-border rounded-xl p-1 w-fit'>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.value
                ? 'bg-primary text-white'
                : 'text-foreground/60 hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='flex flex-col items-center justify-center min-h-[300px] gap-3'>
          <Loader2 className='w-8 h-8 text-primary animate-spin' />
          <p className='text-sm text-muted-foreground font-semibold'>
            Đang tải voucher...
          </p>
        </div>
      ) : error ? (
        <div className='bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 space-y-2 max-w-lg mx-auto'>
          <Info className='w-8 h-8 mx-auto' />
          <p className='text-sm'>Không thể tải voucher. Vui lòng thử lại sau.</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className='bg-white border border-border rounded-2xl py-16 text-center text-muted-foreground'>
          <Ticket className='w-10 h-10 mx-auto mb-3 text-foreground/20' />
          <p className='font-semibold'>Chưa có voucher nào ở mục này.</p>
          <p className='text-xs mt-1'>
            Cứ 10 lần rửa hoàn thành, bạn sẽ nhận 1 voucher rửa miễn phí.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {vouchers.map((v) => {
            const sc = statusConfig[v.status] ?? {
              label: v.status,
              badge: 'bg-slate-100 text-slate-600',
              ring: 'border-border',
            };
            const isUsable = v.status === 'unused';
            return (
              <div
                key={v.id}
                className={`relative bg-white rounded-2xl border-2 ${sc.ring} p-5 flex gap-4 overflow-hidden ${
                  isUsable ? 'shadow-sm' : 'opacity-70'
                }`}
              >
                {/* Left ticket stub */}
                <div
                  className={`shrink-0 w-14 rounded-xl flex items-center justify-center ${
                    isUsable
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Ticket className='w-6 h-6' />
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='text-[10px] font-black uppercase tracking-widest text-foreground/40'>
                        Voucher rửa miễn phí
                      </p>
                      <p className='font-mono font-black text-foreground text-base truncate'>
                        {v.code}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${sc.badge}`}
                    >
                      {sc.label}
                    </span>
                  </div>

                  <div className='mt-3 space-y-1 text-xs text-foreground/70'>
                    <p className='flex items-center gap-1.5'>
                      <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0' />
                      Giảm tối đa{' '}
                      <span className='font-bold text-foreground'>
                        {formatCurrency(v.discountCapVnd)}
                      </span>
                    </p>
                    <p className='flex items-center gap-1.5'>
                      <Clock className='w-3.5 h-3.5 text-foreground/40 shrink-0' />
                      HSD: {fmtDate(v.expiresAt)}
                      {v.status === 'used' && v.usedAt
                        ? ` · Đã dùng ${fmtDate(v.usedAt)}`
                        : ''}
                    </p>
                  </div>

                  {isUsable && (
                    <p className='mt-3 text-[11px] text-primary font-semibold'>
                      → Áp dụng ở Bước 4 khi đặt lịch.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
