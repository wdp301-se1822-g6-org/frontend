'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Search,
  RefreshCw,
  Camera,
  Star,
  AlertTriangle,
  Users,
  RotateCcw,
  Zap,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  adminGetWorkOrders,
  adminGetWorkOrder,
  adminQcWorkOrder,
} from '@/lib/admin-api';
import { formatDateTime } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────
type WoStatus =
  | 'waiting'
  | 'assigned'
  | 'in_progress'
  | 'quality_check'
  | 'returned'
  | 'done';

interface WorkOrder {
  id: string;
  code?: string;
  orderId: string | { _id?: string; id?: string };
  assignedWasherName?: string;
  status: WoStatus;
  qcPassed?: boolean | null;
  qcNote?: string;
  serviceName?: string;
  scheduledAt?: string;
  checkinPhotos?: string[];
  vehicleSnapshot?: { plate?: string };
  priorityLevel?: number;
}

// ── Status config ─────────────────────────────────────────────────────────────
type BadgeVariant = 'warning' | 'info' | 'destructive' | 'success' | 'muted';

const STATUS_CFG: Record<
  WoStatus,
  { label: string; short: string; variant: BadgeVariant; extraCls?: string }
> = {
  waiting: { label: 'Chờ giao thợ', short: 'Chờ thợ', variant: 'warning' },
  assigned: { label: 'Đã giao thợ', short: 'Đã giao', variant: 'info' },
  in_progress: { label: 'Đang rửa xe', short: 'Đang rửa', variant: 'info' },
  returned: {
    label: 'Rửa lại (QC trả về)',
    short: 'Rửa lại',
    variant: 'destructive',
  },
  quality_check: {
    label: 'Chờ QC',
    short: 'Chờ QC',
    variant: 'muted',
    extraCls: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  done: { label: 'Hoàn thành', short: 'Xong', variant: 'success' },
};

// ── Kanban columns ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: 'waiting' as const,
    label: 'Chờ giao thợ',
    statuses: ['waiting'] as WoStatus[],
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    dot: 'bg-amber-500',
    titleCls: 'text-amber-900',
    countCls: 'bg-amber-100 text-amber-800',
    leftBorder: 'border-l-amber-400',
  },
  {
    id: 'washing' as const,
    label: 'Đang rửa',
    statuses: ['assigned', 'in_progress', 'returned'] as WoStatus[],
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-200',
    dot: 'bg-blue-500',
    titleCls: 'text-blue-900',
    countCls: 'bg-blue-100 text-blue-800',
    leftBorder: 'border-l-blue-400',
  },
  {
    id: 'qc' as const,
    label: 'Chờ QC',
    statuses: ['quality_check'] as WoStatus[],
    headerBg: 'bg-purple-50',
    headerBorder: 'border-purple-200',
    dot: 'bg-purple-500',
    titleCls: 'text-purple-900',
    countCls: 'bg-purple-100 text-purple-800',
    leftBorder: 'border-l-purple-400',
  },
  {
    id: 'done' as const,
    label: 'Hoàn thành',
    statuses: ['done'] as WoStatus[],
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
    titleCls: 'text-emerald-900',
    countCls: 'bg-emerald-100 text-emerald-800',
    leftBorder: 'border-l-emerald-400',
  },
] as const;

type ColId = (typeof COLUMNS)[number]['id'];

// ── Helpers ───────────────────────────────────────────────────────────────────
type Urgency = 'overdue' | 'soon' | null;

function getUrgency(scheduledAt?: string, status?: WoStatus): Urgency {
  if (!scheduledAt || status === 'done') return null;
  const diffMin = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
  if (isNaN(diffMin)) return null;
  if (diffMin < -1) return 'overdue';
  if (diffMin <= 30) return 'soon';
  return null;
}

