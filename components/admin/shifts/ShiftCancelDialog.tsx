'use client';

import { AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  getStaffName,
  getRoleLabel,
  formatTimeRange,
  type Shift,
  type UserData,
} from '@/lib/shift-helpers';

type ShiftCancelDialogProps = {
  shift: Shift | null;
  staffList: UserData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
};

/** Modal xác nhận trước khi hủy ca (thao tác nguy hiểm, khó hoàn tác). */
export function ShiftCancelDialog({
  shift,
  staffList,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ShiftCancelDialogProps) {
  const staffName = shift ? getStaffName(shift, staffList) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
            <AlertTriangle className='size-5' />
          </div>
          <DialogTitle>Hủy ca làm việc?</DialogTitle>
          <DialogDescription>
            Bạn sắp hủy ca{' '}
            <span className='font-semibold text-foreground'>
              {getRoleLabel(shift?.shiftType)}
            </span>{' '}
            của{' '}
            <span className='font-semibold text-foreground'>
              {staffName ?? 'nhân viên chưa phân'}
            </span>
            {shift?.startAt && (
              <>
                {' '}
                ({formatTimeRange(shift.startAt, shift.endAt)})
              </>
            )}
            . Ca đã hủy sẽ không còn nhận lịch. Thao tác này khó hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='mt-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Giữ lại
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            Xác nhận hủy ca
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
