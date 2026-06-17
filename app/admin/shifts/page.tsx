'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  adminGetShifts,
  adminCreateShift,
  adminUpdateShift,
  adminToggleShift,
  adminGetShiftStaff
} from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Power, X, Clock, User, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  maxBookings?: number;
  currentBookings?: number;
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

const getMockFeedback = (staffId?: string) => {
  if (!staffId) return { rating: 5.0, count: 0 };
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = staffId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.0 + (Math.abs(hash % 11) / 10);
  const count = 5 + Math.abs(hash % 45);
  return { rating: Number(rating.toFixed(1)), count };
};

function ShiftModal({
  item,
  onClose,
  onSave,
  staffList,
}: {
  item?: Shift | null;
  onClose: () => void;
  onSave: (d: Record<string, unknown>) => void;
  staffList: UserData[];
}) {
  // Format ISO string to datetime-local string (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [form, setForm] = useState({
    staffId: typeof item?.staffId === 'object' ? item?.staffId?._id ?? item?.staffId?.id ?? '' : item?.staffId ?? '',
    shiftType: item?.shiftType ?? 'washer',
    stationName: item?.stationName ?? 'Bay 1',
    startAt: formatForInput(item?.startAt),
    endAt: formatForInput(item?.endAt),
    maxBookings: item?.maxBookings ?? 10,
    note: item?.note ?? '',
  });

  const minDateTime = !item ? formatForInput(new Date().toISOString()) : undefined;

  // Tự động cập nhật shiftType tương ứng khi chọn staffId
  const handleStaffChange = (staffId: string) => {
    setForm((prev) => {
      const selectedStaff = staffList.find((s) => (s._id ?? s.id) === staffId);
      if (staffId && selectedStaff && (selectedStaff.role === 'washer' || selectedStaff.role === 'cashier')) {
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
    if (!form.startAt || !form.endAt) {
      toast.error('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.');
      return;
    }

    // Mở khóa cho phép admin tự do gán ca làm việc tùy thích

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);
    
    // Chỉ chặn thời gian quá khứ đối với ca tạo mới
    if (!item && start < new Date()) {
      toast.error('Thời gian bắt đầu không được ở trong quá khứ.');
      return;
    }

    if (start >= end) {
      toast.error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
      return;
    }

    onSave({
      staffId: form.staffId,
      shiftType: form.shiftType,
      stationName: form.stationName,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      maxBookings: Number(form.maxBookings),
      note: form.note,
    });
  };

  return (
    <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className='bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5 max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
          <h3 className='font-heading font-black text-slate-800 text-lg'>{item ? 'Sửa ca trực nhân viên' : 'Thêm ca trực mới'}</h3>
          <button type='button' onClick={onClose}>
            <X className='w-5 h-5 text-slate-500 hover:text-slate-600' />
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          {/* Chọn nhân viên */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Nhân viên ca trực</label>
            <select
              value={form.staffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 bg-white font-semibold text-slate-700 shadow-sm cursor-pointer'
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
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Loại ca làm việc</label>
            <select
              value={form.shiftType}
              onChange={(e) => setForm({ ...form, shiftType: e.target.value as 'washer' | 'cashier' })}
              className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 bg-white font-semibold text-slate-700 shadow-sm cursor-pointer'
            >
              <option value='washer'>Nhân viên rửa xe (Washer)</option>
              <option value='cashier'>Thu ngân (Cashier)</option>
            </select>
          </div>

          {/* Tên trạm làm việc (Station Name) */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Tên trạm / Bãi làm việc</label>
            <input
              type='text'
              value={form.stationName}
              onChange={(e) => setForm({ ...form, stationName: e.target.value })}
              placeholder='Ví dụ: Bay 1, Quầy thu ngân'
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 shadow-sm text-slate-700 font-semibold'
            />
          </div>

          {/* Giờ bắt đầu (startAt) */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Thời gian bắt đầu</label>
            <input
              type='datetime-local'
              min={minDateTime}
              value={form.startAt}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setForm({ ...form, startAt: val });
                } else if (!item && minDateTime && val < minDateTime) {
                  setForm({ ...form, startAt: minDateTime });
                } else {
                  setForm({ ...form, startAt: val });
                }
              }}
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 shadow-sm text-slate-700 font-semibold'
            />
          </div>

          {/* Giờ kết thúc (endAt) */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Thời gian kết thúc</label>
            <input
              type='datetime-local'
              min={form.startAt || minDateTime}
              value={form.endAt}
              onChange={(e) => {
                const val = e.target.value;
                const currentMin = form.startAt || minDateTime;
                if (val === "") {
                  setForm({ ...form, endAt: val });
                } else if (!item && currentMin && val < currentMin) {
                  setForm({ ...form, endAt: currentMin });
                } else {
                  setForm({ ...form, endAt: val });
                }
              }}
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 shadow-sm text-slate-700 font-semibold'
            />
          </div>

          {/* Tối đa booking */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Giới hạn đặt lịch tối đa</label>
            <input
              type='number'
              min={1}
              value={form.maxBookings}
              onChange={(e) => setForm({ ...form, maxBookings: Number(e.target.value) })}
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 shadow-sm text-slate-700 font-semibold'
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Ghi chú / Mô tả</label>
            <input
              type='text'
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder='Ghi chú ca trực...'
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 shadow-sm text-slate-700 font-semibold'
            />
          </div>
        </div>

        <div className='flex gap-3 mt-4 border-t border-slate-100 pt-4'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm'
          >
            Huỷ
          </button>
          <button
            type='submit'
            className='flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10'
          >
            Lưu ca trực
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminShiftsPage() {
  const qc = useQueryClient();
  const [editShift, setEditShift] = useState<Shift | null | false>(false);

  // Lấy danh sách Shifts (StaffShifts)
  const { data: shiftsRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-shifts'],
    queryFn: () => adminGetShifts({ limit: 100 }),
  });

  // Danh sách nhân viên (washers & cashiers) để gán ca - dùng endpoint riêng
  // mà cả manager lẫn admin đều gọi được (trả về id THẬT, active).
  const { data: usersRes } = useQuery({
    queryKey: ['admin-shifts-staff'],
    queryFn: async (): Promise<UserData[]> => {
      const res = await adminGetShiftStaff();
      return (res.data?.data ?? res.data ?? []) as UserData[];
    },
  });

  const shifts: Shift[] = shiftsRes?.data?.data ?? shiftsRes?.data ?? [];
  const staffList: UserData[] = usersRes ?? [];

  const createShift = useMutation({
    mutationFn: adminCreateShift,
    onSuccess: () => {
      toast.success('Thêm ca trực nhân viên mới thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
      setEditShift(false);
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi tạo ca trực.';
      toast.error(`Thêm thất bại: ${errMsg}`);
    }
  });

  const updateShift = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateShift(id, data),
    onSuccess: () => {
      toast.success('Cập nhật ca trực nhân viên thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
      setEditShift(false);
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Đã xảy ra lỗi khi cập nhật ca trực.';
      toast.error(`Cập nhật thất bại: ${errMsg}`);
    }
  });

  const toggleShift = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminToggleShift(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái ca trực thành công!');
      qc.invalidateQueries({ queryKey: ['admin-shifts'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể cập nhật trạng thái ca trực.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  const handleSave = (d: Record<string, unknown>) => {
    if (editShift && (editShift as Shift)._id) {
      updateShift.mutate({ id: (editShift as Shift)._id!, data: d });
    } else {
      createShift.mutate(d);
    }
  };

  return (
    <>
      <AdminTopbar title='Phân ca làm việc' subtitle='Quản lý ca trực làm việc thực tế của nhân viên thu ngân và thợ rửa xe' />
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-6xl mx-auto'>
          
          {/* Header Action */}
          <div className='flex items-center justify-between mb-8 border-b border-slate-200/60 pb-3'>
            <h2 className='font-heading font-black text-slate-800 text-base'>Danh sách ca trực hoạt động</h2>
            <div className='flex gap-2.5'>
              <button
                onClick={() => refetch()}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:border-slate-300 transition-all shadow-sm'
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Làm mới
              </button>
              <button
                onClick={() => setEditShift(null)}
                className='flex items-center gap-2 bg-indigo-600 text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10'
              >
                <Plus className='w-4 h-4' />Thêm ca trực nhân viên
              </button>
            </div>
          </div>

          {/* Shifts grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-36 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-sm' />
              ))
            ) : shifts.length === 0 ? (
              <div className='col-span-full py-20 text-center text-slate-500 font-semibold bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto w-full'>
                Chưa có ca làm việc nào của nhân viên được phân công.
              </div>
            ) : (
              shifts.map((s) => {
                const id = s._id ?? s.id ?? '';
                const staffIdStr = typeof s.staffId === 'object' ? s.staffId?._id ?? s.staffId?.id : s.staffId;
                const staffUser = staffList.find((u) => (u._id ?? u.id) === staffIdStr);
                const staffName = staffUser?.fullName ?? staffUser?.name ?? (typeof s.staffId === 'object' ? s.staffId?.fullName ?? s.staffId?.name : '') ?? 'Chưa xác định';
                const startTime = s.startAt ? new Date(s.startAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-';
                const endTime = s.endAt ? new Date(s.endAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-';
                const isCancelled = s.status === 'cancelled';
                const isActive = s.status === 'active';

                return (
                  <div
                    key={id}
                    className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
                      isCancelled ? 'border-slate-100 bg-slate-50/50 opacity-70' :
                      isActive ? 'border-indigo-100 ring-2 ring-indigo-500/5' :
                      'border-slate-100/80'
                    }`}
                  >
                    <div className='flex flex-col gap-2.5'>
                      {/* Name & status badge */}
                      <div className='flex items-center justify-between'>
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                          s.shiftType === 'washer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {s.shiftType === 'washer' ? 'Rửa xe' : 'Thu ngân'}
                        </span>
                        
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          s.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                          s.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {s.status === 'active' ? 'Đang chạy' :
                           s.status === 'completed' ? 'Hoàn thành' :
                           s.status === 'cancelled' ? 'Đã hủy' : 'Đã lên lịch'}
                        </span>
                      </div>

                      {/* Staff user name */}
                      <div className='flex items-center gap-1.5 text-slate-800 font-bold mt-1.5'>
                        <User className='w-4 h-4 text-slate-500 shrink-0' />
                        {staffName}
                      </div>

                      {/* Rating & Feedback */}
                      {s.shiftType === 'washer' && (
                        <div className='flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-lg border border-amber-100/50 w-fit'>
                          <span>⭐ {getMockFeedback(staffIdStr).rating}</span>
                          <span className='text-slate-300'>|</span>
                          <span className='text-slate-500'>{getMockFeedback(staffIdStr).count} đánh giá</span>
                        </div>
                      )}

                      {/* Station details */}
                      <div className='flex items-center gap-1.5 text-slate-500 text-xs font-medium'>
                        <MapPin className='w-3.5 h-3.5 text-slate-500 shrink-0' />
                        Trạm trực: <span className='font-bold text-slate-700'>{s.stationName ?? 'Chưa xác định'}</span>
                      </div>

                      {/* Work time */}
                      <div className='flex items-center gap-1.5 text-slate-500 text-xs font-medium'>
                        <Clock className='w-3.5 h-3.5 text-slate-500 shrink-0' />
                        {startTime} – {endTime}
                      </div>
                      
                      {/* Note */}
                      {s.note && (
                        <div className='text-[11px] text-slate-500 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100/50 mt-1 italic'>
                          &quot;{s.note}&quot;
                        </div>
                      )}
                    </div>

                    {/* Operational Actions */}
                    <div className='border-t border-slate-100 pt-3 flex items-center justify-between mt-1'>
                      <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wide'>
                        Khả dụng: <span className='font-black text-slate-800'>{s.currentBookings ?? 0} / {s.maxBookings} xe</span>
                      </span>
                      
                      <div className='flex items-center gap-1.5'>
                        {/* Edit Button */}
                        {!isCancelled && s.status !== 'completed' && (
                          <button
                            onClick={() => setEditShift(s)}
                            title='Chỉnh sửa ca làm'
                            className='w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:border-indigo-300 hover:text-indigo-600 bg-white transition-all'
                          >
                            <Pencil className='w-3 h-3' />
                          </button>
                        )}
                        
                        {/* Cancel/Active toggle button */}
                        {s.status === 'scheduled' && (
                          <button
                            onClick={() => toggleShift.mutate({ id, status: 'cancelled' })}
                            title='Hủy bỏ ca trực'
                            className='w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:border-rose-300 hover:text-rose-600 bg-white transition-all text-slate-500'
                          >
                            <Power className='w-3 h-3' />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {editShift !== false && (
        <ShiftModal
          item={editShift}
          onClose={() => setEditShift(false)}
          onSave={handleSave}
          staffList={staffList}
        />
      )}
    </>
  );
}