function toHHmm(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const ALL_SVC = '__all__';

// ── Date helpers ──────────────────────────────────────────────────────────────
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

function getDateLabel(dateStr: string): string {
  const today = toLocalDateStr(new Date());
  if (dateStr === today) return 'Hôm nay';
  if (dateStr === shiftDate(today, -1)) return 'Hôm qua';
  if (dateStr === shiftDate(today, 1)) return 'Ngày mai';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function matchesLocalDate(iso?: string, dateStr?: string | null): boolean {
  if (!dateStr) return true;
  if (!iso) return false;
  return toLocalDateStr(new Date(iso)) === dateStr;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManagerWorkOrdersPage() {
  const qc = useQueryClient();

  const [preview, setPreview] = useState<string | null>(null);
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [qcTarget, setQcTarget] = useState<WorkOrder | null>(null);
  const [qcPassed, setQcPassed] = useState(true);
  const [qcNote, setQcNote] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [svcFilter, setSvcFilter] = useState(ALL_SVC);
  const [colFocus, setColFocus] = useState<ColId | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toLocalDateStr(new Date()),
  );

  // ── Data ──
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['work-order-detail', detailId],
    queryFn: () => adminGetWorkOrder(detailId!),
    enabled: !!detailId,
  });
  const detail: (WorkOrder & { checkoutPhotos?: string[] }) | null =
    detailData?.data ?? null;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['manager-work-orders'],
    queryFn: () => adminGetWorkOrders(),
    refetchInterval: 30_000,
  });
  const all: WorkOrder[] = useMemo(() => data?.data?.data ?? data?.data ?? [], [data]);

  // ── Derived ──
  const dateFiltered = useMemo(
    () => all.filter((w) => matchesLocalDate(w.scheduledAt, selectedDate)),
    [all, selectedDate],
  );

  const base = selectedDate ? dateFiltered : all;

  const stats = useMemo(
    () => ({
      total: base.length,
      waiting: base.filter((w) => w.status === 'waiting').length,
      washing: base.filter((w) =>
        ['assigned', 'in_progress', 'returned'].includes(w.status),
      ).length,
      qc: base.filter((w) => w.status === 'quality_check').length,
      done: base.filter((w) => w.status === 'done').length,
    }),
    [base],
  );

  const services = useMemo(() => {
    const s = new Set(
      base.map((w) => w.serviceName).filter(Boolean) as string[],
    );
    return Array.from(s).sort();
  }, [base]);

  const filtered = useMemo(() => {
    let list = base;
    const q = search.trim().toUpperCase();
    if (q) {
      list = list.filter(
        (w) =>
          (w.vehicleSnapshot?.plate ?? '').toUpperCase().includes(q) ||
          (w.code ?? '').toUpperCase().includes(q),
      );
    }
    if (svcFilter !== ALL_SVC)
      list = list.filter((w) => w.serviceName === svcFilter);
    return list;
  }, [base, search, svcFilter]);

  // ── QC mutation ──
  const qcMutation = useMutation({
    mutationFn: (v: { id: string; passed: boolean; note: string }) =>
      adminQcWorkOrder(v.id, v.passed, v.note),
    onSuccess: () => {
      toast.success('Đã hoàn tất đánh giá chất lượng (QC).');
      setQcTarget(null);
      setQcNote('');
      [
        'manager-work-orders',
        'manager-dashboard-workorders',
        'manager-orders',
      ].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Không thể lưu đánh giá QC.';
      toast.error(`Lỗi: ${msg}`);
    },
  });

  const visibleColumns = COLUMNS.filter(
    (c) => colFocus === 'all' || colFocus === c.id,
  );
  const hasActiveFilter = search || svcFilter !== ALL_SVC;

  return (
    <>
      <AdminTopbar
        title='Vận hành Rửa xe'
        subtitle='Trung tâm điều phối — theo dõi tiến độ hàng đợi và đánh giá QC theo thời gian thực.'
      />

      <main className='flex-1 overflow-y-auto flex flex-col bg-slate-50'>
        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <div className='shrink-0 bg-white border-b border-slate-100 px-8 py-3'>
          <div className='flex items-center gap-2 flex-wrap max-w-7xl mx-auto'>
            <StatChip
              label='Tổng phiếu'
              value={stats.total}
              cls='text-slate-700 bg-slate-100'
            />
            <div className='w-px h-6 bg-slate-200 mx-1' />
            <StatChip
              label='Chờ thợ'
              value={stats.waiting}
              cls='text-amber-800 bg-amber-50'
              dot='bg-amber-500'
            />
            <StatChip
              label='Đang rửa'
              value={stats.washing}
              cls='text-blue-800 bg-blue-50'
              dot='bg-blue-500'
            />
            <StatChip
              label='Chờ QC'
              value={stats.qc}
              cls='text-purple-800 bg-purple-50'
              dot='bg-purple-500'
            />
            <StatChip
              label='Hoàn thành'
              value={stats.done}
              cls='text-emerald-800 bg-emerald-50'
              dot='bg-emerald-500'
            />
            <div className='ml-auto'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetch()}
                disabled={isRefetching}
                className='h-7 text-xs gap-1.5'
              >
                <RefreshCw
                  className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        {/* ── Date nav ───────────────────────────────────────────────────── */}
        <div className='shrink-0 bg-white border-b border-slate-100 px-8 py-2'>
          <div className='grid grid-cols-3 items-center max-w-7xl mx-auto'>
            {/* Left: "Về hôm nay" khi đang ở ngày khác */}
            <div className='flex items-center gap-2'>
              <CalendarDays className='size-4 text-muted-foreground shrink-0' />
              {selectedDate !== null &&
                selectedDate !== toLocalDateStr(new Date()) && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
                  >
                    Về hôm nay
                  </Button>
                )}
            </div>

            {/* Center: điều hướng ngày — luôn ở giữa */}
            <div className='flex items-center justify-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                disabled={selectedDate === null}
                onClick={() =>
                  setSelectedDate((d) =>
                    d ? shiftDate(d, -1) : toLocalDateStr(new Date()),
                  )
                }
              >
                <ChevronLeft className='size-4' />
              </Button>

              <span className='min-w-45 text-center text-sm font-bold text-slate-800 select-none'>
                {selectedDate ? getDateLabel(selectedDate) : 'Tất cả ngày'}
                {selectedDate && (
                  <span className='ml-1.5 text-xs font-normal text-slate-400'>
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      'vi-VN',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      },
                    )}
                  </span>
                )}
              </span>

              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                disabled={selectedDate === null}
                onClick={() =>
                  setSelectedDate((d) =>
                    d ? shiftDate(d, 1) : toLocalDateStr(new Date()),
                  )
                }
              >
                <ChevronRight className='size-4' />
              </Button>
            </div>

            {/* Right: toggle xem tất cả */}
            <div className='flex justify-end'>
              <Button
                variant={selectedDate === null ? 'default' : 'outline'}
                size='sm'
                className='h-7 text-xs'
                onClick={() =>
                  setSelectedDate((d) =>
                    d === null ? toLocalDateStr(new Date()) : null,
                  )
                }
              >
                {selectedDate === null ? 'Đang xem tất cả' : 'Xem tất cả ngày'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className='shrink-0 bg-white border-b border-slate-100 px-8 py-2.5'>
          <div className='flex items-center gap-3 flex-wrap max-w-7xl mx-auto'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none' />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Biển số, mã phiếu...'
                className='h-8 pl-8 text-sm w-48'
              />
            </div>

            {/* Service filter */}
            <Select
              value={svcFilter}
              onValueChange={setSvcFilter}
            >
              <SelectTrigger className='h-8 text-sm w-40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SVC}>Tất cả dịch vụ</SelectItem>
                {services.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Column focus pills */}
            <div className='flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5'>
              {(
                [{ id: 'all', label: 'Tất cả' }, ...COLUMNS] as {
                  id: string;
                  label: string;
                }[]
              ).map((c) => (
                <Button
                  key={c.id}
                  variant='ghost'
                  size='sm'
                  onClick={() => setColFocus(c.id as ColId | 'all')}
                  className={[
                    'h-7 px-3 text-xs font-semibold rounded-md transition-all',
                    colFocus === c.id
                      ? 'bg-white shadow-sm text-slate-800 hover:bg-white ring-1 ring-slate-200/80'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-transparent',
                  ].join(' ')}
                >
                  {c.label}
                </Button>
              ))}
            </div>

            {hasActiveFilter && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSearch('');
                  setSvcFilter(ALL_SVC);
                }}
                className='h-7 text-xs text-muted-foreground gap-1'
              >
                <XCircle className='size-3.5' /> Xóa lọc
              </Button>
            )}
          </div>
        </div>

        {/* ── Kanban board ───────────────────────────────────────────────── */}
        <div className='px-8 py-5 max-w-7xl mx-auto w-full'>
          {isLoading ? (
            <div className='flex gap-4'>
              {COLUMNS.map((col) => (
                <div key={col.id} className='flex-1 min-w-52 space-y-2'>
                  <Skeleton className='h-9 rounded-xl w-full' />
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className='h-28 rounded-xl w-full' />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className='flex gap-4 items-start'>
              {visibleColumns.map((col) => {
                const cards = filtered.filter((wo) =>
                  col.statuses.includes(wo.status),
                );
                const sorted = [...cards].sort((a, b) => {
                  const score = (u: Urgency) =>
                    u === 'overdue' ? 0 : u === 'soon' ? 1 : 2;
                  const diff =
                    score(getUrgency(a.scheduledAt, a.status)) -
                    score(getUrgency(b.scheduledAt, b.status));
                  if (diff !== 0) return diff;
                  return (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '');
                });

                const LIMIT = 5;
                const isExpanded = expandedCols.has(col.id);
                const visible = isExpanded ? sorted : sorted.slice(0, LIMIT);
                const remaining = sorted.length - LIMIT;

                return (
                  <div key={col.id} className='flex-1 min-w-52 flex flex-col'>
                    {/* Column header */}
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border ${col.headerBg} ${col.headerBorder} mb-2`}
                    >
                      <div className='flex items-center gap-2'>
                        <span className={`size-2.5 rounded-full shrink-0 ${col.dot}`} />
                        <span className={`text-sm font-bold ${col.titleCls}`}>
                          {col.label}
                        </span>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.countCls}`}>
                        {sorted.length}
                      </span>
                    </div>

                    {/* Card list */}
                    <div className='space-y-2'>
                      {sorted.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
                          <Car className='size-7 mb-2 opacity-20' />
                          <p className='text-xs'>Không có xe nào</p>
                        </div>
                      ) : (
                        <>
                          {visible.map((wo) => (
                            <WOCard
                              key={wo.id}
                              wo={wo}
                              leftBorder={col.leftBorder}
                              onDetail={() => setDetailId(wo.id)}
                              onQc={() => setQcTarget(wo)}
                            />
                          ))}
                          {!isExpanded && remaining > 0 && (
                            <button
                              onClick={() =>
                                setExpandedCols((s) => new Set([...s, col.id]))
                              }
                              className={`w-full py-2 text-xs font-semibold rounded-xl border border-dashed transition-colors ${col.headerBorder} ${col.titleCls} hover:${col.headerBg}`}
                            >
                              ··· Xem thêm {remaining} phiếu
                            </button>
                          )}
                          {isExpanded && sorted.length > LIMIT && (
                            <button
                              onClick={() =>
                                setExpandedCols((s) => {
                                  const n = new Set(s);
                                  n.delete(col.id);
                                  return n;
                                })
                              }
                              className={`w-full py-2 text-xs font-semibold rounded-xl border border-dashed transition-colors ${col.headerBorder} ${col.titleCls}`}
                            >
                              Thu gọn
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── QC Dialog ──────────────────────────────────────────────────────── */}
      <Dialog
        open={!!qcTarget}
        onOpenChange={(o) => !o && setQcTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá chất lượng (QC)</DialogTitle>
            <DialogDescription>
              Kiểm định xe{' '}
              <span className='font-mono font-bold text-foreground'>
                {qcTarget?.vehicleSnapshot?.plate ?? ''}
              </span>
              . Đạt → hoàn tất đơn; Không đạt → trả thợ rửa lại.
            </DialogDescription>
          </DialogHeader>

          {qcTarget?.checkinPhotos?.length ? (
            <div className='space-y-2'>
              <Label className='flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                <Camera className='size-3.5' /> Ảnh hiện trạng (
                {qcTarget.checkinPhotos.length})
              </Label>
              <div className='flex flex-wrap gap-2'>
                {qcTarget.checkinPhotos.map((u, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setPreview(u)}
                    className='size-16 overflow-hidden rounded-lg border hover:opacity-80 transition-opacity'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u}
                      alt=''
                      className='size-full object-cover'
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className='grid grid-cols-2 gap-3'>
            <Button
              type='button'
              variant={qcPassed ? 'default' : 'outline'}
              onClick={() => setQcPassed(true)}
            >
              <CheckCircle2 className='size-4' /> Đạt
            </Button>
            <Button
              type='button'
              variant={!qcPassed ? 'destructive' : 'outline'}
              onClick={() => setQcPassed(false)}
            >
              <XCircle className='size-4' /> Không đạt
            </Button>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='qc-note'>Ghi chú chất lượng</Label>
            <Textarea
              id='qc-note'
              value={qcNote}
              onChange={(e) => setQcNote(e.target.value)}
              rows={3}
              placeholder={
                qcPassed
                  ? 'VD: Xe rửa sạch bóng, đạt yêu cầu…'
                  : 'VD: Bánh sau còn bám bùn, kính chưa sạch…'
              }
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Hủy</Button>
            </DialogClose>
            <Button
              variant={qcPassed ? 'default' : 'destructive'}
              disabled={qcMutation.isPending}
              onClick={() =>
                qcTarget &&
                qcMutation.mutate({
                  id: qcTarget.id,
                  passed: qcPassed,
                  note: qcNote,
                })
              }
            >
              {qcMutation.isPending && <Spinner />} Hoàn tất đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Car className='size-4' /> Chi tiết phiếu rửa xe
            </DialogTitle>
            <DialogDescription>
              {detail?.vehicleSnapshot?.plate
                ? `Xe ${detail.vehicleSnapshot.plate}`
                : 'Đang tải...'}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className='space-y-3 py-4'>
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='h-5 w-1/2' />
              <div className='flex gap-2 pt-2'>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className='size-16 rounded-lg'
                  />
                ))}
              </div>
            </div>
          ) : detail ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm'>
                <InfoItem
                  label='Mã phiếu'
                  value={detail.code ?? detail.id.slice(-6).toUpperCase()}
                  mono
                />
                <InfoItem
                  label='Trạng thái'
                  value={STATUS_CFG[detail.status]?.label ?? detail.status}
                />
                <InfoItem
                  label='Dịch vụ'
                  value={detail.serviceName ?? '-'}
                />
                <InfoItem
                  label='Thợ rửa'
                  value={detail.assignedWasherName ?? 'Chưa gán'}
                />
                {detail.scheduledAt && (
                  <InfoItem
                    label='Giờ hẹn'
                    value={formatDateTime(detail.scheduledAt)}
                  />
                )}
              </div>

              {/* Ảnh nhận xe */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  <Camera className='size-3.5 text-amber-500' />
                  Ảnh nhận xe
                  {detail.checkinPhotos?.length
                    ? ` (${detail.checkinPhotos.length})`
                    : ''}
                </Label>
                {detail.checkinPhotos?.length ? (
                  <div className='flex flex-wrap gap-2'>
                    {detail.checkinPhotos.map((u, i) => (
                      <button
                        key={i}
                        type='button'
                        onClick={() => setPreview(u)}
                        className='size-16 overflow-hidden rounded-lg border hover:opacity-80 transition-opacity'
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u}
                          alt=''
                          className='size-full object-cover'
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs italic text-muted-foreground'>
                    Không có ảnh hiện trạng.
                  </p>
                )}
              </div>

              {/* Ảnh sau rửa */}
              {(detail.checkoutPhotos?.length ?? 0) > 0 && (
                <div className='space-y-2'>
                  <Label className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    <Camera className='size-3.5 text-emerald-500' />
                    Ảnh sau rửa ({detail.checkoutPhotos!.length})
                  </Label>
                  <div className='flex flex-wrap gap-2'>
                    {detail.checkoutPhotos!.map((u, i) => (
                      <button
                        key={i}
                        type='button'
                        onClick={() => setPreview(u)}
                        className='size-16 overflow-hidden rounded-lg border hover:opacity-80 transition-opacity'
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u}
                          alt=''
                          className='size-full object-cover'
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Đóng</Button>
            </DialogClose>
            {detail?.status === 'quality_check' && (
              <Button
                onClick={() => {
                  setQcTarget(detail);
                  setDetailId(null);
                }}
              >
                <ShieldCheck className='size-4' /> Đánh giá QC
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image preview ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
      >
        <DialogContent className='max-w-3xl border-none bg-transparent p-0 shadow-none'>
          <DialogTitle className='sr-only'>Xem ảnh</DialogTitle>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt='Xem ảnh'
              className='max-h-[80vh] w-full rounded-xl object-contain'
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── WOCard ────────────────────────────────────────────────────────────────────
function WOCard({
  wo,
  leftBorder,
  onDetail,
  onQc,
}: {
  wo: WorkOrder;
  leftBorder: string;
  onDetail: () => void;
  onQc: () => void;
}) {
  const urgency = getUrgency(wo.scheduledAt, wo.status);
  const timeStr = toHHmm(wo.scheduledAt);
  const st = STATUS_CFG[wo.status];
  const isVip = (wo.priorityLevel ?? 0) > 1;
  const isReturned = wo.status === 'returned';

  return (
    <div
      className={[
        'bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm',
        'hover:shadow-md transition-all duration-150 p-3',
        leftBorder,
        urgency === 'overdue' ? 'ring-1 ring-rose-400/60 bg-rose-50/30' : '',
      ].join(' ')}
    >
      {/* Row 1: plate + badges */}
      <div className='flex items-start justify-between gap-1.5 mb-1.5'>
        <div className='flex items-center gap-1.5 min-w-0'>
          {isVip && (
            <Star className='size-3.5 text-amber-500 fill-amber-400 shrink-0' />
          )}
          <span className='font-mono text-[15px] font-black text-slate-900 tracking-wide leading-tight truncate'>
            {wo.vehicleSnapshot?.plate ?? '—'}
          </span>
        </div>
        <div className='flex items-center gap-1 shrink-0'>
          {urgency === 'overdue' && (
            <Badge
              variant='destructive'
              className='gap-0.5 px-1.5 py-0.5 text-[10px]'
            >
              <AlertTriangle className='size-2.5' /> Trễ
            </Badge>
          )}
          {urgency === 'soon' && (
            <Badge
              variant='warning'
              className='gap-0.5 px-1.5 py-0.5 text-[10px]'
            >
              <Zap className='size-2.5' /> Sắp đến
            </Badge>
          )}
          <Badge
            variant={st.variant}
            className={['px-1.5 py-0.5 text-[10px]', st.extraCls ?? ''].join(
              ' ',
            )}
          >
            {st.short}
          </Badge>
        </div>
      </div>

      {/* Row 2: service + code */}
      <div className='flex items-center justify-between gap-1 mb-1.5'>
        <span className='text-xs text-slate-600 font-medium truncate flex-1 leading-tight'>
          {wo.serviceName ?? '—'}
        </span>
        <span className='font-mono text-[10px] text-slate-400 shrink-0'>
          {wo.code ?? wo.id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Row 3: time + washer */}
      <div className='flex items-center gap-3 mb-2.5'>
        {timeStr && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${
              urgency === 'overdue' ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            <Clock className='size-3' />
            {timeStr}
          </div>
        )}
        <div className='flex items-center gap-1 text-xs text-slate-500 min-w-0 flex-1'>
          <Users className='size-3 shrink-0 text-slate-400' />
          {wo.assignedWasherName ? (
            <span className='truncate'>{wo.assignedWasherName}</span>
          ) : (
            <span className='text-amber-600 font-medium'>Chưa phân công</span>
          )}
        </div>
        {isReturned && (
          <Badge
            variant='destructive'
            className='gap-0.5 px-1.5 py-0.5 text-[10px] shrink-0'
          >
            <RotateCcw className='size-2.5' /> Rửa lại
          </Badge>
        )}
      </div>

      {/* Row 4: actions */}
      <div className='flex gap-1.5'>
        <Button
          variant='outline'
          size='sm'
          onClick={onDetail}
          className='flex-1 h-6 text-xs gap-1.5 px-2'
        >
          Chi tiết
          {wo.checkinPhotos?.length ? (
            <span className='inline-flex size-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-black text-amber-700'>
              {wo.checkinPhotos.length}
            </span>
          ) : null}
        </Button>
        {wo.status === 'quality_check' && (
          <Button
            size='sm'
            onClick={onQc}
            className='flex-1 h-6 text-xs gap-1 px-2 bg-purple-600 hover:bg-purple-700 text-white'
          >
            <ShieldCheck className='size-3' /> QC
          </Button>
        )}
      </div>
    </div>
  );
}

// ── StatChip ──────────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  cls,
  dot,
}: {
  label: string;
  value: number;
  cls: string;
  dot?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap ${cls}`}
    >
      {dot && <span className={`size-2 rounded-full shrink-0 ${dot}`} />}
      <span className='text-sm font-black tabular-nums'>{value}</span>
      <span className='text-xs font-medium opacity-70'>{label}</span>
    </div>
  );
}

// ── InfoItem ──────────────────────────────────────────────────────────────────
function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5'>
        {label}
      </p>
      <p className={`font-semibold text-sm ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
