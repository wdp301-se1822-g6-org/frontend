'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Shift, UserData } from '@/lib/shift-helpers';

type ShiftModalProps = {
  item?: Shift | null;
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  staffList: UserData[];
  isPending?: boolean;
};

const fieldLabelCls =
  'block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/30';
const selectCls = `${fieldCls} cursor-pointer`;

export function ShiftModal({ item, onClose, onSave, staffList, isPending }: ShiftModalProps) {
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

  const [form, setForm] = useState({
    staffId:
      typeof item?.staffId === 'object'
        ? item?.staffId?._id ?? item?.staffId?.id ?? ''
        : item?.staffId ?? '',
    shiftType: item?.shiftType ?? 'washer',
    stationName: item?.stationName ?? 'Bay 1',
    date: formatDateForInput(item?.startAt) || formatDateForInput(new Date().toISOString()),
    block: getBlockFromTimes(item?.startAt, item?.endAt),
    note: item?.note ?? '',
  });

  const minDate = !item ? formatDateForInput(new Date().toISOString()) : undefined;

  // Tự động cập nhật shiftType tương ứng khi chọn staffId
  const handleStaffChange = (staffId: string) => {
    setForm((prev) => {
      const selectedStaff = staffList.find((s) => (s._id ?? s.id) === staffId);
      if (
        staffId &&
        selectedStaff &&
        (selectedStaff.role === 'washer' || selectedStaff.role === 'cashier')
      ) {
        return { ...prev, staffId, shiftType: selectedStaff.role as 'washer' | 'cashier' };
      }
      return { ...prev, staffId };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffId) {
      toast.error('Vui lòng chọn nhân viên ca trực.');
      return;
    }
    if (!form.date) {
      toast.error('Vui lòng chọn ngày trực.');
      return;
    }

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
            {item ? 'Sửa ca trực nhân viên' : 'Thêm ca trực mới'}
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
          {/* Chọn nhân viên */}
          <div>
            <label className={fieldLabelCls}>Nhân viên ca trực</label>
            <select
              value={form.staffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className={selectCls}
            >
              <option value=''>-- Chọn nhân viên --</option>
              {staffList.map((s) => {
                const sId = s._id ?? s.id ?? '';
                return (
                  <option key={sId} value={sId}>
                    {s.fullName ?? s.name} ({s.role === 'washer' ? 'Rửa xe' : 'Thu ngân'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Loại ca (Shift Type) */}
          <div>
            <label className={fieldLabelCls}>Loại ca làm việc</label>
            <select
              value={form.shiftType}
              onChange={(e) =>
                setForm({ ...form, shiftType: e.target.value as 'washer' | 'cashier' })
              }
              className={selectCls}
            >
              <option value='washer'>Nhân viên rửa xe (Washer)</option>
              <option value='cashier'>Thu ngân (Cashier)</option>
            </select>
          </div>

          {/* Tên trạm làm việc */}
          <div>
            <label className={fieldLabelCls}>Tên trạm / Bãi làm việc</label>
            <input
              type='text'
              value={form.stationName}
              onChange={(e) => setForm({ ...form, stationName: e.target.value })}
              placeholder='Ví dụ: Bay 1, Quầy thu ngân'
              className={fieldCls}
            />
          </div>

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
              <option value='morning'>Sáng (Morning)</option>
              <option value='afternoon'>Chiều (Afternoon)</option>
              <option value='fullday'>Cả ngày (Full day)</option>
            </select>
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
            Lưu ca trực
          </Button>
        </div>
      </form>
    </div>
  );
}
