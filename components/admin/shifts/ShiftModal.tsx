'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Shift } from '@/lib/shift-helpers';

type ShiftModalProps = {
  item?: Shift | null;
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  isPending?: boolean;
};

const fieldLabelCls =
  'block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/30';
const selectCls = `${fieldCls} cursor-pointer`;

// Giờ cố định của từng block (khớp BUSINESS_HOUR_WINDOWS phía BE).
const BLOCK_HOURS: Record<'morning' | 'afternoon', { start: number; end: number }> = {
  morning: { start: 8, end: 12 },
  afternoon: { start: 14, end: 17 },
};

/** Block đã kết thúc chưa, tính theo ngày được chọn (giờ máy admin ~ giờ VN). */
const isBlockEnded = (dateStr: string, block: 'morning' | 'afternoon') => {
  if (!dateStr) return false;
  const end = new Date(`${dateStr}T00:00:00`);
  end.setHours(BLOCK_HOURS[block].end, 0, 0, 0);
  return end.getTime() <= Date.now();
};

// Form tạo/sửa ca theo contract mới: { date, block, capacity?, note? }.
// Ca không còn gắn nhân viên/trạm khi tạo — BE tự phân bổ.
export function ShiftModal({ item, onClose, onSave, isPending }: ShiftModalProps) {
  const getBlockFromTimes = (
    startStr?: string,
    endStr?: string,
  ): 'morning' | 'afternoon' | 'fullday' => {
    if (!startStr) return 'morning';
    const date = new Date(startStr);
    const hour = date.getHours();
    if (hour < 12) {
      if (endStr) {
        const endDate = new Date(endStr);
        const endHour = endDate.getHours();
        if (endHour - hour > 6) return 'fullday';
      }
      return 'morning';
    }
    return 'afternoon';
  };

  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const today = formatDateForInput(new Date().toISOString());
  // Ca mới mặc định vào block còn hiệu lực gần nhất của hôm nay.
  const defaultBlock = item
    ? getBlockFromTimes(item.startAt, item.endAt)
    : isBlockEnded(today, 'morning')
      ? 'afternoon'
      : 'morning';

  const initialCapacity = item?.capacity ?? item?.maxBookings;

  const [form, setForm] = useState({
    date: formatDateForInput(item?.startAt) || today,
    block: defaultBlock,
    capacity: typeof initialCapacity === 'number' ? String(initialCapacity) : '',
    note: item?.note ?? '',
  });

  const minDate = !item ? formatDateForInput(new Date().toISOString()) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) {
      toast.error('Vui lòng chọn ngày làm việc.');
      return;
    }

    const capacityRaw = form.capacity.trim();
    const capacity = capacityRaw === '' ? undefined : Number(capacityRaw);
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
      toast.error('Sức chứa phải là số nguyên dương.');
      return;
    }

    // Chặn tạo ca cho block đã kết thúc (BE cũng chặn từng block, all-or-nothing).
    const blocksToCheck: Array<'morning' | 'afternoon'> =
      form.block === 'fullday' ? ['morning', 'afternoon'] : [form.block];
    const ended = blocksToCheck.filter((b) => isBlockEnded(form.date, b));
    if (ended.length > 0) {
      toast.error(
        form.block === 'fullday' && ended.length === 1
          ? 'Ca sáng hôm nay đã kết thúc — hãy chọn riêng ca chiều thay vì cả ngày.'
          : 'Khung giờ này đã kết thúc. Vui lòng chọn ca còn hiệu lực.',
      );
      return;
    }

    onSave({
      date: form.date,
      block: form.block,
      ...(capacity !== undefined ? { capacity } : {}),
      note: form.note,
    });
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className='flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl duration-150 animate-in fade-in zoom-in-95'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-border pb-3'>
          <h3 className='font-heading text-lg font-bold text-foreground'>
            {item ? 'Sửa ca làm việc' : 'Thêm ca làm việc mới'}
          </h3>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng'
            className='rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <X className='size-5' />
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          {/* Ngày trực */}
          <div>
            <label className={fieldLabelCls}>Ngày làm việc</label>
            <input
              type='date'
              min={minDate}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={fieldCls}
            />
          </div>

          {/* Ca làm (block) */}
          <div>
            <label className={fieldLabelCls}>Ca làm việc</label>
            <select
              value={form.block}
              onChange={(e) =>
                setForm({
                  ...form,
                  block: e.target.value as 'morning' | 'afternoon' | 'fullday',
                })
              }
              className={selectCls}
            >
              <option value='morning' disabled={isBlockEnded(form.date, 'morning')}>
                Sáng (08:00 – 12:00)
                {isBlockEnded(form.date, 'morning') ? ' — đã qua' : ''}
              </option>
              <option value='afternoon' disabled={isBlockEnded(form.date, 'afternoon')}>
                Chiều (14:00 – 17:00)
                {isBlockEnded(form.date, 'afternoon') ? ' — đã qua' : ''}
              </option>
              <option value='fullday' disabled={isBlockEnded(form.date, 'morning')}>
                Cả ngày (08:00 – 12:00 & 14:00 – 17:00)
                {isBlockEnded(form.date, 'morning') ? ' — sáng đã qua' : ''}
              </option>
            </select>
            <p className='mt-1 text-[11px] text-muted-foreground'>
              Cả ngày tạo 2 ca riêng: sáng và chiều (nghỉ trưa 12:00 – 14:00).
            </p>
          </div>

          {/* Sức chứa */}
          <div>
            <label className={fieldLabelCls}>Sức chứa (số xe tối đa)</label>
            <input
              type='number'
              min={1}
              step={1}
              inputMode='numeric'
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder='Bỏ trống để dùng mặc định của hệ thống'
              className={fieldCls}
            />
            <p className='mt-1 text-[11px] text-muted-foreground'>
              Số xe tối đa ca này có thể nhận. Bỏ trống nếu không giới hạn riêng.
            </p>
          </div>

          {/* Ghi chú */}
          <div>
            <label className={fieldLabelCls}>Ghi chú / Mô tả</label>
            <input
              type='text'
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder='Ghi chú ca trực...'
              className={fieldCls}
            />
          </div>
        </div>

        <div className='mt-2 flex gap-3 border-t border-border pt-4'>
          <Button type='button' variant='outline' className='flex-1' onClick={onClose}>
            Huỷ
          </Button>
          <Button type='submit' className='flex-1' disabled={isPending}>
            {isPending && <Spinner />}
            Lưu ca làm việc
          </Button>
        </div>
      </form>
    </div>
  );
}
