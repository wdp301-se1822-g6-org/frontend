'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  User, Shield, Globe, Settings, Sparkles, Plus, 
  Trash2, Edit2, Check, AlertCircle, X, Clock 
} from 'lucide-react';
import {
  adminGetPricingPolicy,
  adminUpdatePricingPolicy,
  adminGetGoldenHours,
  adminCreateGoldenHour,
  adminUpdateGoldenHour,
  adminDeleteGoldenHour
} from '@/lib/admin-api';

interface GoldenHour {
  id?: string;
  _id?: string;
  name: string;
  daysOfWeek: number[];
  startMinute: number;
  endMinute: number;
  discountPercent: number;
  isActive?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ Nhật' },
];

const minutesToTimeString = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timeStringToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export default function AdminSettingsPage() {
  const { authUser } = useAuthStore();
  const qc = useQueryClient();
  const [pricingInput, setPricingInput] = useState<number | ''>('');

  // States cho Golden Hour Modal
  const [isGhModalOpen, setIsGhModalOpen] = useState(false);
  const [editingGh, setEditingGh] = useState<GoldenHour | null>(null);
  const [ghForm, setGhForm] = useState({
    name: '',
    daysOfWeek: [] as number[],
    startTime: '08:00',
    endTime: '10:00',
    discountPercent: 10,
    isActive: true,
  });

  // Fetch Pricing Policy
  const { data: pricingPolicy } = useQuery({
    queryKey: ['admin-pricing-policy'],
    queryFn: async () => {
      const res = await adminGetPricingPolicy();
      const val = res.data?.maxStackedDiscountPercent ?? 50;
      setPricingInput(val);
      return res.data;
    },
  });

  // Update Pricing Policy Mutation
  const updatePricingMutation = useMutation({
    mutationFn: adminUpdatePricingPolicy,
    onSuccess: () => {
      toast.success('Cập nhật chính sách giá tối đa thành công!');
      qc.invalidateQueries({ queryKey: ['admin-pricing-policy'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi cập nhật.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  // Fetch Golden Hours
  const { data: goldenHours = [], isLoading: isLoadingGH } = useQuery<GoldenHour[]>({
    queryKey: ['admin-golden-hours'],
    queryFn: async () => {
      const res = await adminGetGoldenHours();
      return res.data || [];
    },
  });

  // CRUD Mutations cho Golden Hours
  const createGhMutation = useMutation({
    mutationFn: adminCreateGoldenHour,
    onSuccess: () => {
      toast.success('Thêm khung giờ vàng mới thành công!');
      setIsGhModalOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-golden-hours'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi tạo giờ vàng.';
      toast.error(`Thất bại: ${errMsg}`);
    }
  });

  const updateGhMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoldenHour> }) =>
      adminUpdateGoldenHour(id, data),
    onSuccess: () => {
      toast.success('Cập nhật khung giờ vàng thành công!');
      setIsGhModalOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-golden-hours'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi cập nhật.';
      toast.error(`Thất bại: ${errMsg}`);
    }
  });

  const deleteGhMutation = useMutation({
    mutationFn: adminDeleteGoldenHour,
    onSuccess: () => {
      toast.success('Xoá khung giờ vàng thành công!');
      qc.invalidateQueries({ queryKey: ['admin-golden-hours'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi khi xoá.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (pricingInput === '') {
      toast.error('Vui lòng điền phần trăm giảm giá cộng dồn tối đa.');
      return;
    }
    updatePricingMutation.mutate({ maxStackedDiscountPercent: Number(pricingInput) });
  };

  const handleOpenCreateGh = () => {
    setEditingGh(null);
    setGhForm({
      name: '',
      daysOfWeek: [],
      startTime: '08:00',
      endTime: '10:00',
      discountPercent: 10,
      isActive: true,
    });
    setIsGhModalOpen(true);
  };

  const handleOpenEditGh = (gh: GoldenHour) => {
    setEditingGh(gh);
    setGhForm({
      name: gh.name,
      daysOfWeek: gh.daysOfWeek || [],
      startTime: minutesToTimeString(gh.startMinute),
      endTime: minutesToTimeString(gh.endMinute),
      discountPercent: gh.discountPercent,
      isActive: gh.isActive !== false,
    });
    setIsGhModalOpen(true);
  };

  const handleSaveGh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghForm.name.trim()) {
      toast.error('Vui lòng nhập tên khung giờ vàng.');
      return;
    }

    const startMin = timeStringToMinutes(ghForm.startTime);
    const endMin = timeStringToMinutes(ghForm.endTime);

    if (startMin >= endMin) {
      toast.error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
      return;
    }

    const payload = {
      name: ghForm.name,
      daysOfWeek: ghForm.daysOfWeek,
      startMinute: startMin,
      endMinute: endMin,
      discountPercent: Number(ghForm.discountPercent),
      isActive: ghForm.isActive,
    };

    if (editingGh) {
      const ghId = editingGh._id || editingGh.id;
      if (ghId) {
        updateGhMutation.mutate({ id: ghId, data: payload });
      }
    } else {
      createGhMutation.mutate(payload);
    }
  };

  const handleDeleteGh = (gh: GoldenHour) => {
    const ghId = gh._id || gh.id;
    if (ghId && confirm(`Xác nhận xoá khung giờ vàng "${gh.name}"?`)) {
      deleteGhMutation.mutate(ghId);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setGhForm(prev => {
      const current = prev.daysOfWeek;
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort();
      return { ...prev, daysOfWeek: updated };
    });
  };

  return (
    <>
      <AdminTopbar title='Cài đặt hệ thống' subtitle='Cấu hình các tham số vận hành, chính sách giá và khung giờ vàng giảm giá' />
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-5xl mx-auto flex flex-col gap-8'>

          {/* Pricing Policy & Stacked Discount */}
          <div className='bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col gap-6'>
            <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
              <div className='w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600'>
                <Settings className='w-5 h-5' />
              </div>
              <div>
                <h2 className='font-heading font-black text-slate-800 text-base'>Chính sách giá & Khuyến mãi</h2>
                <p className='text-xs text-slate-500'>Cấu hình giới hạn áp dụng mã giảm giá cộng dồn</p>
              </div>
            </div>

            <form onSubmit={handleSavePricing} className='flex flex-col md:flex-row items-end gap-5 max-w-2xl'>
              <div className='flex-1 w-full'>
                <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-2'>
                  Giới hạn giảm giá cộng dồn tối đa (%)
                </label>
                <div className='relative rounded-xl shadow-xs'>
                  <input
                    type='number'
                    min={0}
                    max={100}
                    value={pricingInput}
                    onChange={(e) => setPricingInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-550 shadow-xs text-slate-700 font-semibold pr-10'
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <span className='text-slate-500 text-sm font-bold'>%</span>
                  </div>
                </div>
              </div>
              <button
                type='submit'
                disabled={updatePricingMutation.isPending}
                className='px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md shadow-indigo-600/10 h-[46px] w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5'
              >
                {updatePricingMutation.isPending ? 'Đang lưu...' : <><Check className='w-4.5 h-4.5' /> Lưu thay đổi</>}
              </button>
            </form>
          </div>

          {/* Golden Hour CRUD Management */}
          <div className='bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col gap-6'>
            <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600'>
                  <Sparkles className='w-5 h-5' />
                </div>
                <div>
                  <h2 className='font-heading font-black text-slate-800 text-base'>Quản lý Khung giờ vàng</h2>
                  <p className='text-xs text-slate-500'>Cấu hình giảm giá tự động theo các múi giờ thấp điểm trong ngày</p>
                </div>
              </div>

              <button
                onClick={handleOpenCreateGh}
                className='flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10'
              >
                <Plus className='w-4 h-4' /> Thêm giờ vàng
              </button>
            </div>

            {/* List Table */}
            {isLoadingGH ? (
              <div className='space-y-3'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='h-16 bg-slate-50 rounded-2xl animate-pulse border border-slate-100' />
                ))}
              </div>
            ) : goldenHours.length === 0 ? (
              <div className='text-center py-10 border border-dashed border-slate-200 rounded-3xl bg-slate-50/20'>
                <p className='text-slate-500 text-sm font-semibold italic'>Chưa có cấu hình giờ vàng nào.</p>
              </div>
            ) : (
              <div className='overflow-x-auto border border-slate-100 rounded-2xl'>
                <table className='w-full border-collapse text-left text-xs'>
                  <thead className='bg-slate-55/40 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider'>
                    <tr>
                      <th className='px-6 py-4'>Tên chiến dịch</th>
                      <th className='px-6 py-4'>Ngày áp dụng</th>
                      <th className='px-6 py-4'>Khung thời gian</th>
                      <th className='px-6 py-4 text-center'>Giảm giá</th>
                      <th className='px-6 py-4 text-center'>Trạng thái</th>
                      <th className='px-6 py-4 text-right'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 font-semibold text-slate-700'>
                    {goldenHours.map((gh) => {
                      const ghId = gh._id || gh.id || '';
                      const daysText = gh.daysOfWeek.length === 0 
                        ? 'Mỗi ngày' 
                        : gh.daysOfWeek.map(d => DAYS_OF_WEEK.find(item => item.value === d)?.label).join(', ');

                      return (
                        <tr key={ghId} className='hover:bg-slate-50/30 transition-colors'>
                          <td className='px-6 py-4 font-bold text-slate-900'>{gh.name}</td>
                          <td className='px-6 py-4 text-slate-500'>{daysText}</td>
                          <td className='px-6 py-4 font-mono flex items-center gap-1.5 mt-0.5 text-indigo-600'>
                            <Clock className='w-3.5 h-3.5' />
                            {minutesToTimeString(gh.startMinute)} – {minutesToTimeString(gh.endMinute)}
                          </td>
                          <td className='px-6 py-4 text-center text-amber-600 font-extrabold text-sm'>-{gh.discountPercent}%</td>
                          <td className='px-6 py-4 text-center'>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                              gh.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {gh.isActive !== false ? 'Đang chạy' : 'Đã tắt'}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <div className='flex items-center justify-end gap-2.5'>
                              <button
                                onClick={() => handleOpenEditGh(gh)}
                                className='p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 bg-white transition-all shadow-xs'
                              >
                                <Edit2 className='w-3.5 h-3.5' />
                              </button>
                              <button
                                onClick={() => handleDeleteGh(gh)}
                                className='p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:text-rose-600 bg-white transition-all shadow-xs'
                              >
                                <Trash2 className='w-3.5 h-3.5' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account & System Info (Old UI) */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='bg-white rounded-3xl border border-slate-100 shadow-sm p-8'>
              <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-3'>
                <div className='w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600'>
                  <User className='w-4.5 h-4.5' />
                </div>
                <h2 className='font-heading font-black text-slate-800 text-sm'>Thông tin tài khoản</h2>
              </div>
              <div className='grid grid-cols-1 gap-4 text-xs font-semibold'>
                {[
                  { label: 'Họ và tên', value: authUser?.name ?? '-' },
                  { label: 'Email', value: authUser?.email ?? '-' },
                  { label: 'Vai trò', value: authUser?.role ?? '-' },
                ].map(({ label, value }) => (
                  <div key={label} className='flex items-center justify-between py-2 border-b border-slate-50 last:border-0'>
                    <span className='text-slate-500'>{label}</span>
                    <span className='text-slate-850 font-bold'>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-white rounded-3xl border border-slate-100 shadow-sm p-8'>
              <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-3'>
                <div className='w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600'>
                  <Globe className='w-4.5 h-4.5' />
                </div>
                <h2 className='font-heading font-black text-slate-800 text-sm'>Thông tin hệ thống</h2>
              </div>
              <div className='grid grid-cols-1 gap-4 text-xs font-semibold'>
                {[
                  { label: 'Tên hệ thống', value: 'WAVE Car Wash' },
                  { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL ?? '-' },
                  { label: 'Môi trường', value: process.env.NODE_ENV ?? 'production' },
                ].map(({ label, value }) => (
                  <div key={label} className='flex items-center justify-between py-2 border-b border-slate-50 last:border-0'>
                    <span className='text-slate-500'>{label}</span>
                    <span className='text-slate-850 font-mono font-bold'>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── DIALOG: Tạo / Sửa Giờ Vàng ── */}
      {isGhModalOpen && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={() => setIsGhModalOpen(false)}>
          <form
            onSubmit={handleSaveGh}
            className='bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5 max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
              <h3 className='font-heading font-black text-slate-800 text-base'>
                {editingGh ? 'Sửa khung giờ vàng' : 'Thêm khung giờ vàng'}
              </h3>
              <button type='button' onClick={() => setIsGhModalOpen(false)}>
                <X className='w-5 h-5 text-slate-500 hover:text-slate-600' />
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              {/* Tên chiến dịch */}
              <div>
                <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Tên chiến dịch</label>
                <input
                  type='text'
                  value={ghForm.name}
                  onChange={(e) => setGhForm({ ...ghForm, name: e.target.value })}
                  placeholder='VD: Giờ vàng sáng sớm, Giảm giá buổi tối'
                  className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-sm text-slate-700 font-semibold'
                />
              </div>

              {/* Tỷ lệ giảm giá */}
              <div>
                <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Tỷ lệ giảm giá (%)</label>
                <input
                  type='number'
                  min={1}
                  max={100}
                  value={ghForm.discountPercent}
                  onChange={(e) => setGhForm({ ...ghForm, discountPercent: Number(e.target.value) })}
                  className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-sm text-slate-700 font-semibold'
                />
              </div>

              {/* Khung giờ */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Giờ bắt đầu</label>
                  <input
                    type='time'
                    value={ghForm.startTime}
                    onChange={(e) => setGhForm({ ...ghForm, startTime: e.target.value })}
                    className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-sm text-slate-700 font-semibold'
                  />
                </div>
                <div>
                  <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5'>Giờ kết thúc</label>
                  <input
                    type='time'
                    value={ghForm.endTime}
                    onChange={(e) => setGhForm({ ...ghForm, endTime: e.target.value })}
                    className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-sm text-slate-700 font-semibold'
                  />
                </div>
              </div>

              {/* Chọn thứ trong tuần */}
              <div>
                <label className='block text-xs font-black uppercase tracking-widest text-slate-500 mb-2'>Áp dụng cho ngày</label>
                <div className='flex flex-wrap gap-2'>
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = ghForm.daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type='button'
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className='text-[10px] text-slate-400 mt-1.5 font-medium'>* Bỏ chọn tất cả để áp dụng tự động cho mọi ngày trong tuần.</p>
              </div>

              {/* Kích hoạt */}
              <div className='flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 mt-1'>
                <div>
                  <label className='block text-xs font-bold text-slate-750'>Kích hoạt chiến dịch</label>
                  <p className='text-[10px] text-slate-400 font-medium'>Cho phép áp dụng khung giờ vàng này ngay lập tức</p>
                </div>
                <input
                  type='checkbox'
                  checked={ghForm.isActive}
                  onChange={(e) => setGhForm({ ...ghForm, isActive: e.target.checked })}
                  className='w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer'
                />
              </div>
            </div>

            <div className='flex gap-3 mt-4 border-t border-slate-100 pt-4'>
              <button
                type='button'
                onClick={() => setIsGhModalOpen(false)}
                className='flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm'
              >
                Huỷ
              </button>
              <button
                type='submit'
                disabled={createGhMutation.isPending || updateGhMutation.isPending}
                className='flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg shadow-indigo-600/10'
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
