'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetServiceTypes, adminCreateServiceType, adminUpdateServiceType, adminToggleServiceType, adminGetVehicleTypes, adminToggleVehicleType } from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Plus, Pencil, Power, X, Search, MoreHorizontal, Clock, AlertTriangle,
  Layers, CircleCheck, CircleSlash, Car, Bike, Truck, Sparkles, Loader2, Info, Tag, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type VehiclePricing = { vehicleTypeId: string; vehicleTypeName?: string; price?: number | string; estimatedMinutes?: number; isActive?: boolean };
type ServiceType = { _id?: string; id?: string; name: string; description?: string; basePrice?: number; duration?: number; estimatedMinutes?: number; pointsMultiplier?: number; checklistTemplate?: unknown[]; vehiclePricing?: VehiclePricing[]; isActive?: boolean; createdAt?: string };
type VehicleType = { _id?: string; id?: string; name: string; description?: string; priceMultiplier?: number; isActive?: boolean };

// custom = loại xe này dùng giá/thời gian riêng; nếu false thì theo giá cơ bản của dịch vụ.
type PricingRow = { enabled: boolean; price: number; estimatedMinutes: number; custom: boolean };

const fmtVnd = (n?: number | string) => Number(n ?? 0).toLocaleString('vi-VN');

/* Lấy thông điệp lỗi dễ đọc từ axios error để hiển thị cho người dùng. */
function errMessage(e: unknown): string | null {
  if (!e) return null;
  const ax = e as { response?: { status?: number; data?: { message?: string | string[] } }; message?: string };
  const m = ax.response?.data?.message;
  const text = Array.isArray(m) ? m.join(', ') : m;
  if (text) return text;
  if (ax.response?.status === 409) return 'Tên dịch vụ đã tồn tại. Vui lòng dùng tên khác.';
  return ax.message || 'Đã có lỗi xảy ra, vui lòng thử lại.';
}

/* Match a vehicle type name to a representative icon for quick visual scanning. */
function vehicleIcon(name?: string) {
  const n = (name ?? '').toLowerCase();
  if (n.includes('xe máy') || n.includes('moto') || n.includes('bike')) return Bike;
  if (n.includes('tải') || n.includes('truck')) return Truck;
  return Car;
}

function FieldLabel({ children, hint, required }: { children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className='mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground'>
      {children}
      {required && <span className='text-destructive'>*</span>}
      {hint && <span className='font-normal text-muted-foreground'>· {hint}</span>}
    </label>
  );
}

