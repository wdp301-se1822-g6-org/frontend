'use client';

import { User, MapPin } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  getShiftId,
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

type ShiftTableProps = {
  shifts: Shift[];
  staffList: UserData[];
  onEdit: (shift: Shift) => void;
  onCancelRequest: (shift: Shift) => void;
  onSetStatus: (shift: Shift, status: string) => void;
};

export function ShiftTable({
  shifts,
  staffList,
  onEdit,
  onCancelRequest,
  onSetStatus,
}: ShiftTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableHead className='pl-4'>Nhân sự</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Địa điểm</TableHead>
            <TableHead>Sức chứa</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className='pr-3 text-right'>
              <span className='sr-only'>Thao tác</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const id = getShiftId(shift);
            const status = getShiftStatus(shift);
            const meta = STATUS_META[status];
            const staffName = getStaffName(shift, staffList);
            const needsAttention = shiftNeedsAttention(shift);
            const isClosed = status === 'cancelled' || status === 'completed';
            const duration = formatDuration(shift.startAt, shift.endAt);

            return (
              <TableRow
                key={id}
                className={cn(
                  needsAttention && 'bg-warning/[0.04]',
                  isClosed && 'opacity-65',
                )}
              >
                {/* Nhân sự */}
                <TableCell
                  className={cn(
                    'border-l-4 border-l-transparent pl-4',
                    needsAttention && meta.accentBorder,
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                      {staffName ? getInitial(staffName) : <User className='size-4' />}
                    </div>
                    <span
                      className={cn(
                        'font-semibold',
                        staffName ? 'text-foreground' : 'italic text-muted-foreground',
                      )}
                    >
                      {staffName ?? 'Chưa phân nhân viên'}
                    </span>
                  </div>
                </TableCell>

                {/* Vai trò */}
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                      getRoleBadgeClass(shift.shiftType),
                    )}
                  >
                    {getRoleLabel(shift.shiftType)}
                  </span>
                </TableCell>

                {/* Thời gian */}
                <TableCell>
                  <div className='text-sm font-medium text-foreground'>
                    {formatTimeRange(shift.startAt, shift.endAt)}
                  </div>
                  {duration && (
                    <div className='mt-0.5 text-xs text-muted-foreground'>{duration}</div>
                  )}
                </TableCell>

                {/* Địa điểm */}
                <TableCell>
                  <div className='flex items-center gap-1.5 text-sm text-foreground'>
                    <MapPin className='size-3.5 shrink-0 text-muted-foreground' />
                    {shift.stationName ?? (
                      <span className='italic text-muted-foreground'>Chưa có địa điểm</span>
                    )}
                  </div>
                </TableCell>

                {/* Sức chứa */}
                <TableCell>
                  <ShiftCapacityBar shift={shift} />
                </TableCell>

                {/* Trạng thái */}
                <TableCell>
                  <ShiftStatusBadge status={status} />
                </TableCell>

                {/* Thao tác */}
                <TableCell className='pr-3 text-right'>
                  <ShiftActionsMenu
                    shift={shift}
                    onEdit={onEdit}
                    onCancelRequest={onCancelRequest}
                    onSetStatus={onSetStatus}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
