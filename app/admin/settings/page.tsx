'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { useAuthStore } from '@/store/useAuthStore';
import {
  User, Globe, Settings, Sparkles, Plus,
  Trash2, Edit2, Check, X, Clock
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

  // Fetch Pricing Policy (đồng bộ vào input qua side-effect trong queryFn)
  useQuery({
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
      toast.error('Không thể lưu thay đổi.', {
        description: getErrorMessage(err),
      });
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
      toast.error('Không thể xóa.', {
        description: getErrorMessage(err),
      });
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
    };

    if (editingGh) {
      const ghId = editingGh._id || editingGh.id;
      if (ghId) {
        // isActive chỉ có ở DTO update — create luôn tạo khung đang bật.
        updateGhMutation.mutate({
          id: ghId,
          data: { ...payload, isActive: ghForm.isActive },
        });
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
      <main className='flex-1 p-8 overflow-y-auto bg-muted/40'>
        <div className='max-w-5xl mx-auto flex flex-col gap-8'>

          {/* Pricing Policy & Stacked Discount */}
          <div className='bg-card rounded-xl border border-border shadow-xs p-8 flex flex-col gap-6'>
            <div className='flex items-center gap-3 border-b border-border pb-4'>
              <div className='w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary'>
                <Settings className='w-5 h-5' />
              </div>
              <div>
                <h2 className='font-heading font-semibold text-foreground text-base'>Chính sách giá & Khuyến mãi</h2>
                <p className='text-xs text-muted-foreground'>Cấu hình giới hạn áp dụng mã giảm giá cộng dồn</p>
              </div>
            </div>

            <form onSubmit={handleSavePricing} className='flex flex-col md:flex-row items-end gap-5 max-w-2xl'>
              <div className='flex-1 w-full'>
                <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2'>
                  Giới hạn giảm giá cộng dồn tối đa (%)
                </label>
                <div className='relative rounded-xl shadow-xs'>
                  <input
                    type='number'
                    min={0}
                    max={100}
                    value={pricingInput}
                    onChange={(e) => setPricingInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className='w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 shadow-xs text-foreground font-semibold pr-10'
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <span className='text-muted-foreground text-sm font-bold'>%</span>
                  </div>
                </div>
              </div>
              <button
                type='submit'
                disabled={updatePricingMutation.isPending}
                className='px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md h-[46px] w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5'
              >
                {updatePricingMutation.isPending ? 'Đang lưu...' : <><Check className='w-4.5 h-4.5' /> Lưu thay đổi</>}
              </button>
            </form>
          </div>

          {/* Golden Hour CRUD Management */}
          <div className='bg-card rounded-xl border border-border shadow-xs p-8 flex flex-col gap-6'>
            <div className='flex items-center justify-between border-b border-border pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning'>
                  <Sparkles className='w-5 h-5' />
                </div>
                <div>
                  <h2 className='font-heading font-semibold text-foreground text-base'>Quản lý Khung giờ vàng</h2>
                  <p className='text-xs text-muted-foreground'>Cấu hình giảm giá tự động theo các múi giờ thấp điểm trong ngày</p>
                </div>
              </div>

              <button
                onClick={handleOpenCreateGh}
                className='flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md'
              >
                <Plus className='w-4 h-4' /> Thêm giờ vàng
              </button>
            </div>

            {/* List Table */}
            {isLoadingGH ? (
              <div className='space-y-3'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='h-16 bg-muted/40 rounded-xl animate-pulse border border-border' />
                ))}
              </div>
            ) : goldenHours.length === 0 ? (
              <div className='text-center py-10 border border-dashed border-border rounded-xl bg-muted/40'>
                <p className='text-muted-foreground text-sm font-semibold italic'>Chưa có cấu hình giờ vàng nào.</p>
              </div>
            ) : (
              <div className='overflow-x-auto border border-border rounded-xl'>
                <table className='w-full border-collapse text-left text-xs'>
                  <thead className='bg-muted/50 text-muted-foreground font-bold border-b border-border uppercase tracking-wider'>
                    <tr>
                      <th className='px-6 py-4'>Tên chiến dịch</th>
                      <th className='px-6 py-4'>Ngày áp dụng</th>
                      <th className='px-6 py-4'>Khung thời gian</th>
                      <th className='px-6 py-4 text-center'>Giảm giá</th>
                      <th className='px-6 py-4 text-center'>Trạng thái</th>
                      <th className='px-6 py-4 text-right'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border font-semibold text-foreground'>
                    {goldenHours.map((gh) => {
                      const ghId = gh._id || gh.id || '';
                      const daysText = gh.daysOfWeek.length === 0 
                        ? 'Mỗi ngày' 
                        : gh.daysOfWeek.map(d => DAYS_OF_WEEK.find(item => item.value === d)?.label).join(', ');

                      return (
                        <tr key={ghId} className='hover:bg-muted/50 transition-colors'>
                          <td className='px-6 py-4 font-bold text-foreground'>{gh.name}</td>
                          <td className='px-6 py-4 text-muted-foreground'>{daysText}</td>
                          <td className='px-6 py-4 font-mono flex items-center gap-1.5 mt-0.5 text-primary'>
                            <Clock className='w-3.5 h-3.5' />
                            {minutesToTimeString(gh.startMinute)} – {minutesToTimeString(gh.endMinute)}
                          </td>
                          <td className='px-6 py-4 text-center text-warning font-semibold text-sm'>-{gh.discountPercent}%</td>
                          <td className='px-6 py-4 text-center'>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                              gh.isActive !== false ? 'bg-success/10 text-success border border-success/30' : 'bg-muted text-placeholder'
                            }`}>
                              {gh.isActive !== false ? 'Đang chạy' : 'Đã tắt'}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right'>
                            <div className='flex items-center justify-end gap-2.5'>
                              <button
                                onClick={() => handleOpenEditGh(gh)}
                                className='p-1.5 rounded-lg border border-border hover:border-primary hover:text-primary bg-card transition-all shadow-xs'
                              >
                                <Edit2 className='w-3.5 h-3.5' />
                              </button>
                              <button
                                onClick={() => handleDeleteGh(gh)}
                                className='p-1.5 rounded-lg border border-border hover:border-destructive/40 hover:text-destructive bg-card transition-all shadow-xs'
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
            <div className='bg-card rounded-xl border border-border shadow-xs p-8'>
              <div className='flex items-center gap-3 mb-6 border-b border-border pb-3'>
                <div className='w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-primary'>
                  <User className='w-4.5 h-4.5' />
                </div>
                <h2 className='font-heading font-semibold text-foreground text-sm'>Thông tin tài khoản</h2>
              </div>
              <div className='grid grid-cols-1 gap-4 text-xs font-semibold'>
                {[
                  { label: 'Họ và tên', value: authUser?.name ?? '-' },
                  { label: 'Email', value: authUser?.email ?? '-' },
                  { label: 'Vai trò', value: authUser?.role ?? '-' },
                ].map(({ label, value }) => (
                  <div key={label} className='flex items-center justify-between py-2 border-b border-border last:border-0'>
                    <span className='text-muted-foreground'>{label}</span>
                    <span className='text-foreground font-bold'>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-card rounded-xl border border-border shadow-xs p-8'>
              <div className='flex items-center gap-3 mb-6 border-b border-border pb-3'>
                <div className='w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-primary'>
                  <Globe className='w-4.5 h-4.5' />
                </div>
                <h2 className='font-heading font-semibold text-foreground text-sm'>Thông tin hệ thống</h2>
              </div>
              <div className='grid grid-cols-1 gap-4 text-xs font-semibold'>
                {[
                  { label: 'Tên hệ thống', value: 'WAVE Car Wash' },
                  { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL ?? '-' },
                  { label: 'Môi trường', value: process.env.NODE_ENV ?? 'production' },
                ].map(({ label, value }) => (
                  <div key={label} className='flex items-center justify-between py-2 border-b border-border last:border-0'>
                    <span className='text-muted-foreground'>{label}</span>
                    <span className='text-foreground font-mono font-bold'>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── DIALOG: Tạo / Sửa Giờ Vàng ── */}
      {isGhModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={() => setIsGhModalOpen(false)}>
          <form
            onSubmit={handleSaveGh}
            className='bg-card rounded-xl p-8 w-full max-w-md shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5 max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between pb-3 border-b border-border'>
              <h3 className='font-heading font-semibold text-foreground text-base'>
                {editingGh ? 'Sửa khung giờ vàng' : 'Thêm khung giờ vàng'}
              </h3>
              <button type='button' onClick={() => setIsGhModalOpen(false)}>
                <X className='w-5 h-5 text-muted-foreground hover:text-muted-foreground' />
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              {/* Tên chiến dịch */}
              <div>
                <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5'>Tên chiến dịch</label>
                <input
                  type='text'
                  value={ghForm.name}
                  onChange={(e) => setGhForm({ ...ghForm, name: e.target.value })}
                  placeholder='VD: Giờ vàng sáng sớm, Giảm giá buổi tối'
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary shadow-xs text-foreground font-semibold'
                />
              </div>

              {/* Tỷ lệ giảm giá */}
              <div>
                <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5'>Tỷ lệ giảm giá (%)</label>
                <input
                  type='number'
                  min={0}
                  max={100}
                  value={ghForm.discountPercent}
                  onChange={(e) => setGhForm({ ...ghForm, discountPercent: Number(e.target.value) })}
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary shadow-xs text-foreground font-semibold'
                />
                <p className='text-[11px] text-muted-foreground mt-1.5'>
                  % này <b>cộng thêm</b> vào ưu đãi theo hạng thành viên (tổng
                  giảm tối đa 50%). Để 0% nếu khung chỉ dùng để kích hoạt ưu
                  đãi hạng.
                </p>
              </div>

              {/* Khung giờ */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5'>Giờ bắt đầu</label>
                  <input
                    type='time'
                    value={ghForm.startTime}
                    onChange={(e) => setGhForm({ ...ghForm, startTime: e.target.value })}
                    className='w-full border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary shadow-xs text-foreground font-semibold'
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5'>Giờ kết thúc</label>
                  <input
                    type='time'
                    value={ghForm.endTime}
                    onChange={(e) => setGhForm({ ...ghForm, endTime: e.target.value })}
                    className='w-full border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary shadow-xs text-foreground font-semibold'
                  />
                </div>
              </div>

              {/* Cảnh báo mềm: khung nằm ngoài giờ nhận xe thì không có slot nào hưởng */}
              {(() => {
                const s = timeStringToMinutes(ghForm.startTime);
                const e = timeStringToMinutes(ghForm.endTime);
                if (!ghForm.startTime || !ghForm.endTime || s >= e) return null;
                // Giờ nhận xe: 08:00–12:00 và 14:00–17:00 (khớp BE).
                const windows: Array<[number, number]> = [[480, 720], [840, 1020]];
                const overlapsBusiness = windows.some(([o, c]) => s < c && o < e);
                const fullyInside = windows.some(([o, c]) => s >= o && e <= c);
                if (!overlapsBusiness) {
                  return (
                    <p className='text-[11px] text-warning-foreground bg-warning/10 border border-warning/30 rounded-lg px-3 py-2'>
                      Khung này nằm ngoài giờ nhận xe (08:00–12:00, 14:00–17:00)
                      nên sẽ không có lượt đặt nào được giảm giá.
                    </p>
                  );
                }
                if (!fullyInside) {
                  return (
                    <p className='text-[11px] text-warning-foreground bg-warning/10 border border-warning/30 rounded-lg px-3 py-2'>
                      Một phần khung nằm ngoài giờ nhận xe (08:00–12:00,
                      14:00–17:00) — chỉ phần trùng mới có lượt đặt được giảm.
                    </p>
                  );
                }
                return null;
              })()}

              {/* Chọn thứ trong tuần */}
              <div>
                <label className='block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2'>Áp dụng cho ngày</label>
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
                            ? 'border-primary bg-accent text-primary shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className='text-[10px] text-placeholder mt-1.5 font-medium'>* Bỏ chọn tất cả để áp dụng tự động cho mọi ngày trong tuần.</p>
              </div>

              {/* Kích hoạt — chỉ chỉnh được khi sửa; khung mới luôn được bật */}
              {editingGh && (
                <div className='flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40 mt-1'>
                  <div>
                    <label className='block text-xs font-bold text-foreground'>Kích hoạt chiến dịch</label>
                    <p className='text-[10px] text-placeholder font-medium'>Cho phép áp dụng khung giờ vàng này ngay lập tức</p>
                  </div>
                  <input
                    type='checkbox'
                    checked={ghForm.isActive}
                    onChange={(e) => setGhForm({ ...ghForm, isActive: e.target.checked })}
                    className='w-4.5 h-4.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer'
                  />
                </div>
              )}
            </div>

            <div className='flex gap-3 mt-4 border-t border-border pt-4'>
              <button
                type='button'
                onClick={() => setIsGhModalOpen(false)}
                className='flex-1 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-all shadow-xs'
              >
                Huỷ
              </button>
              <button
                type='submit'
                disabled={createGhMutation.isPending || updateGhMutation.isPending}
                className='flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg'
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
