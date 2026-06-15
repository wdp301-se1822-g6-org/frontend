'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  adminGetShifts,
  adminCreateShift,
  adminUpdateShift,
  adminToggleShift,
  adminGetShiftStaff,
} from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Ban,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  UserX,
  Activity,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ──────────────────────────────────────────────
type PopulatedStaff = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  role?: string;
};

type Shift = {
  _id?: string;
  id?: string;
  staffId?: string | PopulatedStaff;
  shiftType?: 'cashier' | 'washer';
  stationName?: string;
  startAt?: string;
  endAt?: string;
  status?: string;
  note?: string;
};

type UserData = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
};

type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

type StaffRow = {
  staffId: string;
  name: string;
  role: string; // 'washer' | 'cashier' | other
  shifts: Shift[]; // shifts for the selected date
  stations: string[];
  timeRange: string;
  status: ShiftStatus | null; // merged status; null = chưa phân ca
  inRoster: boolean;
};

// ─── Helpers ────────────────────────────────────────────
const getId = (x?: { _id?: string; id?: string } | null) => x?._id ?? x?.id ?? '';

const shiftStaffId = (s: Shift) =>
  typeof s.staffId === 'object' ? getId(s.staffId) : s.staffId ?? '';

const pad2 = (n: number) => String(n).padStart(2, '0');

const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isoToDateKey = (iso?: string) => (iso ? dateKey(new Date(iso)) : '');

const todayKey = () => dateKey(new Date());

const ROLE_LABEL: Record<string, string> = { washer: 'Rửa xe', cashier: 'Thu ngân' };

const STATUS_META: Record<ShiftStatus, { label: string; variant: 'success' | 'info' | 'muted' | 'destructive' }> = {
  active: { label: 'Đang làm', variant: 'success' },
  scheduled: { label: 'Đã lên lịch', variant: 'info' },
  completed: { label: 'Hoàn thành', variant: 'muted' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

const normalizeStatus = (s?: string): ShiftStatus =>
  s === 'active' || s === 'completed' || s === 'cancelled' ? s : 'scheduled';

type Block = 'morning' | 'afternoon' | 'fullday';

// Khung giờ cố định theo buổi (nghiệp vụ). Hiển thị theo các mốc này thay vì
// giờ thô trong startAt/endAt để tránh lệch giờ do quy đổi múi giờ.
const BLOCK_TIME = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '13:00', end: '17:00' },
} as const;

// Buổi (sáng/chiều) của một bản ghi ca dựa trên giờ bắt đầu.
const blockOfShift = (iso?: string): 'morning' | 'afternoon' =>
  iso && new Date(iso).getHours() >= 12 ? 'afternoon' : 'morning';

// Khung giờ hiển thị của một ngày từ các buổi đã phân (sáng/chiều/cả ngày).
const blockRange = (shifts: Shift[]): string => {
  if (!shifts.length) return '';
  const hasMorning = shifts.some((s) => blockOfShift(s.startAt) === 'morning');
  const hasAfternoon = shifts.some((s) => blockOfShift(s.startAt) === 'afternoon');
  const start = hasMorning ? BLOCK_TIME.morning.start : BLOCK_TIME.afternoon.start;
  const end = hasAfternoon ? BLOCK_TIME.afternoon.end : BLOCK_TIME.morning.end;
  return `${start} - ${end}`;
};

// Các bản ghi ca còn hiệu lực của một nhân viên trong một ngày.
const liveShiftsOf = (shifts: Shift[], staffId: string, dateKeyStr: string) =>
  shifts.filter(
    (s) => shiftStaffId(s) === staffId && isoToDateKey(s.startAt) === dateKeyStr && s.status !== 'cancelled',
  );

// Merge multiple shifts (e.g. ca cả ngày = sáng + chiều) into one display status.
const mergeStatus = (shifts: Shift[]): ShiftStatus | null => {
  if (!shifts.length) return null;
  const statuses = shifts.map((s) => normalizeStatus(s.status));
  if (statuses.includes('active')) return 'active';
  if (statuses.includes('scheduled')) return 'scheduled';
  if (statuses.includes('completed')) return 'completed';
  return 'cancelled';
};

