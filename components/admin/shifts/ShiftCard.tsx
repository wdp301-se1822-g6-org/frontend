'use client';

import { User, MapPin, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  getStaffName,
  getInitial,
  getRoleLabel,
  getRoleBadgeClass,
  getShiftStatus,
  formatTimeRange,
  formatDuration,
  shiftNeedsAttention,
  STATUS_META,
  type Shift,
  type UserData,
} from '@/lib/shift-helpers';
import { ShiftStatusBadge } from './ShiftStatusBadge';
import { ShiftCapacityBar } from './ShiftCapacityBar';
import { ShiftActionsMenu } from './ShiftActionsMenu';

type ShiftCardProps = {
  shift: Shift;
  staffList: UserData[];
  onEdit: (shift: Shift) => void;
  onCancelRequest: (shift: Shift) => void;
};

export function ShiftCard({
  shift,
  staffList,
  onEdit,
  onCancelRequest,
}: ShiftCardProps) {
  const status = getShiftStatus(shift);
  const meta = STATUS_META[status];
  const staffName = getStaffName(shift, staffList);
  const needsAttention = shiftNeedsAttention(shift);
  const isClosed = status === 'cancelled' || status === 'completed';
  const duration = formatDuration(shift.startAt, shift.endAt);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-l-4 border-border border-l-transparent bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        needsAttention && cn('border-warning/40 bg-warning/[0.04]', meta.accentBorder),
        isClosed && 'opacity-70',
      )}
    >
      {/* Top: role + status + actions */}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
              getRoleBadgeClass(shift.shiftType),
            )}
          >
            {getRoleLabel(shift.shiftType)}
          </span>
          <ShiftStatusBadge status={status} />
        </div>
        <ShiftActionsMenu
          shift={shift}
          onEdit={onEdit}
          onCancelRequest={onCancelRequest}
        />
      </div>

      {/* Staff */}
      <div className='flex items-center gap-2.5'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
          {staffName ? getInitial(staffName) : <User className='size-4' />}
        </div>
        <span
          className={cn(
            'text-sm font-semibold',
            staffName ? 'text-foreground' : 'italic text-muted-foreground',
          )}
        >
          {staffName ?? 'Chưa phân nhân viên'}
        </span>
      </div>

      {/* Time + location */}
      <div className='flex flex-col gap-1.5 text-sm text-foreground'>
        <div className='flex items-center gap-2'>
          <Clock className='size-4 shrink-0 text-muted-foreground' />
          <span>{formatTimeRange(shift.startAt, shift.endAt)}</span>
          {duration && (
            <span className='text-xs text-muted-foreground'>· {duration}</span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <MapPin className='size-4 shrink-0 text-muted-foreground' />
          {shift.stationName ?? (
            <span className='italic text-muted-foreground'>Chưa có địa điểm</span>
          )}
        </div>
      </div>

      {/* Capacity */}
      <div className='border-t border-border pt-3'>
        <ShiftCapacityBar shift={shift} className='min-w-0' />
      </div>

      {/* Note (dòng phụ, không nổi bật hơn trạng thái) */}
      {shift.note && (
        <p className='line-clamp-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground'>
          {shift.note}
        </p>
      )}
    </div>
  );
}
