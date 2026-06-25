'use client';

import {
  MoreVertical,
  Pencil,
  Play,
  CheckCircle2,
  Ban,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Shift } from '@/lib/shift-helpers';

type ShiftActionsMenuProps = {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  /** Mở modal xác nhận trước khi hủy ca (thao tác nguy hiểm). */
  onCancelRequest: (shift: Shift) => void;
  /** Chuyển trạng thái ca qua endpoint toggle hiện có (active/completed…). */
  onSetStatus: (shift: Shift, status: string) => void;
};

/**
 * Menu thao tác dạng dấu ba chấm — gom Sửa / chuyển trạng thái / Hủy ca,
 * hiển thị item theo trạng thái thực tế của ca.
 */
export function ShiftActionsMenu({
  shift,
  onEdit,
  onCancelRequest,
  onSetStatus,
}: ShiftActionsMenuProps) {
  const raw = shift.status;
  const isClosed = raw === 'cancelled' || raw === 'completed';
  const canEdit = !isClosed;
  const canStart = raw === 'scheduled';
  const canComplete = raw === 'active';
  const canCancel = !isClosed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Mở menu thao tác ca'
          title='Thao tác'
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {canEdit && (
          <DropdownMenuItem onSelect={() => onEdit(shift)}>
            <Pencil />
            Sửa ca
          </DropdownMenuItem>
        )}
        {canStart && (
          <DropdownMenuItem onSelect={() => onSetStatus(shift, 'active')}>
            <Play />
            Bắt đầu ca
          </DropdownMenuItem>
        )}
        {canComplete && (
          <DropdownMenuItem onSelect={() => onSetStatus(shift, 'completed')}>
            <CheckCircle2 />
            Hoàn thành ca
          </DropdownMenuItem>
        )}
        {canCancel && (canEdit || canStart || canComplete) && (
          <DropdownMenuSeparator />
        )}
        {canCancel ? (
          <DropdownMenuItem
            variant='destructive'
            onSelect={() => onCancelRequest(shift)}
          >
            <Ban />
            Hủy ca
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>Không có thao tác</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
