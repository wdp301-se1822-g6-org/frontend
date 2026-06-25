'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, CalendarX2, SearchX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  adminGetShifts,
  adminCreateShift,
  adminUpdateShift,
  adminToggleShift,
  adminGetShiftStaff,
} from '@/lib/admin-api';
import {
  getShiftId,
  getStaffName,
  getRoleLabel,
  getShiftStatus,
  getStartMs,
  getCreatedMs,
  getCapacity,
  isWithinRange,
  STATUS_META,
  type Shift,
  type UserData,
  type DateRangeKey,
  type SortKey,
} from '@/lib/shift-helpers';
import { ShiftKpiCards } from '@/components/admin/shifts/ShiftKpiCards';
import {
  ShiftToolbar,
  type StatusFilter,
  type ShiftView,
  type RoleOption,
} from '@/components/admin/shifts/ShiftToolbar';
import { ShiftTable } from '@/components/admin/shifts/ShiftTable';
import { ShiftCard } from '@/components/admin/shifts/ShiftCard';
import {
  ShiftTableSkeleton,
  ShiftCardSkeleton,
} from '@/components/admin/shifts/ShiftSkeletons';
import { ShiftModal } from '@/components/admin/shifts/ShiftModal';
import { ShiftCancelDialog } from '@/components/admin/shifts/ShiftCancelDialog';

