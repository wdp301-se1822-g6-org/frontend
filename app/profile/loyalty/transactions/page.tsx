'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  Download,
  Loader2,
  Info,
  Coins,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getMyLoyalty, getMyLoyaltyTransactions } from '@/lib/customer-api';
import { LoyaltyAccount, LoyaltyTransaction } from '@/types/loyalty';
import { formatNumber, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import LoyaltyCard from '@/components/profile/LoyaltyCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';

const PAGE_SIZE = 10;

const TYPE_META: Record<string, { label: string; className: string }> = {
  earn_completed: { label: 'Tích điểm', className: 'bg-green-100 text-green-700' },
  earn_pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  redeem_voucher: { label: 'Đổi voucher', className: 'bg-orange-100 text-orange-700' },
  tier_change: { label: 'Thăng hạng', className: 'bg-blue-100 text-blue-700' },
  expire: { label: 'Hết hạn điểm', className: 'bg-red-100 text-red-600' },
  adjust: { label: 'Điều chỉnh', className: 'bg-zinc-100 text-zinc-600' },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, className: 'bg-zinc-100 text-zinc-600' };
}

/** Mã tham chiếu hiển thị tuỳ loại giao dịch. */
function refOf(t: LoyaltyTransaction): { label: string; value: string } | null {
  if (t.voucherId) return { label: 'Mã Voucher', value: t.voucherId };
  if (t.orderId) return { label: 'Mã GD', value: t.orderId };
  return null;
}

function timeOf(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function LoyaltyTransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: loyaltyData } = useQuery({
    queryKey: ['my-loyalty'],
    queryFn: getMyLoyalty,
  });

  const {
    data: txData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-loyalty-transactions'],
    queryFn: getMyLoyaltyTransactions,
  });

  const loyalty: LoyaltyAccount | null =
    loyaltyData?.data?.data ?? loyaltyData?.data ?? null;

  const transactions: LoyaltyTransaction[] = useMemo(
    () => txData?.data?.data ?? txData?.data ?? [],
    [txData],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesSearch =
        !q ||
        (t.reason ?? '').toLowerCase().includes(q) ||
        (t.orderId ?? '').toLowerCase().includes(q) ||
        (t.voucherId ?? '').toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [transactions, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleExport = () => {
    const header = ['Ngày giao dịch', 'Nội dung', 'Mã tham chiếu', 'Loại', 'Điểm', 'Số dư'];
    const rows = filtered.map((t) => [
      `${formatDate(t.createdAt)} ${timeOf(t.createdAt)}`.trim(),
      t.reason ?? '',
      refOf(t)?.value ?? '',
      typeMeta(t.type).label,
      String(t.pointsDelta),
      t.balanceAfter != null ? String(t.balanceAfter) : '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lich-su-diem-thuong.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header + Loyalty Card */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
        <div>
          <h1 className='font-heading text-2xl font-black text-foreground flex items-center gap-2'>
            <History className='w-7 h-7 text-primary' /> Lịch sử điểm thưởng
          </h1>
          <p className='text-sm text-muted-foreground max-w-md'>
            Theo dõi chi tiết các hoạt động tích lũy và sử dụng điểm thưởng của
            bạn trong hệ sinh thái WAVE.
          </p>
        </div>
        <div className='w-full lg:w-80 shrink-0'>
          <LoyaltyCard loyalty={loyalty} />
        </div>
      </div>

      {/* Table card */}
      <div className='rounded-3xl border border-border/60 bg-white shadow-sm p-4 sm:p-6 space-y-4'>
        {/* Toolbar */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder='Tìm kiếm giao dịch...'
              className='pl-9'
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Bộ lọc' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả loại</SelectItem>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className='inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-50'
          >
            <Download className='w-4 h-4' /> Xuất báo cáo
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex flex-col items-center justify-center min-h-72 gap-3'>
            <Loader2 className='w-8 h-8 text-primary animate-spin' />
            <p className='text-sm text-muted-foreground font-semibold'>
              Đang tải lịch sử điểm thưởng...
            </p>
          </div>
        ) : error ? (
          <div className='bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 space-y-2'>
            <Info className='w-8 h-8 mx-auto' />
            <h3 className='font-heading font-bold text-lg'>Đã xảy ra lỗi</h3>
            <p className='text-sm'>
              Không thể tải lịch sử điểm thưởng. Vui lòng thử lại sau.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title='Chưa có giao dịch nào'
            description='Bạn chưa có hoạt động điểm thưởng nào phù hợp. Hãy rửa xe để bắt đầu tích điểm nhé!'
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày giao dịch</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className='text-right'>Điểm</TableHead>
                  <TableHead className='text-right'>Số dư</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((t) => {
                  const meta = typeMeta(t.type);
                  const ref = refOf(t);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className='font-semibold text-foreground'>
                          {formatDate(t.createdAt)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {timeOf(t.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className='font-semibold text-foreground'>
                          {t.reason || '—'}
                        </p>
                        {ref && (
                          <p className='text-xs text-muted-foreground truncate max-w-xs'>
                            {ref.label}: {ref.value}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <span
                          className={cn(
                            'font-bold',
                            t.pointsDelta > 0
                              ? 'text-green-600'
                              : t.pointsDelta < 0
                                ? 'text-red-600'
                                : 'text-foreground',
                          )}
                        >
                          {t.pointsDelta > 0
                            ? `+${formatNumber(t.pointsDelta)}`
                            : formatNumber(t.pointsDelta)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right font-semibold text-foreground'>
                        {t.balanceAfter != null ? formatNumber(t.balanceAfter) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2'>
              <p className='text-xs text-muted-foreground'>
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong số{' '}
                {filtered.length} giao dịch
              </p>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='rounded-md border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-accent/50'
                >
                  ‹
                </button>
                <span className='px-3 text-sm font-semibold text-foreground'>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className='rounded-md border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-accent/50'
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <InfoCard
          icon={Coins}
          title='Điểm thưởng là gì?'
          description='W-Points là đơn vị tích lũy mỗi khi bạn sử dụng dịch vụ tại WAVE. Điểm có thể dùng để đổi ưu đãi hoặc thăng hạng.'
        />
        <InfoCard
          icon={Clock}
          title='Hạn sử dụng'
          description='Điểm thưởng có giá trị trong vòng 12 tháng kể từ ngày tích lũy. Hãy đổi quà sớm để không bỏ lỡ quyền lợi.'
        />
        <InfoCard
          icon={ShieldCheck}
          title='Quyền lợi hạng thành viên'
          description='Hạng càng cao, hệ số tích điểm càng lớn và bạn nhận thêm nhiều đặc quyền chăm sóc xe.'
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Coins;
  title: string;
  description: string;
}) {
  return (
    <div className='rounded-2xl border border-border/60 bg-white p-5 shadow-sm'>
      <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Icon className='h-5 w-5' />
      </div>
      <h3 className='font-heading font-bold text-foreground'>{title}</h3>
      <p className='mt-1 text-sm text-muted-foreground leading-6'>{description}</p>
    </div>
  );
}
