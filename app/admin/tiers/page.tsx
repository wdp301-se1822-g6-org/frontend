'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetTierConfigs, adminUpdateTierConfig, adminToggleTierConfig } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Crown, Pencil, Power, X } from 'lucide-react';

type Tier = { _id?: string; id?: string; name: string; minPoints?: number; discountPercent?: number; benefits?: string[]; isActive?: boolean };

const tierColors: Record<string, string> = {
  bronze:   'from-amber-700 to-amber-500',
  silver:   'from-slate-500 to-slate-400',
  gold:     'from-yellow-500 to-yellow-400',
  platinum: 'from-cyan-500 to-primary',
};

function TierModal({ item, onClose, onSave }: { item: Tier; onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ minPoints: item.minPoints ?? 0, discountPercent: item.discountPercent ?? 0, benefits: (item.benefits ?? []).join(', ') });
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' onClick={onClose}>
      <div className='bg-card rounded-xl p-8 w-full max-w-md shadow-2xl' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='font-heading font-semibold text-foreground text-lg'>Sửa hạng: {item.name}</h3>
          <button onClick={onClose}><X className='w-5 h-5 text-foreground/60' /></button>
        </div>
        <div className='flex flex-col gap-4'>
          <div>
            <label className='block text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-1.5'>Điểm tối thiểu</label>
            <input type='number' value={form.minPoints} onChange={(e) => setForm({ ...form, minPoints: Number(e.target.value) })}
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50' />
          </div>
          <div>
            <label className='block text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-1.5'>Giảm giá (%)</label>
            <input type='number' value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50' />
          </div>
          <div>
            <label className='block text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-1.5'>Quyền lợi (cách nhau bởi dấu phẩy)</label>
            <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={3}
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 resize-none' />
          </div>
        </div>
        <div className='flex gap-3 mt-6'>
          <button onClick={onClose} className='flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted'>Huỷ</button>
          <button onClick={() => onSave({ ...form, benefits: form.benefits.split(',').map((b) => b.trim()).filter(Boolean) })}
            className='flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90'>Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTiersPage() {
  const qc = useQueryClient();
  const [editTier, setEditTier] = useState<Tier | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['admin-tiers'], queryFn: adminGetTierConfigs });
  const tiers: Tier[] = data?.data?.data ?? data?.data ?? [];

  const updateTier = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateTierConfig(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tiers'] }); setEditTier(null); } });
  const toggleTier = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleTierConfig(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tiers'] }) });

  return (
    <>
      <AdminTopbar title='Hạng thành viên' subtitle='Cấu hình chương trình loyalty và đặc quyền' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-64 bg-card rounded-xl border border-border animate-pulse' />) :
              tiers.length === 0 ? (
                <div className='col-span-4 py-16 text-center text-foreground/60 font-semibold bg-card rounded-xl border border-border/50'>
                  Chưa có cấu hình hạng
                </div>
              ) : tiers.map((t) => {
                const id = t._id ?? t.id ?? '';
                const nameLower = (t.name ?? '').toLowerCase();
                const gradient = tierColors[nameLower] ?? 'from-primary to-secondary';
                return (
                  <div key={id} className='bg-card rounded-xl border border-border/50 shadow-xs overflow-hidden hover:-translate-y-1 transition-all'>
                    {/* Header gradient */}
                    <div className={`bg-linear-to-br ${gradient} p-6 text-white relative overflow-hidden`}>
                      <div className='absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -mr-8 -mt-8' />
                      <Crown className='w-8 h-8 mb-3 relative z-10' />
                      <h3 className='font-heading font-semibold text-xl capitalize relative z-10'>{t.name}</h3>
                      <span className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${t.isActive !== false ? 'bg-white/20' : 'bg-black/20'} relative z-10`}>
                        {t.isActive !== false ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className='p-5 flex flex-col gap-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-foreground/50'>Điểm tối thiểu</span>
                        <span className='font-semibold text-foreground'>{(t.minPoints ?? 0).toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-foreground/50'>Giảm giá</span>
                        <span className='font-semibold text-primary'>{t.discountPercent ?? 0}%</span>
                      </div>
                      {t.benefits && t.benefits.length > 0 && (
                        <div>
                          <p className='text-[10px] font-semibold uppercase tracking-widest text-foreground/55 mb-2'>Quyền lợi</p>
                          <ul className='flex flex-col gap-1'>
                            {t.benefits.map((b, i) => <li key={i} className='text-xs text-foreground/60 flex gap-1.5'><Check className='w-3.5 h-3.5 mt-0.5 shrink-0 text-primary' />{b}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className='flex gap-2 mt-2 pt-3 border-t border-border/50'>
                        <button onClick={() => setEditTier(t)}
                          className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold hover:border-primary/30 hover:text-primary transition-all'>
                          <Pencil className='w-3.5 h-3.5' />Sửa
                        </button>
                        <button onClick={() => toggleTier.mutate({ id, isActive: !(t.isActive !== false) })}
                          className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold hover:border-yellow-300 hover:text-yellow-600 transition-all'>
                          <Power className='w-3.5 h-3.5' />{t.isActive !== false ? 'Tắt' : 'Bật'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      {editTier && <TierModal item={editTier} onClose={() => setEditTier(null)} onSave={(d) => updateTier.mutate({ id: editTier._id ?? editTier.id ?? '', data: d })} />}
    </>
  );
}