export default function AdminShiftsPage() {
  const qc = useQueryClient();

  // Modal & dialog state
  const [editShift, setEditShift] = useState<Shift | null | false>(false);
  const [cancelTarget, setCancelTarget] = useState<Shift | null>(null);

  // Filter / view state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeKey>('all');
  const [sort, setSort] = useState<SortKey>('soonest');
  const [view, setView] = useState<ShiftView>('table');

  // Danh sách Shifts
  const {
    data: shiftsRes,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-shifts'],
    queryFn: () => adminGetShifts({ limit: 100 }),
  });

  // Danh sách nhân viên (washers & cashiers) để gán ca
  const { data: usersRes } = useQuery({
    queryKey: ['admin-shifts-staff'],
    queryFn: async (): Promise<UserData[]> => {
      const res = await adminGetShiftStaff();
      return (res.data?.data ?? res.data ?? []) as UserData[];
    },
  });

  const shifts: Shift[] = useMemo(
    () => shiftsRes?.data?.data ?? shiftsRes?.data ?? [],
    [shiftsRes],
  );
  const staffList: UserData[] = useMemo(() => usersRes ?? [], [usersRes]);

  // ─── Mutations (API contract giữ nguyên) ──────────────────────────
  const createShift = useMutation({
    mutationFn: adminCreateShift,
    onSuccess: () => {
      toast.success('Thêm ca trực nhân viên mới thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
      setEditShift(false);
    },
    onError: (err: unknown) => {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đã xảy ra lỗi khi tạo ca trực.';
      toast.error(`Thêm thất bại: ${errMsg}`);
    },
  });

  const updateShift = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminUpdateShift(id, data),
    onSuccess: () => {
      toast.success('Cập nhật ca trực nhân viên thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
      setEditShift(false);
    },
    onError: (err: unknown) => {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đã xảy ra lỗi khi cập nhật ca trực.';
      toast.error(`Cập nhật thất bại: ${errMsg}`);
    },
  });

  const toggleShift = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminToggleShift(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái ca trực thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
    },
    onError: (err: unknown) => {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể cập nhật trạng thái ca trực.';
      toast.error(`Lỗi: ${errMsg}`);
    },
  });

  const handleSave = (d: Record<string, unknown>) => {
    if (editShift && (editShift as Shift)._id) {
      updateShift.mutate({ id: (editShift as Shift)._id!, data: d });
    } else {
      createShift.mutate(d);
    }
  };

  const handleSetStatus = (shift: Shift, status: string) => {
    toggleShift.mutate({ id: getShiftId(shift), status });
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    toggleShift.mutate(
      { id: getShiftId(cancelTarget), status: 'cancelled' },
      { onSuccess: () => setCancelTarget(null) },
    );
  };

  // ─── Role filter options (dynamic từ data) ────────────────────────
  const roleOptions: RoleOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const s of shifts) if (s.shiftType) set.add(s.shiftType);
    return [
      { value: 'all', label: 'Tất cả vai trò' },
      ...Array.from(set).map((t) => ({ value: t, label: getRoleLabel(t) })),
    ];
  }, [shifts]);

  // ─── Lọc + sắp xếp ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const list = shifts.filter((s) => {
      const status = getShiftStatus(s);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (roleFilter !== 'all' && s.shiftType !== roleFilter) return false;
      if (!isWithinRange(s, dateRange)) return false;
      if (term) {
        const haystack = [
          getStaffName(s, staffList) ?? '',
          getRoleLabel(s.shiftType),
          s.stationName ?? '',
          s.note ?? '',
          STATUS_META[status].label,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sort === 'soonest') return getStartMs(a) - getStartMs(b);
      if (sort === 'newest') return getCreatedMs(b) - getCreatedMs(a);
      return getCapacity(b).ratio - getCapacity(a).ratio;
    });
  }, [shifts, staffList, statusFilter, roleFilter, dateRange, search, sort]);

  const hasFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    dateRange !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setDateRange('all');
  };

  const cardGrid = (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {filtered.map((shift) => (
        <ShiftCard
          key={getShiftId(shift)}
          shift={shift}
          staffList={staffList}
          onEdit={(s) => setEditShift(s)}
          onCancelRequest={(s) => setCancelTarget(s)}
          onSetStatus={handleSetStatus}
        />
      ))}
    </div>
  );

  return (
    <>
      <AdminTopbar
        title='Phân ca làm việc'
        subtitle='Quản lý lịch làm, trạng thái ca và phân bổ nhân sự'
      />

      <main className='flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8'>
        <div className='mx-auto flex max-w-7xl flex-col gap-5'>
          {/* Header / actions */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='font-heading text-lg font-bold text-foreground'>
                Danh sách ca làm việc
              </h2>
              <p className='mt-0.5 text-sm text-muted-foreground'>
                Theo dõi lịch làm, trạng thái và sức chứa của từng ca.
              </p>
            </div>
            <div className='flex items-center gap-2.5'>
              <Button
                variant='outline'
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={isRefetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
              <Button onClick={() => setEditShift(null)}>
                <Plus />
                Thêm ca làm việc
              </Button>
            </div>
          </div>

          {/* KPI summary */}
          <ShiftKpiCards shifts={shifts} loading={isLoading} />

          {/* Toolbar */}
          <ShiftToolbar
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            role={roleFilter}
            onRoleChange={setRoleFilter}
            roleOptions={roleOptions}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            resultCount={filtered.length}
            totalCount={shifts.length}
          />

          {/* Content */}
          {isLoading ? (
            view === 'table' ? (
              <>
                <div className='hidden md:block'>
                  <ShiftTableSkeleton />
                </div>
                <div className='md:hidden'>
                  <ShiftCardSkeleton />
                </div>
              </>
            ) : (
              <ShiftCardSkeleton />
            )
          ) : isError ? (
            <EmptyState
              icon={AlertCircle}
              title='Không tải được danh sách ca'
              description='Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.'
              action={
                <Button variant='outline' onClick={() => refetch()}>
                  <RefreshCw />
                  Thử lại
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={SearchX}
                title='Không có ca nào khớp bộ lọc'
                description='Thử thay đổi từ khoá hoặc bộ lọc để xem thêm ca làm việc.'
                action={
                  <Button variant='outline' onClick={resetFilters}>
                    Xoá bộ lọc
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={CalendarX2}
                title='Chưa có ca làm việc nào'
                description='Bắt đầu bằng cách phân ca trực đầu tiên cho nhân viên.'
                action={
                  <Button onClick={() => setEditShift(null)}>
                    <Plus />
                    Thêm ca làm việc
                  </Button>
                }
              />
            )
          ) : view === 'table' ? (
            <>
              {/* Desktop: bảng — Mobile: thẻ */}
              <div className='hidden md:block'>
                <ShiftTable
                  shifts={filtered}
                  staffList={staffList}
                  onEdit={(s) => setEditShift(s)}
                  onCancelRequest={(s) => setCancelTarget(s)}
                  onSetStatus={handleSetStatus}
                />
              </div>
              <div className='md:hidden'>{cardGrid}</div>
            </>
          ) : (
            cardGrid
          )}
        </div>
      </main>

      {/* Create / Edit modal */}
      {editShift !== false && (
        <ShiftModal
          item={editShift}
          onClose={() => setEditShift(false)}
          onSave={handleSave}
          staffList={staffList}
          isPending={createShift.isPending || updateShift.isPending}
        />
      )}

      {/* Cancel confirm */}
      <ShiftCancelDialog
        shift={cancelTarget}
        staffList={staffList}
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirm}
        isPending={toggleShift.isPending}
      />
    </>
  );
}
