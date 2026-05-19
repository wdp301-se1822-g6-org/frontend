'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetShifts, adminCreateShift, adminUpdateShift, adminToggleShift } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Power, X } from 'lucide-react';

type Shift = { _id?: string; id?: string; name: string; startTime?: string; endTime?: string; maxBookings?: number; isActive?: boolean };

function ShiftModal({ item, onClose, onSave }: { item?: Shift | null; onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ name: item?.name ?? '', startTime: item?.startTime ?? '08:00', endTime: item?.endTime ?? '10:00', maxBookings: item?.maxBookings ?? 10 });
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='font-black text-foreground text-lg'>{item ? 'Sửa ca làm việc' : 'Thêm ca mới'}</h3>
          <button onClick={onClose}><X className='w-5 h-5 text-foreground/40' /></button>
        </div>
        <div className='flex flex-col gap-4'>
          {[
            { label: 'Tên ca', key: 'name', type: 'text' },
            { label: 'Giờ bắt đầu', key: 'startTime', type: 'time' },
            { label: 'Giờ kết thúc', key: 'endTime', type: 'time' },
            { label: 'Tối đa booking', key: 'maxBookings', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>{label}</label>
              <input type={type} value={(form as Record<string, string | number>)[key]}
                onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50' />
            </div>
          ))}
        </div>
        <div className='flex gap-3 mt-6'>
          <button onClick={onClose} className='flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted'>Huỷ</button>
          <button onClick={() => onSave(form)} className='flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90'>Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShiftsPage() {
  const qc = useQueryClient();
  const [editShift, setEditShift] = useState<Shift | null | false>(false);

  const { data, isLoading } = useQuery({ queryKey: ['admin-shifts'], queryFn: () => adminGetShifts() });
  const shifts: Shift[] = data?.data?.data ?? data?.data ?? [];

  const createShift = useMutation({ mutationFn: adminCreateShift, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shifts'] }); setEditShift(false); } });
  const updateShift = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateShift(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shifts'] }); setEditShift(false); } });
  const toggleShift = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleShift(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shifts'] }) });

  const handleSave = (d: Record<string, unknown>) => {
    if (editShift && (editShift as Shift)._id) updateShift.mutate({ id: (editShift as Shift)._id!, data: d });
    else createShift.mutate(d);
  };

  return (
    <>
      <AdminTopbar title='Quản lý ca làm việc' subtitle='Cấu hình các ca và thời gian hoạt động' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='font-black text-foreground'>Danh sách ca làm việc</h2>
            <button onClick={() => setEditShift(null)}
              className='flex items-center gap-2 bg-primary text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20'>
              <Plus className='w-4 h-4' />Thêm ca mới
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className='h-28 bg-white rounded-2xl border border-border animate-pulse' />) :
              shifts.length === 0 ? (
                <div className='col-span-2 py-16 text-center text-foreground/40 font-semibold bg-white rounded-2xl border border-border/50'>
                  Chưa có ca nào
                </div>
              ) : shifts.map((s) => {
                const id = s._id ?? s.id ?? '';
                return (
                  <div key={id} className='bg-white rounded-2xl border border-border/50 shadow-sm p-6 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all'>
                    <div>
                      <div className='flex items-center gap-3 mb-2'>
                        <p className='font-black text-foreground text-base'>{s.name}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${s.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {s.isActive !== false ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </div>
                      <p className='text-foreground/60 text-sm'>
                        🕐 {s.startTime} – {s.endTime}
                      </p>
                      {s.maxBookings && <p className='text-foreground/40 text-xs mt-1'>Tối đa {s.maxBookings} booking</p>}
                    </div>
                    <div className='flex items-center gap-2'>
                      <button onClick={() => setEditShift(s)}
                        className='w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-all'>
                        <Pencil className='w-3.5 h-3.5' />
                      </button>
                      <button onClick={() => toggleShift.mutate({ id, isActive: !(s.isActive !== false) })}
                        className='w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:border-yellow-300 hover:text-yellow-600 transition-all'>
                        <Power className='w-3.5 h-3.5' />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      {editShift !== false && <ShiftModal item={editShift} onClose={() => setEditShift(false)} onSave={handleSave} />}
    </>
  );
}