function ServiceModal({ item, vehicleTypes, saving, error, onClose, onSave }: { item?: ServiceType | null; vehicleTypes: VehicleType[]; saving: boolean; error: string | null; onClose: () => void; onSave: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    basePrice: item?.basePrice ?? 0,
    estimatedMinutes: item?.estimatedMinutes ?? item?.duration ?? 30,
    pointsMultiplier: item?.pointsMultiplier ?? 1,
    checklistTemplate: item?.checklistTemplate ?? [],
  });
  const [touched, setTouched] = useState(false);

  const basePrice = Number(form.basePrice) || 0;
  const baseTime = Number(form.estimatedMinutes) || 0;

  // Giá theo từng loại xe (vehiclePricing). Map theo vehicleTypeId để dễ chỉnh.
  const [pricing, setPricing] = useState<Record<string, PricingRow>>(() => {
    const map: Record<string, PricingRow> = {};
    const bp = Number(item?.basePrice ?? 0);
    const bt = Number(item?.estimatedMinutes ?? item?.duration ?? 30);
    (item?.vehiclePricing ?? []).forEach((p) => {
      const price = Number(p.price ?? 0);
      const minutes = Number(p.estimatedMinutes ?? 30);
      map[p.vehicleTypeId] = {
        enabled: p.isActive !== false,
        price,
        estimatedMinutes: minutes,
        // Chỉ coi là "giá riêng" khi khác giá cơ bản; bằng giá cơ bản thì để bám theo mặc định.
        custom: price !== bp || minutes !== bt,
      };
    });
    return map;
  });

  const vtId = (vt: VehicleType) => vt._id || vt.id || '';
  const setRow = (id: string, patch: Partial<PricingRow>) =>
    setPricing((prev) => ({
      ...prev,
      [id]: {
        enabled: prev[id]?.enabled ?? false,
        price: prev[id]?.price ?? basePrice,
        estimatedMinutes: prev[id]?.estimatedMinutes ?? baseTime,
        custom: prev[id]?.custom ?? false,
        ...patch,
      },
    }));

  // Giá/thời gian thực tế của 1 loại xe: theo giá cơ bản nếu không đặt riêng.
  const effPrice = (row?: PricingRow) => (row?.custom ? Number(row.price) || 0 : basePrice);
  const effTime = (row?: PricingRow) => (row?.custom ? Number(row.estimatedMinutes) || 0 : baseTime);

  const enabledCount = vehicleTypes.filter((vt) => pricing[vtId(vt)]?.enabled).length;
  const nameError = form.name.trim() === '';

  const handleSave = () => {
    setTouched(true);
    if (nameError) return;
    const vehiclePricing = vehicleTypes
      .map((vt) => {
        const id = vtId(vt);
        const row = pricing[id];
        if (!id || !row?.enabled) return null;
        return {
          vehicleTypeId: id,
          price: effPrice(row),
          estimatedMinutes: effTime(row) || baseTime || 30,
          isActive: true,
        };
      })
      .filter(Boolean);
    onSave({ ...form, vehiclePricing });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm' onClick={onClose}>
      <div className='flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border' onClick={(e) => e.stopPropagation()}>

        {/* Header (sticky) */}
        <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5'>
          <div>
            <h3 className='font-heading text-lg font-bold text-foreground'>{item ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
            <p className='mt-0.5 text-xs text-muted-foreground'>Thiết lập thông tin và giá áp dụng theo từng loại xe.</p>
          </div>
          <button onClick={onClose} className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'><X className='size-5' /></button>
        </div>

        {/* Body (scrollable) */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          {/* Section: basic info */}
          <div className='space-y-4'>
            <div>
              <FieldLabel required>Tên dịch vụ</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='VD: Rửa thường'
                aria-invalid={touched && nameError}
              />
              {touched && nameError && <p className='mt-1 text-[11px] font-medium text-destructive'>Vui lòng nhập tên dịch vụ.</p>}
            </div>

            <div>
              <FieldLabel hint='không bắt buộc'>Mô tả</FieldLabel>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder='Mô tả ngắn gọn về dịch vụ...'
                rows={2}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <FieldLabel hint='mặc định cho mọi loại xe'>Giá cơ bản</FieldLabel>
                <div className='relative'>
                  <Input type='number' min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} className='pr-9' />
                  <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground'>đ</span>
                </div>
              </div>
              <div>
                <FieldLabel hint='phút'>Thời gian</FieldLabel>
                <Input type='number' min={0} value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Section: vehicle pricing */}
          <div className='mt-6 border-t border-border pt-5'>
            <div className='mb-1 flex items-center justify-between'>
              <h4 className='flex items-center gap-1.5 text-sm font-semibold text-foreground'><Tag className='size-4 text-muted-foreground' /> Áp dụng & giá theo loại xe</h4>
              <span className='text-[11px] font-semibold text-muted-foreground'>{enabledCount}/{vehicleTypes.length} bật</span>
            </div>

            {enabledCount === 0 ? (
              <p className='mb-3 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-[11px] font-medium text-warning'>
                <AlertTriangle className='size-3.5 shrink-0' /> Chưa bật loại xe nào → khách sẽ không đặt được dịch vụ này.
              </p>
            ) : (
              <p className='mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                <Info className='size-3.5 shrink-0' /> Mặc định mỗi loại xe dùng giá cơ bản. Bấm “Đặt giá riêng” nếu muốn giá khác.
              </p>
            )}

            <div className='flex flex-col gap-2'>
              {vehicleTypes.length === 0 ? (
                <p className='rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground'>Chưa có loại xe nào. Hãy tạo loại xe trước.</p>
              ) : vehicleTypes.map((vt) => {
                const id = vtId(vt);
                const row = pricing[id];
                const enabled = row?.enabled ?? false;
                const custom = row?.custom ?? false;
                const Icon = vehicleIcon(vt.name);
                return (
                  <div key={id} className={cn('rounded-xl border transition-all', enabled ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                    <div className='flex items-center gap-3 px-3 py-2.5'>
                      <button
                        type='button'
                        onClick={() => setRow(id, { enabled: !enabled })}
                        className='flex min-w-0 flex-1 items-center gap-3 text-left'
                      >
                        <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors', enabled ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent')}>
                          {enabled && <Check className='size-3.5' />}
                        </span>
                        <Icon className={cn('size-4 shrink-0', enabled ? 'text-primary' : 'text-muted-foreground')} />
                        <span className='truncate text-sm font-semibold text-foreground'>{vt.name}</span>
                      </button>
                      {enabled && (
                        custom ? (
                          <span className='shrink-0 text-[11px] font-semibold text-primary'>{fmtVnd(effPrice(row))}đ · {effTime(row)}p</span>
                        ) : (
                          <span className='shrink-0 text-[11px] text-muted-foreground'>theo giá cơ bản</span>
                        )
                      )}
                    </div>
                    {enabled && (
                      <div className='px-3 pb-3'>
                        {custom ? (
                          <>
                            <div className='grid grid-cols-2 gap-3'>
                              <div>
                                <label className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>Giá (đ)</label>
                                <Input type='number' min={0} value={row?.price ?? 0} onChange={(e) => setRow(id, { price: Number(e.target.value), custom: true })} className='h-8' />
                              </div>
                              <div>
                                <label className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>Thời gian (phút)</label>
                                <Input type='number' min={0} value={row?.estimatedMinutes ?? baseTime} onChange={(e) => setRow(id, { estimatedMinutes: Number(e.target.value), custom: true })} className='h-8' />
                              </div>
                            </div>
                            <button type='button' onClick={() => setRow(id, { custom: false })} className='mt-2 text-[11px] font-medium text-muted-foreground hover:text-foreground'>← Dùng giá cơ bản</button>
                          </>
                        ) : (
                          <button type='button' onClick={() => setRow(id, { custom: true, price: basePrice, estimatedMinutes: baseTime })} className='text-[11px] font-semibold text-primary hover:underline'>+ Đặt giá riêng cho loại xe này</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer (sticky) */}
        <div className='border-t border-border px-6 py-4'>
          {error && (
            <p className='mb-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive'>
              <AlertTriangle className='mt-px size-3.5 shrink-0' /> {error}
            </p>
          )}
          <div className='flex gap-3'>
            <Button variant='outline' className='flex-1' onClick={onClose} disabled={saving}>Huỷ</Button>
            <Button className='flex-1' onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className='size-4 animate-spin' />}
              {item ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Compact KPI card for the statistics row. */
function StatCard({ icon: Icon, value, label, tone }: { icon: typeof Layers; value: number; label: string; tone: 'primary' | 'success' | 'muted' | 'info' }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    muted: 'bg-muted text-muted-foreground',
    info: 'bg-info/10 text-info',
  };
  return (
    <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-center gap-3'>
        <div className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className='size-5' />
        </div>
        <div className='leading-none'>
          <p className='text-2xl font-bold tracking-tight text-foreground tabular-nums'>{value}</p>
          <p className='mt-1 text-xs font-medium text-muted-foreground'>{label}</p>
        </div>
      </div>
    </div>
  );
}

/* Subtle status indicator — a colored dot + label, never a loud pill. */
function StatusDot({ active }: { active: boolean }) {
  return (
    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
      <span className={cn('size-2 rounded-full', active ? 'bg-success' : 'bg-muted-foreground/40')} />
      {active ? 'Đang hoạt động' : 'Tạm ngưng'}
    </span>
  );
}

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const [editService, setEditService] = useState<ServiceType | null | false>(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const { data: svcData, isLoading: svcLoading } = useQuery({ queryKey: ['admin-service-types'], queryFn: adminGetServiceTypes });
  const { data: vehData, isLoading: vehLoading } = useQuery({ queryKey: ['admin-vehicle-types'], queryFn: adminGetVehicleTypes });

  const createSvc = useMutation({ mutationFn: adminCreateServiceType, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-service-types'] }); setEditService(false); } });
  const updateSvc = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateServiceType(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-service-types'] }); setEditService(false); } });
  const toggleSvc = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleServiceType(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-service-types'] }) });
  const toggleVeh = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminToggleVehicleType(id, isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vehicle-types'] }) });

  const services: ServiceType[] = svcData?.data?.data ?? svcData?.data ?? [];
  const vehicles: VehicleType[] = vehData?.data?.data ?? vehData?.data ?? [];

  // Mở/đóng modal kèm reset lỗi cũ của mutation để không hiện thông báo lỗi tồn đọng.
  const openModal = (s: ServiceType | null) => { createSvc.reset(); updateSvc.reset(); setEditService(s); };
  const closeModal = () => { createSvc.reset(); updateSvc.reset(); setEditService(false); };

  const handleSave = (d: Record<string, unknown>) => {
    const editId = editService ? ((editService as ServiceType)._id ?? (editService as ServiceType).id) : undefined;
    if (editId) {
      updateSvc.mutate({ id: editId, data: d });
    } else {
      createSvc.mutate(d);
    }
  };

  const isActive = (x: { isActive?: boolean }) => x.isActive !== false;
  const activeVp = (s: ServiceType) => (s.vehiclePricing ?? []).filter((p) => p.isActive !== false);

  // KPIs
  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter(isActive).length,
    inactive: services.filter((s) => !isActive(s)).length,
    vehicles: vehicles.length,
  }), [services, vehicles]);

  // Số dịch vụ áp dụng cho mỗi loại xe (đếm theo vehiclePricing đang bật).
  const serviceCountByVehicle = useMemo(() => {
    const map: Record<string, number> = {};
    services.forEach((s) => activeVp(s).forEach((p) => { map[p.vehicleTypeId] = (map[p.vehicleTypeId] ?? 0) + 1; }));
    return map;
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = services.filter((s) => {
      if (q && !(`${s.name} ${s.description ?? ''}`.toLowerCase().includes(q))) return false;
      if (statusFilter === 'active' && !isActive(s)) return false;
      if (statusFilter === 'inactive' && isActive(s)) return false;
      if (vehicleFilter !== 'all' && !activeVp(s).some((p) => p.vehicleTypeId === vehicleFilter)) return false;
      const price = s.basePrice ?? 0;
      if (priceFilter === 'lt50' && !(price < 50000)) return false;
      if (priceFilter === '50to100' && !(price >= 50000 && price < 100000)) return false;
      if (priceFilter === '100to200' && !(price >= 100000 && price < 200000)) return false;
      if (priceFilter === 'gt200' && !(price >= 200000)) return false;
      return true;
    });
    const t = (s: ServiceType) => (s.createdAt ? Date.parse(s.createdAt) : 0);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price-asc': return (a.basePrice ?? 0) - (b.basePrice ?? 0);
        case 'price-desc': return (b.basePrice ?? 0) - (a.basePrice ?? 0);
        case 'oldest': return t(a) - t(b);
        default: return t(b) - t(a);
      }
    });
    return list;
  }, [services, search, statusFilter, vehicleFilter, priceFilter, sort]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || vehicleFilter !== 'all' || priceFilter !== 'all';

  return (
    <>
      <AdminTopbar title='Quản lý dịch vụ' subtitle='Quản lý dịch vụ và loại phương tiện áp dụng' />
      <main className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-350 p-6 lg:p-8'>

          {/* Statistics */}
          <section className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard icon={Layers} value={stats.total} label='Tổng dịch vụ' tone='primary' />
            <StatCard icon={CircleCheck} value={stats.active} label='Đang hoạt động' tone='success' />
            <StatCard icon={CircleSlash} value={stats.inactive} label='Tạm ngưng' tone='muted' />
            <StatCard icon={Car} value={stats.vehicles} label='Loại phương tiện' tone='info' />
          </section>

          {/* Toolbar */}
          <div className='sticky top-0 z-10 -mx-1 mt-6 mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-3 backdrop-blur-md'>
            <div className='relative min-w-48 flex-1'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Tìm dịch vụ theo tên...'
                className='h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-placeholder focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/30 transition-all'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='h-9 w-35 bg-card'><SelectValue placeholder='Trạng thái' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Mọi trạng thái</SelectItem>
                <SelectItem value='active'>Đang hoạt động</SelectItem>
                <SelectItem value='inactive'>Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className='h-9 w-37.5 bg-card'><SelectValue placeholder='Loại xe' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Mọi loại xe</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v._id ?? v.id} value={v._id ?? v.id ?? ''}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className='h-9 w-37.5 bg-card'><SelectValue placeholder='Khoảng giá' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Mọi mức giá</SelectItem>
                <SelectItem value='lt50'>Dưới 50.000đ</SelectItem>
                <SelectItem value='50to100'>50.000 – 100.000đ</SelectItem>
                <SelectItem value='100to200'>100.000 – 200.000đ</SelectItem>
                <SelectItem value='gt200'>Trên 200.000đ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className='h-9 w-37.5 bg-card'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>Mới nhất</SelectItem>
                <SelectItem value='oldest'>Cũ nhất</SelectItem>
                <SelectItem value='price-desc'>Giá cao → thấp</SelectItem>
                <SelectItem value='price-asc'>Giá thấp → cao</SelectItem>
              </SelectContent>
            </Select>

            <Button className='ml-auto rounded-lg shadow-sm shadow-primary/20' onClick={() => openModal(null)}>
              <Plus className='size-4' /> Thêm dịch vụ
            </Button>
          </div>

          {/* Dashboard split: services (70%) + vehicle types (30%) */}
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-[2.3fr_1fr]'>

            {/* Services */}
            <section>
              <div className='mb-3 flex items-center justify-between'>
                <h2 className='font-heading text-sm font-bold text-foreground'>Dịch vụ</h2>
                <span className='text-xs text-muted-foreground'>{filtered.length} / {services.length}</span>
              </div>

              {svcLoading ? (
                <div className='flex flex-col gap-3'>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-28 animate-pulse rounded-2xl border border-border/60 bg-card' />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={hasFilters ? Search : Sparkles}
                  title={hasFilters ? 'Không tìm thấy dịch vụ' : 'Chưa có dịch vụ nào'}
                  description={hasFilters ? 'Thử thay đổi từ khóa hoặc bộ lọc để xem các dịch vụ khác.' : 'Tạo dịch vụ đầu tiên để bắt đầu nhận lượt đặt từ khách hàng.'}
                  action={hasFilters
                    ? <Button variant='outline' onClick={() => { setSearch(''); setStatusFilter('all'); setVehicleFilter('all'); setPriceFilter('all'); }}>Xoá bộ lọc</Button>
                    : <Button onClick={() => openModal(null)}><Plus className='size-4' /> Tạo dịch vụ</Button>}
                />
              ) : (
                <div className='flex flex-col gap-3'>
                  {filtered.map((s) => {
                    const id = s._id ?? s.id ?? '';
                    const vps = activeVp(s);
                    const active = isActive(s);
                    return (
                      <div key={id} className='group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='min-w-0 flex-1'>
                            {/* Name + price + duration */}
                            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                              <h3 className='text-[18px] font-semibold leading-tight text-foreground'>{s.name}</h3>
                              <span className='text-base font-bold text-primary tabular-nums'>{fmtVnd(s.basePrice)}đ</span>
                              <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                                <Clock className='size-3.5' /> {s.estimatedMinutes ?? s.duration} phút
                              </span>
                            </div>
                            {s.description && <p className='mt-1.5 line-clamp-1 text-sm text-muted-foreground'>{s.description}</p>}

                            {/* Vehicle type chips */}
                            <div className='mt-4 flex flex-wrap items-center gap-1.5'>
                              {vps.length === 0 ? (
                                <span className='inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-1 text-[11px] font-semibold text-warning'>
                                  <AlertTriangle className='size-3' /> Cần gán loại xe
                                </span>
                              ) : vps.map((p) => {
                                const Icon = vehicleIcon(p.vehicleTypeName);
                                return (
                                  <span key={p.vehicleTypeId} className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/70'>
                                    <Icon className='size-3' /> {p.vehicleTypeName ?? 'Loại xe'} · {fmtVnd(p.price)}đ
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Status + actions */}
                          <div className='flex shrink-0 flex-col items-end gap-3'>
                            <StatusDot active={active} />
                            <div className='flex items-center gap-1'>
                              <Button variant='ghost' size='sm' className='gap-1.5' onClick={() => openModal(s)} title='Sửa dịch vụ'>
                                <Pencil className='size-3.5' /> Sửa
                              </Button>
                              <Button variant='ghost' size='sm' className='gap-1.5' onClick={() => toggleSvc.mutate({ id, isActive: !active })} title={active ? 'Tạm ngưng dịch vụ' : 'Kích hoạt dịch vụ'}>
                                <Power className='size-3.5' /> {active ? 'Tạm ngưng' : 'Kích hoạt'}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='ghost' size='icon-sm' title='Thêm thao tác'><MoreHorizontal className='size-4' /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end' className='w-44'>
                                  <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openModal(s)}><Pencil className='size-4' /> Sửa dịch vụ</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant={active ? 'destructive' : 'default'} onClick={() => toggleSvc.mutate({ id, isActive: !active })}>
                                    <Power className='size-4' /> {active ? 'Tạm ngưng' : 'Kích hoạt'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Vehicle Types panel */}
            <aside>
              <div className='mb-3 flex items-center justify-between'>
                <h2 className='font-heading text-sm font-bold text-foreground'>Loại phương tiện</h2>
                <span className='text-xs text-muted-foreground'>{vehicles.length}</span>
              </div>

              <div className='rounded-2xl border border-border/60 bg-card shadow-sm'>
                {vehLoading ? (
                  <div className='flex flex-col gap-3 p-4'>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className='h-16 animate-pulse rounded-xl bg-muted' />)}
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className='p-8 text-center text-sm text-muted-foreground'>Chưa có loại phương tiện nào.</div>
                ) : (
                  <ul className='divide-y divide-border/60'>
                    {vehicles.map((v) => {
                      const id = v._id ?? v.id ?? '';
                      const active = isActive(v);
                      const Icon = vehicleIcon(v.name);
                      const count = serviceCountByVehicle[id] ?? 0;
                      return (
                        <li key={id} className='flex items-center gap-3 p-4 transition-colors hover:bg-muted/40'>
                          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70'>
                            <Icon className='size-5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <p className='truncate text-sm font-semibold text-foreground'>{v.name}</p>
                              {v.priceMultiplier ? <span className='text-[11px] font-semibold text-info'>x{v.priceMultiplier}</span> : null}
                            </div>
                            {v.description && <p className='truncate text-xs text-muted-foreground'>{v.description}</p>}
                            <div className='mt-1 flex items-center gap-3'>
                              <span className='text-[11px] font-medium text-muted-foreground'>{count} dịch vụ</span>
                              <StatusDot active={active} />
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            className='shrink-0'
                            onClick={() => toggleVeh.mutate({ id, isActive: !active })}
                            title={active ? 'Tạm ngưng' : 'Kích hoạt'}
                          >
                            <Power className='size-4' />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Floating add button (mobile) */}
        <Button
          className='fixed bottom-6 right-6 z-30 size-14 rounded-full p-0 shadow-lg shadow-primary/30 xl:hidden'
          onClick={() => openModal(null)}
          title='Thêm dịch vụ'
        >
          <Plus className='size-6' />
        </Button>
      </main>

      {editService !== false && (
        <ServiceModal
          item={editService}
          vehicleTypes={vehicles}
          saving={createSvc.isPending || updateSvc.isPending}
          error={errMessage(createSvc.error) ?? errMessage(updateSvc.error)}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  );
}
