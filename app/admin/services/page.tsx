'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetServiceTypes, adminCreateServiceType, adminUpdateServiceType, adminToggleServiceType, adminGetVehicleTypes, adminCreateVehicleType, adminUpdateVehicleType, adminToggleVehicleType } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Power, X } from 'lucide-react';

type ServiceType = { _id?: string; id?: string; name: string; description?: string; basePrice?: number; duration?: number; isActive?: boolean };
type VehicleType = { _id?: string; id?: string; name: string; description?: string; priceMultiplier?: number; isActive?: boolean };

function ServiceModal({ item, onClose, onSave }: { item?: ServiceType | null; onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ name: item?.name ?? '', description: item?.description ?? '', basePrice: item?.basePrice ?? 0, duration: item?.duration ?? 30 });
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='font-black text-foreground text-lg'>{item ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
          <button onClick={onClose}><X className='w-5 h-5 text-foreground/40' /></button>
        </div>
        <div className='flex flex-col gap-4'>
          {[
            { label: 'Tên dịch vụ', key: 'name', type: 'text' },
            { label: 'Mô tả', key: 'description', type: 'text' },
            { label: 'Giá cơ bản (VND)', key: 'basePrice', type: 'number' },
            { label: 'Thời gian (phút)', key: 'duration', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>{label}</label>
              <input type={type} value={(form as Record<string, string | number>)[key]} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
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

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const [editService, setEditService] = useState<ServiceType | null | false>(false);

  const { data: svcData, isLoading: svcLoading } = useQuery({ queryKey: ['admin-service-types'], queryFn: adminGetServiceTypes });
  const { data: vehData, isLoading: vehLoading } = useQuery({ queryKey: ['admin-vehicle-types'], queryFn: adminGetVehicleTypes });

  const createSvc = useMutation({ mutationFn: adminCreateServiceType, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-service-types'] }); setEditService(false); } });
  const updateSvc = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateServiceType(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-service-types'] }); setEditService(false); } });
  const toggleSvc = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleServiceType(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-service-types'] }) });
  const toggleVeh = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleVehicleType(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vehicle-types'] }) });

  const services: ServiceType[] = svcData?.data?.data ?? svcData?.data ?? [];
  const vehicles: VehicleType[] = vehData?.data?.data ?? vehData?.data ?? [];

  const handleSave = (d: Record<string, unknown>) => {
    if (editService && (editService as ServiceType)._id) {
      updateSvc.mutate({ id: (editService as ServiceType)._id!, data: d });
    } else {
      createSvc.mutate(d);
    }
  };

  return (
    <>
      <AdminTopbar title='Quản lý dịch vụ' subtitle='Loại dịch vụ và loại phương tiện' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8'>

          {/* Service Types */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-black text-foreground text-base'>Loại dịch vụ</h2>
              <button onClick={() => setEditService(null)}
                className='flex items-center gap-2 bg-primary text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20'>
                <Plus className='w-4 h-4' />Thêm mới
              </button>
            </div>
            <div className='flex flex-col gap-3'>
              {svcLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-20 bg-white rounded-2xl border border-border animate-pulse' />) :
                services.map((s) => {
                  const id = s._id ?? s.id ?? '';
                  return (
                    <div key={id} className='bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex items-center justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-black text-foreground'>{s.name}</p>
                        <p className='text-foreground/50 text-xs mt-0.5'>{s.description}</p>
                        <div className='flex gap-4 mt-2'>
                          <span className='text-xs font-black text-primary'>{s.basePrice?.toLocaleString('vi-VN')}đ</span>
                          <span className='text-xs text-foreground/40'>{s.duration} phút</span>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {s.isActive !== false ? 'Hoạt động' : 'Tắt'}
                        </span>
                        <button onClick={() => setEditService(s)} className='w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-all'>
                          <Pencil className='w-3.5 h-3.5' />
                        </button>
                        <button onClick={() => toggleSvc.mutate({ id, isActive: !(s.isActive !== false) })}
                          className='w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:border-yellow-300 hover:text-yellow-600 transition-all'>
                          <Power className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Vehicle Types */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-black text-foreground text-base'>Loại phương tiện</h2>
            </div>
            <div className='flex flex-col gap-3'>
              {vehLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-20 bg-white rounded-2xl border border-border animate-pulse' />) :
                vehicles.map((v) => {
                  const id = v._id ?? v.id ?? '';
                  return (
                    <div key={id} className='bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex items-center justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-black text-foreground'>{v.name}</p>
                        <p className='text-foreground/50 text-xs mt-0.5'>{v.description}</p>
                        {v.priceMultiplier && <span className='text-xs font-black text-secondary mt-1 block'>x{v.priceMultiplier} giá</span>}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${v.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {v.isActive !== false ? 'Hoạt động' : 'Tắt'}
                        </span>
                        <button onClick={() => toggleVeh.mutate({ id, isActive: !(v.isActive !== false) })}
                          className='w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:border-yellow-300 hover:text-yellow-600 transition-all'>
                          <Power className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>

      {editService !== false && (
        <ServiceModal item={editService} onClose={() => setEditService(false)} onSave={handleSave} />
      )}
    </>
  );
}