// ─── Stat card ──────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className='flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm'>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className='h-5 w-5' />
      </div>
      <div className='min-w-0'>
        <p className='text-2xl font-black leading-none text-foreground tabular-nums'>{value}</p>
        <p className='mt-1 text-xs font-medium text-muted-foreground'>{label}</p>
      </div>
    </div>
  );
}

// ─── Status / role badges ───────────────────────────────
function StatusBadge({ status }: { status: ShiftStatus | null }) {
  if (!status) {
    return (
      <Badge variant='warning' className='gap-1'>
        <AlertTriangle className='size-3' />
        Chưa phân ca
      </Badge>
    );
  }
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={role === 'washer' ? 'info' : 'secondary'}>
      {ROLE_LABEL[role] ?? role ?? '—'}
    </Badge>
  );
}

// ─── Shift modal ────────────────────────────────────────
function ShiftModal({
  item,
  prefill,
  onClose,
  onSave,
  staffList,
  shifts,
  saving,
}: {
  item?: Shift | null;
  prefill?: { staffId?: string; date?: string } | null;
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  staffList: UserData[];
  shifts: Shift[];
  saving: boolean;
}) {
  const editingStaffId = item ? shiftStaffId(item) : '';
  const editingDate = item ? isoToDateKey(item.startAt) : '';

  const initialStaffId = item ? editingStaffId : prefill?.staffId ?? '';
  const initialStaff = staffList.find((s) => getId(s) === initialStaffId);

  // Khi sửa: suy ra buổi từ TẤT CẢ bản ghi của nhân viên trong ngày
  // (ca "cả ngày" = 2 bản ghi sáng + chiều → mặc định hiển thị "Cả ngày").
  const initialBlock: Block = (() => {
    if (!item) return 'morning';
    const blocks = new Set(liveShiftsOf(shifts, editingStaffId, editingDate).map((s) => blockOfShift(s.startAt)));
    if (blocks.has('morning') && blocks.has('afternoon')) return 'fullday';
    return blocks.has('afternoon') ? 'afternoon' : 'morning';
  })();

  const [form, setForm] = useState({
    staffId: initialStaffId,
    shiftType: (item?.shiftType ?? (initialStaff?.role === 'cashier' ? 'cashier' : 'washer')) as
      | 'washer'
      | 'cashier',
    stationName: item?.stationName ?? 'Bay 1',
    date: item ? editingDate || todayKey() : prefill?.date ?? todayKey(),
    block: initialBlock,
    note: item?.note ?? '',
  });

  const minDate = !item ? todayKey() : undefined;

  // Nhân viên đã có ca trong ngày đang chọn (bỏ qua ca đã hủy).
  // Khi sửa, loại trừ toàn bộ ca của chính nhân viên đang được sửa (ca "cả ngày"
  // được lưu thành 2 bản ghi sáng + chiều) để không tự đánh dấu trùng.
  const takenStaffIds = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => {
      if (s.status === 'cancelled') return;
      if (editingStaffId && shiftStaffId(s) === editingStaffId) return;
      if (isoToDateKey(s.startAt) === form.date) set.add(shiftStaffId(s));
    });
    return set;
  }, [shifts, form.date, editingStaffId]);

  const selectedTaken = !!form.staffId && takenStaffIds.has(form.staffId);

  const handleStaffChange = (staffId: string) => {
    const selectedStaff = staffList.find((s) => getId(s) === staffId);
    setForm((prev) => ({
      ...prev,
      staffId,
      shiftType:
        selectedStaff?.role === 'washer' || selectedStaff?.role === 'cashier'
          ? (selectedStaff.role as 'washer' | 'cashier')
          : prev.shiftType,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffId) return toast.error('Vui lòng chọn nhân viên ca trực.');
    if (!form.date) return toast.error('Vui lòng chọn ngày làm việc.');
    if (!item && minDate && form.date < minDate)
      return toast.error('Ngày làm việc không được ở trong quá khứ.');
    if (selectedTaken) return toast.error('Nhân viên đã được phân ca trong ngày này.');

    onSave({
      staffId: form.staffId,
      shiftType: form.shiftType,
      stationName: form.stationName,
      date: form.date,
      block: form.block,
      note: form.note,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{item ? 'Sửa ca trực nhân viên' : 'Thêm ca trực mới'}</DialogTitle>
          <DialogDescription>
            Mỗi nhân viên chỉ được phân tối đa một ca trong một ngày.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* Nhân viên */}
          <div className='flex flex-col gap-1.5'>
            <Label>Nhân viên ca trực</Label>
            <Select value={form.staffId || undefined} onValueChange={handleStaffChange}>
              <SelectTrigger>
                <SelectValue placeholder='-- Chọn nhân viên --' />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => {
                  const sId = getId(s);
                  const taken = takenStaffIds.has(sId);
                  return (
                    <SelectItem key={sId} value={sId} disabled={taken}>
                      {(s.fullName ?? s.name) + ` · ${ROLE_LABEL[s.role ?? ''] ?? s.role}`}
                      {taken ? ' (đã có ca)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedTaken && (
              <p className='flex items-center gap-1.5 text-xs font-medium text-destructive'>
                <AlertTriangle className='size-3.5' />
                Nhân viên đã được phân ca trong ngày này.
              </p>
            )}
          </div>

          {/* Loại ca */}
          <div className='flex flex-col gap-1.5'>
            <Label>Vai trò ca làm việc</Label>
            <Select
              value={form.shiftType}
              onValueChange={(v) => setForm({ ...form, shiftType: v as 'washer' | 'cashier' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='washer'>Rửa xe (Washer)</SelectItem>
                <SelectItem value='cashier'>Thu ngân (Cashier)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trạm */}
          <div className='flex flex-col gap-1.5'>
            <Label>Trạm / Bãi làm việc</Label>
            <Input
              value={form.stationName}
              onChange={(e) => setForm({ ...form, stationName: e.target.value })}
              placeholder='Ví dụ: Bay 1, Quầy thu ngân'
            />
          </div>

          {/* Ngày + Ca */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label>Ngày làm việc</Label>
              <Input
                type='date'
                min={minDate}
                value={form.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, date: !item && minDate && val && val < minDate ? minDate : val });
                }}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label>Ca làm việc</Label>
              <Select
                value={form.block}
                onValueChange={(v) =>
                  setForm({ ...form, block: v as 'morning' | 'afternoon' | 'fullday' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='morning'>Ca sáng (08:00–12:00)</SelectItem>
                  <SelectItem value='afternoon'>Ca chiều (13:00–17:00)</SelectItem>
                  <SelectItem value='fullday'>Cả ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ghi chú */}
          <div className='flex flex-col gap-1.5'>
            <Label>Ghi chú</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder='Ghi chú ca trực (không bắt buộc)...'
            />
          </div>

          <DialogFooter className='mt-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Huỷ
            </Button>
            <Button type='submit' disabled={saving || selectedTaken}>
              {saving ? 'Đang lưu...' : 'Lưu ca trực'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ───────────────────────────────────────────────
type ModalState = { item?: Shift; prefill?: { staffId?: string; date?: string } } | null;

export default function AdminShiftsPage() {
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'washer' | 'cashier' | 'unassigned'>('all');
  const [filterStation, setFilterStation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [modal, setModal] = useState<ModalState>(null);

  const { data: shiftsRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-shifts'],
    queryFn: () => adminGetShifts({ limit: 100 }),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['admin-shifts-staff'],
    queryFn: async (): Promise<UserData[]> => {
      const res = await adminGetShiftStaff();
      return (res.data?.data ?? res.data ?? []) as UserData[];
    },
  });

  const shifts: Shift[] = useMemo(() => shiftsRes?.data?.data ?? shiftsRes?.data ?? [], [shiftsRes]);
  const staffList: UserData[] = useMemo(() => usersRes ?? [], [usersRes]);

  const [saving, setSaving] = useState(false);

  const toggleShift = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminToggleShift(id, status),
    onSuccess: () => {
      toast.success('Đã hủy ca trực.');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể cập nhật trạng thái ca trực.';
      toast.error(`Lỗi: ${m}`);
    },
  });

  // Lưu ca trực. Một ngày của nhân viên có thể gồm 2 bản ghi (sáng + chiều cho ca
  // "cả ngày"), nên khi sửa phải đối chiếu: tạo buổi còn thiếu, hủy buổi dư, cập
  // nhật buổi giữ lại — thay vì chỉ patch một bản ghi (gây lỗi trùng giờ).
  const handleSave = async (d: Record<string, unknown>) => {
    const staffId = d.staffId as string;
    const date = d.date as string;
    const block = d.block as Block;
    const base = {
      staffId,
      shiftType: d.shiftType,
      stationName: d.stationName,
      note: d.note,
      date,
    };
    const desired: ('morning' | 'afternoon')[] = block === 'fullday' ? ['morning', 'afternoon'] : [block];

    const editing = modal?.item ?? null;
    const origStaffId = editing ? shiftStaffId(editing) : '';
    const origDate = editing ? isoToDateKey(editing.startAt) : '';

    setSaving(true);
    try {
      if (!editing) {
        await adminCreateShift({ ...base, block });
      } else if (staffId !== origStaffId || date !== origDate) {
        // Đổi nhân viên hoặc đổi ngày → hủy toàn bộ ca cũ rồi tạo mới.
        const old = liveShiftsOf(shifts, origStaffId, origDate);
        await Promise.all(old.map((s) => adminToggleShift(getId(s), 'cancelled')));
        await adminCreateShift({ ...base, block });
      } else {
        // Cùng nhân viên, cùng ngày → đối chiếu theo buổi.
        const existing = liveShiftsOf(shifts, staffId, date);
        const byBlock = new Map<'morning' | 'afternoon', Shift>();
        existing.forEach((s) => byBlock.set(blockOfShift(s.startAt), s));

        const toCancel = existing.filter((s) => !desired.includes(blockOfShift(s.startAt)));
        const toCreate = desired.filter((b) => !byBlock.has(b));
        const toUpdate = desired.filter((b) => byBlock.has(b));

        await Promise.all([
          ...toCancel.map((s) => adminToggleShift(getId(s), 'cancelled')),
          ...toCreate.map((b) => adminCreateShift({ ...base, block: b })),
          ...toUpdate.map((b) => adminUpdateShift(getId(byBlock.get(b)!), { ...base, block: b })),
        ]);
      }

      toast.success(editing ? 'Cập nhật ca trực thành công!' : 'Thêm ca trực mới thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
      setModal(null);
    } catch (err) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi.';
      toast.error(`${editing ? 'Cập nhật' : 'Thêm'} thất bại: ${m}`);
    } finally {
      setSaving(false);
    }
  };

  // Build one row per staff member for the selected date.
  const rows = useMemo<StaffRow[]>(() => {
    const dayShifts = shifts.filter((s) => isoToDateKey(s.startAt) === selectedDate);
    const byStaff = new Map<string, Shift[]>();
    dayShifts.forEach((s) => {
      const id = shiftStaffId(s);
      if (!id) return;
      byStaff.set(id, [...(byStaff.get(id) ?? []), s]);
    });

    const buildRow = (staffId: string, name: string, role: string, inRoster: boolean): StaffRow => {
      const own = (byStaff.get(staffId) ?? []).filter((s) => s.status !== 'cancelled');
      const allOwn = byStaff.get(staffId) ?? [];
      const active = own.length ? own : allOwn; // fall back to cancelled-only for display
      const stations = Array.from(new Set(active.map((s) => s.stationName).filter(Boolean))) as string[];
      return {
        staffId,
        name,
        role,
        shifts: allOwn,
        stations,
        timeRange: blockRange(active),
        status: mergeStatus(allOwn),
        inRoster,
      };
    };

    const result: StaffRow[] = staffList.map((s) =>
      buildRow(getId(s), s.fullName ?? s.name ?? 'Chưa xác định', s.role ?? '', true),
    );

    // Orphan shifts: staff not present in the roster (e.g. deactivated).
    const rosterIds = new Set(staffList.map(getId));
    byStaff.forEach((list, id) => {
      if (rosterIds.has(id)) return;
      const pop = list.find((s) => typeof s.staffId === 'object')?.staffId as PopulatedStaff | undefined;
      result.push(
        buildRow(id, pop?.fullName ?? pop?.name ?? 'Nhân viên cũ', pop?.role ?? list[0]?.shiftType ?? '', false),
      );
    });

    return result;
  }, [shifts, staffList, selectedDate]);

  // Summary stats (roster only).
  const stats = useMemo(() => {
    const roster = rows.filter((r) => r.inRoster);
    const assigned = roster.filter((r) => r.status && r.status !== 'cancelled').length;
    const working = roster.filter((r) => r.status === 'active').length;
    return { total: roster.length, assigned, unassigned: roster.length - assigned, working };
  }, [rows]);

  const stationOptions = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.stations))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const hasShift = r.status !== null && r.status !== 'cancelled';
      if (tab === 'washer' && r.role !== 'washer') return false;
      if (tab === 'cashier' && r.role !== 'cashier') return false;
      if (tab === 'unassigned' && hasShift) return false;
      if (filterRole !== 'all' && r.role !== filterRole) return false;
      if (filterStation !== 'all' && !r.stations.includes(filterStation)) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'none' ? r.status !== null : r.status !== filterStatus) return false;
      }
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, tab, filterRole, filterStation, filterStatus, search]);

  const openEdit = (row: StaffRow) => {
    const editable = row.shifts.find((s) => s.status !== 'completed' && s.status !== 'cancelled') ?? row.shifts[0];
    if (editable) setModal({ item: editable });
  };

  const cancelRow = (row: StaffRow) => {
    const scheduled = row.shifts.find((s) => s.status === 'scheduled');
    if (scheduled) toggleShift.mutate({ id: getId(scheduled), status: 'cancelled' });
  };

  const dateLabel = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const RowActions = ({ row }: { row: StaffRow }) => {
    const hasShift = row.status !== null && row.status !== 'cancelled';
    if (!hasShift) {
      return (
        <Button
          size='sm'
          variant='outline'
          onClick={() => setModal({ prefill: { staffId: row.inRoster ? row.staffId : undefined, date: selectedDate } })}
        >
          <Plus className='size-3.5' /> Phân ca
        </Button>
      );
    }
    const canEdit = row.status === 'scheduled' || row.status === 'active';
    return (
      <div className='flex items-center gap-1.5'>
        {canEdit && (
          <Button size='icon-sm' variant='outline' title='Sửa ca' onClick={() => openEdit(row)}>
            <Pencil className='size-3.5' />
          </Button>
        )}
        {row.status === 'scheduled' && (
          <Button size='icon-sm' variant='outline' title='Hủy ca' onClick={() => cancelRow(row)}>
            <Ban className='size-3.5' />
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminTopbar
        title='Phân ca làm việc'
        subtitle='Quản lý ca trực của nhân viên thu ngân và thợ rửa xe'
      />
      <main className='flex-1 overflow-y-auto bg-muted/30 p-4 md:p-8'>
        <div className='mx-auto max-w-6xl space-y-6'>
          {/* Toolbar: date + actions */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2'>
              <CalendarDays className='size-5 text-muted-foreground' />
              <div>
                <Input
                  type='date'
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || todayKey())}
                  className='h-8 w-40'
                />
              </div>
              <span className='hidden text-sm font-medium capitalize text-muted-foreground lg:inline'>
                {dateLabel}
              </span>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Làm mới
              </Button>
              <Button size='sm' onClick={() => setModal({ prefill: { date: selectedDate } })}>
                <Plus className='size-4' /> Thêm ca trực
              </Button>
            </div>
          </div>

          {/* Summary stats */}
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <StatCard icon={Users} label='Tổng nhân viên' value={stats.total} accent='bg-muted text-foreground' />
            <StatCard icon={UserCheck} label='Đã phân ca' value={stats.assigned} accent='bg-success/10 text-success' />
            <StatCard icon={UserX} label='Chưa phân ca' value={stats.unassigned} accent='bg-warning/15 text-warning' />
            <StatCard icon={Activity} label='Đang làm việc' value={stats.working} accent='bg-info/10 text-info' />
          </div>

          {/* Tabs + filters */}
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value='all'>Tất cả</TabsTrigger>
                <TabsTrigger value='washer'>Rửa xe</TabsTrigger>
                <TabsTrigger value='cashier'>Thu ngân</TabsTrigger>
                <TabsTrigger value='unassigned'>Chưa phân ca</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Tìm theo tên...'
                  className='h-8 w-44 pl-8'
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className='h-8 w-32'>
                  <SelectValue placeholder='Vai trò' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi vai trò</SelectItem>
                  <SelectItem value='washer'>Rửa xe</SelectItem>
                  <SelectItem value='cashier'>Thu ngân</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStation} onValueChange={setFilterStation}>
                <SelectTrigger className='h-8 w-32'>
                  <SelectValue placeholder='Trạm' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi trạm</SelectItem>
                  {stationOptions.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='h-8 w-36'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi trạng thái</SelectItem>
                  <SelectItem value='scheduled'>Đã lên lịch</SelectItem>
                  <SelectItem value='active'>Đang làm</SelectItem>
                  <SelectItem value='completed'>Hoàn thành</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                  <SelectItem value='none'>Chưa phân ca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-14 w-full' />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title='Không có dữ liệu phù hợp'
              description='Chưa có ca trực nào khớp với bộ lọc hiện tại. Thử đổi ngày, xóa bộ lọc hoặc thêm ca trực mới.'
            />
          ) : (
            <>
              {/* Desktop: table */}
              <div className='hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/40 hover:bg-muted/40'>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạm làm việc</TableHead>
                      <TableHead>Ca làm việc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className='text-right'>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const unassigned = row.status === null || row.status === 'cancelled';
                      return (
                        <TableRow key={row.staffId} className={unassigned ? 'bg-warning/3' : undefined}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                                {row.name.charAt(0).toUpperCase()}
                              </div>
                              <span className='font-semibold text-foreground'>{row.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={row.role} />
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {row.stations.length ? row.stations.join(', ') : <span className='text-muted-foreground/50'>—</span>}
                          </TableCell>
                          <TableCell className='text-sm tabular-nums text-foreground'>
                            {row.timeRange || <span className='text-muted-foreground/50'>—</span>}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end'>
                              <RowActions row={row} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: one card per staff */}
              <div className='grid gap-3 md:hidden'>
                {filteredRows.map((row) => (
                  <div
                    key={row.staffId}
                    className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='font-semibold leading-tight text-foreground'>{row.name}</p>
                          <div className='mt-1'>
                            <RoleBadge role={row.role} />
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground'>
                      <span className='flex items-center gap-1.5'>
                        <MapPin className='size-3.5' />
                        {row.stations.length ? row.stations.join(', ') : '—'}
                      </span>
                      <span className='flex items-center gap-1.5 tabular-nums'>
                        <Clock className='size-3.5' />
                        {row.timeRange || '—'}
                      </span>
                    </div>
                    <div className='flex justify-end border-t border-border pt-3'>
                      <RowActions row={row} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {modal !== null && (
        <ShiftModal
          item={modal.item}
          prefill={modal.prefill}
          onClose={() => setModal(null)}
          onSave={handleSave}
          staffList={staffList}
          shifts={shifts}
          saving={saving}
        />
      )}
    </>
  );
}
