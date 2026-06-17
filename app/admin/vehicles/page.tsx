'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { adminGetVehicles } from '@/lib/admin-api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, RefreshCw, Car } from 'lucide-react';

interface VehicleData {
  _id?: string;
  id?: string;
  licensePlate?: string;
  userId?: { fullName?: string };
  ownerName?: string;
  ownerPhone?: string;
  brand?: string;
  make?: string;
  model?: string;
  vehicleTypeId?: { name?: string } | string;
  vehicleTypeName?: string;
  vehicleType?: string;
  color?: string;
  year?: string | number;
  [key: string]: unknown;
}

export default function AdminVehiclesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('licensePlate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-vehicles', page],
    queryFn: () => adminGetVehicles({ page, limit: 10 }),
  });

  const vehicles: VehicleData[] = data?.data?.data ?? data?.data ?? [];
  const total: number =
    data?.data?.meta?.total ?? data?.data?.total ?? vehicles.length;
  const filtered = search ? vehicles.filter((v: VehicleData) => JSON.stringify(v).toLowerCase().includes(search.toLowerCase())) : vehicles;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortField === 'licensePlate') {
      aVal = a.licensePlate ?? '';
      bVal = b.licensePlate ?? '';
    } else if (sortField === 'ownerName') {
      aVal = a.ownerName ?? a.userId?.fullName ?? '';
      bVal = b.ownerName ?? b.userId?.fullName ?? '';
    } else if (sortField === 'brand') {
      aVal = a.brand ?? a.make ?? '';
      bVal = b.brand ?? b.make ?? '';
    } else if (sortField === 'model') {
      aVal = a.model ?? '';
      bVal = b.model ?? '';
    } else if (sortField === 'vehicleType') {
      aVal = a.vehicleTypeName ?? (typeof a.vehicleTypeId === 'object' ? a.vehicleTypeId?.name : undefined) ?? a.vehicleType ?? '';
      bVal = b.vehicleTypeName ?? (typeof b.vehicleTypeId === 'object' ? b.vehicleTypeId?.name : undefined) ?? b.vehicleType ?? '';
    } else if (sortField === 'color') {
      aVal = a.color ?? '';
      bVal = b.color ?? '';
    } else if (sortField === 'year') {
      aVal = Number(a.year ?? 0);
      bVal = Number(b.year ?? 0);
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, 'vi')
        : bVal.localeCompare(aVal, 'vi');
    } else {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  return (
    <>
      <AdminTopbar title='Quản lý phương tiện' subtitle='Danh sách xe của khách hàng' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-wrap items-center gap-3 mb-6'>
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/55' />
              <input type='text' placeholder='Tìm kiếm phương tiện...' value={search} onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:border-primary/50 transition-all' />
            </div>
            <button onClick={() => refetch()} className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-semibold hover:border-primary/30'>
              <RefreshCw className='w-4 h-4 text-foreground/50' />Làm mới
            </button>
            <span className='ml-auto text-xs font-semibold text-foreground/60'>Tổng: {total} xe</span>
          </div>

          <div className='bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-muted/50 border-b border-border/50'>
                    {[
                      { label: 'Biển số', field: 'licensePlate' },
                      { label: 'Chủ xe', field: 'ownerName' },
                      { label: 'Hãng xe', field: 'brand' },
                      { label: 'Mẫu xe', field: 'model' },
                      { label: 'Loại xe', field: 'vehicleType' },
                      { label: 'Màu sắc', field: 'color' },
                      { label: 'Năm SX', field: 'year' }
                    ].map((col) => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className='text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors select-none group'
                      >
                        <div className='flex items-center gap-1.5'>
                          {col.label}
                          <span className='text-slate-400 group-hover:text-slate-600 transition-colors text-[9px]'>
                            {sortField === col.field ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/30'>
                  {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className='px-5 py-4'><div className='h-4 bg-muted animate-pulse rounded-lg' /></td>
                    ))}</tr>
                  )) : sorted.length === 0 ? (
                    <tr><td colSpan={7} className='px-5 py-16 text-center text-foreground/60 font-semibold'>Không có dữ liệu</td></tr>
                  ) : sorted.map((v: VehicleData) => {
                    const id = v._id ?? v.id;
                    return (
                      <tr key={id} className='hover:bg-indigo-50/10 transition-colors border-b border-slate-100'>
                        <td className='px-5 py-4'>
                          <div className='flex items-center gap-2.5'>
                            <div className='w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100'>
                              <Car className='w-4 h-4 text-indigo-600' />
                            </div>
                            <span className='font-mono font-black text-indigo-600 bg-indigo-50/50 rounded-xl px-2.5 py-1 text-xs border border-indigo-100/50'>{v.licensePlate ?? '-'}</span>
                          </div>
                        </td>
                        <td className='px-5 py-4'>
                          <span className='font-bold text-slate-800 block'>{v.ownerName ?? v.userId?.fullName ?? '-'}</span>
                          {v.ownerPhone && (
                            <span className='text-[10px] font-bold text-slate-400 block mt-0.5'>
                              📞 {v.ownerPhone}
                            </span>
                          )}
                        </td>
                        <td className='px-5 py-4 text-slate-600 font-semibold'>{v.brand ?? v.make ?? '-'}</td>
                        <td className='px-5 py-4 text-slate-600 font-medium'>{v.model ?? '-'}</td>
                        <td className='px-5 py-4 text-slate-500 font-medium'>{v.vehicleTypeName ?? (typeof v.vehicleTypeId === 'object' ? v.vehicleTypeId?.name : undefined) ?? v.vehicleType ?? '-'}</td>
                        <td className='px-5 py-4 text-slate-500 font-medium'>{v.color ?? '-'}</td>
                        <td className='px-5 py-4 text-slate-500 font-mono'>{v.year ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {total > 10 && (
              <div className='flex items-center justify-between px-5 py-4 border-t border-border/50 bg-muted/20'>
                <span className='text-xs font-semibold text-foreground/60'>Trang {page} / {Math.ceil(total / 10)}</span>
                <div className='flex gap-2'>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary/30'>Trước</button>
                  <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 10)} className='px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:border-primary/30'>Sau</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
