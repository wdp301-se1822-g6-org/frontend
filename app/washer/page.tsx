'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  washerGetWorkOrders,
  washerStartWorkOrder,
  washerFinishWorkOrder
} from '@/lib/washer-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Play,
  CheckSquare,
  Square,
  AlertCircle,
  Car,
  Camera,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkOrderData {
  id: string;
  orderId: string;
  code: string;
  vehicleSnapshot?: {
    plate?: string;
    vehicleTypeName?: string;
    color?: string;
  };
  serviceName?: string;
  status: 'waiting' | 'assigned' | 'in_progress' | 'quality_check' | 'returned' | 'done';
  qcPassed?: boolean | null;
  qcNote?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const WASH_STEPS = [
  'Nhận xe & Kiểm tra trầy xước ban đầu',
  'Xịt gầm & Vệ sinh bùn đất hốc bánh xe',
  'Phun bọt tuyết & Chà rửa chi tiết vỏ xe',
  'Xả nước sạch toàn thân xe',
  'Lau khô & Hút bụi vệ sinh nội thất',
  'Dưỡng bóng lốp xe & Kiểm tra tổng thể',
];

export default function WasherDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');
  
  // Lưu trạng thái checklist của từng Work Order đang rửa xe (ID -> mảng boolean)
  const [checklists, setChecklists] = useState<Record<string, boolean[]>>({});
  const [inspectionPhotos, setInspectionPhotos] = useState<Record<string, { preWash: string[]; postWash: string[] }>>(() => {
    const stored = localStorage.getItem('wave_inspection_photos');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const handleUploadPhotos = (woId: string, files: FileList | null, type: 'pre' | 'post') => {
    if (!files) return;
    
    const rawWoPhotos = inspectionPhotos[woId];
    const woPhotos = (rawWoPhotos && typeof rawWoPhotos === 'object' && 'preWash' in rawWoPhotos)
      ? rawWoPhotos
      : { preWash: [], postWash: [] };

    const currentList = Array.isArray(type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      ? (type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      : [];
    
    const filePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(filePromises).then(newBase64s => {
      const updatedList = [...currentList, ...newBase64s];
      const updatedWoPhotos = {
        ...woPhotos,
        [type === 'pre' ? 'preWash' : 'postWash']: updatedList
      };
      const newMap = { ...inspectionPhotos, [woId]: updatedWoPhotos };
      setInspectionPhotos(newMap);
      localStorage.setItem('wave_inspection_photos', JSON.stringify(newMap));
      toast.success(`Đã lưu thêm ${newBase64s.length} ảnh ${type === 'pre' ? 'trước khi rửa' : 'sau khi rửa'}!`);
    });
  };

  const handleDeletePhoto = (woId: string, photoIdx: number, type: 'pre' | 'post') => {
    const rawWoPhotos = inspectionPhotos[woId];
    const woPhotos = (rawWoPhotos && typeof rawWoPhotos === 'object' && 'preWash' in rawWoPhotos)
      ? rawWoPhotos
      : { preWash: [], postWash: [] };

    const currentList = Array.isArray(type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      ? (type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      : [];

    const updatedList = currentList.filter((_, idx) => idx !== photoIdx);
    
    const updatedWoPhotos = {
      ...woPhotos,
      [type === 'pre' ? 'preWash' : 'postWash']: updatedList
    };
    const newMap = { ...inspectionPhotos, [woId]: updatedWoPhotos };
    setInspectionPhotos(newMap);
    localStorage.setItem('wave_inspection_photos', JSON.stringify(newMap));
    toast.success('Đã xóa ảnh thành công.');
  };

  // Lấy danh sách Work Orders của thợ hiện tại
  const { data: workOrdersRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['washer-work-orders', activeTab],
    queryFn: () => washerGetWorkOrders(),
  });

  const allWorkOrders: WorkOrderData[] = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];

  // Lọc work orders theo Tab hoạt động
  const workOrders = allWorkOrders.filter((wo) => {
    if (activeTab === 'todo') {
      return wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'returned';
    }
    return wo.status === 'quality_check' || wo.status === 'done';
  });

  // Mutation Bắt đầu rửa xe
  const startWashMutation = useMutation({
    mutationFn: async (woId: string) => {
      await washerStartWorkOrder(woId);
    },
    onSuccess: (_, woId) => {
      toast.success('Đã bắt đầu rửa xe! Cố gắng rửa thật sạch nhé ông chủ.');
      // Khởi tạo checklist trống cho work order này
      setChecklists(prev => ({
        ...prev,
        [woId]: new Array(WASH_STEPS.length).fill(false)
      }));
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể bắt đầu rửa xe.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  // Mutation Hoàn thành rửa xe
  const finishWashMutation = useMutation({
    mutationFn: async (woId: string) => {
      await washerFinishWorkOrder(woId);
    },
    onSuccess: () => {
      toast.success('Tuyệt vời! Đã báo cáo hoàn thành rửa xe. Chờ Cashier kiểm duyệt QC.');
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể gửi báo cáo hoàn thành.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  // Hàm chuyển đổi trạng thái một mục trong checklist
  const toggleChecklistItem = (woId: string, index: number) => {
    const current = checklists[woId] || new Array(WASH_STEPS.length).fill(false);
    const updated = [...current];
    updated[index] = !updated[index];
    setChecklists(prev => ({
      ...prev,
      [woId]: updated
    }));
  };

  return (
    <>
      <AdminTopbar
        title='Lịch rửa xe của tôi'
        subtitle='Nơi cập nhật trạng thái làm việc, đánh dấu checklist tiêu chuẩn và hoàn thành xe sạch đẹp'
      />
      <main className='flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-4xl mx-auto'>
          
          {/* Header Controls */}
          <div className='flex items-center justify-between mb-6 border-b border-slate-200 pb-2'>
            <div className='flex gap-6'>
              <button
                onClick={() => setActiveTab('todo')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === 'todo' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Cần xử lý
                {activeTab === 'todo' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full' />
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === 'completed' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Đã hoàn thành
                {activeTab === 'completed' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full' />
                )}
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:border-slate-300 transition-all shadow-sm'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className='space-y-4'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-48' />
              ))}
            </div>
          ) : workOrders.length === 0 ? (
            <div className='bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-md mx-auto mt-8'>
              <div className='w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 text-indigo-600'>
                <Car className='w-8 h-8' />
              </div>
              <h3 className='font-heading text-lg font-black text-slate-800 mb-2'>Trống lịch trình</h3>
              <p className='text-slate-400 text-sm leading-relaxed'>
                {activeTab === 'todo'
                  ? 'Hiện tại ông chủ chưa có xe nào được phân công. Hãy nghỉ ngơi chút hoặc nhắc Cashier/Manager giao xe nhé!'
                  : 'Chưa có lịch sử xe hoàn thành nào trong hôm nay.'}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {workOrders.map((wo) => {
                const customer = `Mã phiếu: ${wo.code || wo.id.slice(-6).toUpperCase()}`;
                const plate = wo.vehicleSnapshot?.plate ?? '—';
                const service = wo.serviceName ?? '—';
                
                const isPending = wo.status === 'assigned' || wo.status === 'waiting';
                const isInProgress = wo.status === 'in_progress' || wo.status === 'returned';
                const isCompleted = wo.status === 'quality_check' || wo.status === 'done';

                // Lấy checklist hiện tại cho order này
                const currentChecklist = checklists[wo.id] || new Array(WASH_STEPS.length).fill(false);
                const checkedCount = currentChecklist.filter(Boolean).length;
                const progressPercentage = Math.round((checkedCount / WASH_STEPS.length) * 100);

                return (
                  <div
                    key={wo.id}
                    className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
                      isPending ? 'border-amber-100 hover:border-amber-200' :
                      isInProgress ? 'border-indigo-200 ring-2 ring-indigo-500/5' :
                      'border-emerald-100'
                    }`}
                  >
                    {/* Header Card */}
                    <div className='p-6 border-b border-slate-100/60 bg-slate-50/30 flex flex-wrap items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5'>
                        <div className='px-4 py-2 bg-indigo-600 text-white rounded-2xl font-mono font-black text-sm tracking-wide shadow-md shadow-indigo-600/10 border border-indigo-500'>
                          {plate}
                        </div>
                        <div>
                          <h4 className='font-heading font-bold text-slate-800 text-sm'>{service}</h4>
                          <p className='text-xs text-slate-400 font-medium'>Định danh: <span className='text-slate-600 font-bold'>{customer}</span></p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-black ${
                        isPending ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        isInProgress ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {isPending && 'Được giao việc'}
                        {isInProgress && (wo.status === 'returned' ? 'QC Không đạt (Rửa lại)' : 'Đang tiến hành rửa')}
                        {wo.status === 'quality_check' && 'Chờ QC'}
                        {wo.status === 'done' && 'Hoàn thành sạch đẹp'}
                      </span>
                    </div>

                    {/* Card Content & Active Flow */}
                    <div className='p-6'>
                      {/* Đang chuẩn bị rửa */}
                      {isPending && (
                        <div className='text-center py-6 max-w-sm mx-auto'>
                          <p className='text-slate-500 text-sm mb-4 leading-relaxed font-medium'>
                            Xe đã được Cashier giao cho bạn phụ trách. Hãy click &quot;Bắt đầu làm việc&quot; để nhận xe vào khoang rửa.
                          </p>
                          <button
                            onClick={() => startWashMutation.mutate(wo.id)}
                            disabled={startWashMutation.isPending}
                            className='w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group'
                          >
                            <Play className='w-4.5 h-4.5 fill-white group-hover:scale-110 transition-transform' />
                            Bắt đầu làm việc ngay
                          </button>
                        </div>
                      )}

                      {/* Đang rửa xe & Checklist */}
                      {isInProgress && (
                        <div>
                          {/* Progress bar */}
                          <div className='mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100/60 flex items-center justify-between gap-4'>
                            <div className='flex-1'>
                              <div className='flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5'>
                                <span>Tiến độ tiêu chuẩn:</span>
                                <span className='text-indigo-600'>{checkedCount} / {WASH_STEPS.length} hạng mục ({progressPercentage}%)</span>
                              </div>
                              <div className='w-full h-2 bg-slate-200/80 rounded-full overflow-hidden'>
                                <div
                                  className='h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 rounded-full'
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Checklist Items */}
                          <p className='text-xs font-black text-slate-400 uppercase tracking-wider mb-3.5'>Quy trình rửa xe chuẩn WAVE</p>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-6'>
                            {WASH_STEPS.map((step, idx) => {
                              const isChecked = currentChecklist[idx];
                              return (
                                <button
                                  key={idx}
                                  type='button'
                                  onClick={() => toggleChecklistItem(wo.id, idx)}
                                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border transition-all ${
                                    isChecked
                                      ? 'border-indigo-600 bg-indigo-50/10 text-slate-800'
                                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className='w-5 h-5 text-indigo-600 shrink-0' />
                                  ) : (
                                    <Square className='w-5 h-5 text-slate-300 shrink-0' />
                                  )}
                                  <span className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-400 font-medium' : ''}`}>
                                    {step}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* 📸 Trình quản lý ảnh kiểm định (Trước & Sau khi rửa - Không dùng Mock Ảnh) */}
                          <div className='mt-6 mb-6 border-t border-slate-100 pt-5 space-y-6'>
                            {/* 1. Trước khi rửa */}
                            <div>
                              <p className='text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                                <Camera className='w-4 h-4 text-amber-500' />
                                1. Ảnh trước khi rửa (Trầy xước/Móp méo có sẵn)
                              </p>
                              
                              <div className='grid grid-cols-4 gap-3'>
                                {(inspectionPhotos[wo.id]?.preWash && inspectionPhotos[wo.id].preWash.length > 0) ? (
                                  <>
                                    {inspectionPhotos[wo.id].preWash.map((photo, pIdx) => (
                                      <div key={pIdx} className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50'>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt='Pre-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2'>
                                          <button 
                                            type='button'
                                            onClick={() => setPreviewPhoto(photo)}
                                            className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-lg flex items-center justify-center shadow-sm'
                                          >
                                            <Eye className='w-4 h-4' />
                                          </button>
                                          <button 
                                            type='button'
                                            onClick={() => handleDeletePhoto(wo.id, pIdx, 'pre')}
                                            className='w-7 h-7 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-sm'
                                          >
                                            <Trash2 className='w-4 h-4' />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <label className='aspect-square rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200'>
                                      <Plus className='w-5 h-5 text-slate-400' />
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>Thêm ảnh</span>
                                      <input 
                                        type='file' 
                                        multiple 
                                        accept='image/*' 
                                        className='hidden' 
                                        onChange={(e) => handleUploadPhotos(wo.id, e.target.files, 'pre')} 
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <div className='col-span-4 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center gap-2 text-center py-6'>
                                    <p className='text-xs font-semibold text-slate-400 italic'>Chưa chụp ảnh tình trạng trước khi rửa xe.</p>
                                    <label className='px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5'>
                                      <Plus className='w-3.5 h-3.5' /> Chụp / Tải ảnh lên
                                      <input 
                                        type='file' 
                                        multiple 
                                        accept='image/*' 
                                        className='hidden' 
                                        onChange={(e) => handleUploadPhotos(wo.id, e.target.files, 'pre')} 
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 2. Sau khi rửa */}
                            <div>
                              <p className='text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                                <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                                2. Ảnh sau khi rửa (Nghiệm thu xe sạch đẹp)
                              </p>
                              
                              <div className='grid grid-cols-4 gap-3'>
                                {(inspectionPhotos[wo.id]?.postWash && inspectionPhotos[wo.id].postWash.length > 0) ? (
                                  <>
                                    {inspectionPhotos[wo.id].postWash.map((photo, pIdx) => (
                                      <div key={pIdx} className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50'>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt='Post-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2'>
                                          <button 
                                            type='button'
                                            onClick={() => setPreviewPhoto(photo)}
                                            className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-lg flex items-center justify-center shadow-sm'
                                          >
                                            <Eye className='w-4 h-4' />
                                          </button>
                                          <button 
                                            type='button'
                                            onClick={() => handleDeletePhoto(wo.id, pIdx, 'post')}
                                            className='w-7 h-7 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-sm'
                                          >
                                            <Trash2 className='w-4 h-4' />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <label className='aspect-square rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200'>
                                      <Plus className='w-5 h-5 text-slate-400' />
                                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>Thêm ảnh</span>
                                      <input 
                                        type='file' 
                                        multiple 
                                        accept='image/*' 
                                        className='hidden' 
                                        onChange={(e) => handleUploadPhotos(wo.id, e.target.files, 'post')} 
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <div className='col-span-4 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center gap-2 text-center py-6'>
                                    <p className='text-xs font-semibold text-slate-400 italic'>Chưa chụp ảnh nghiệm thu sau khi rửa xe.</p>
                                    <label className='px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5'>
                                      <Plus className='w-3.5 h-3.5' /> Chụp / Tải ảnh lên
                                      <input 
                                        type='file' 
                                        multiple 
                                        accept='image/*' 
                                        className='hidden' 
                                        onChange={(e) => handleUploadPhotos(wo.id, e.target.files, 'post')} 
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Complete action */}
                          <div className='flex flex-col gap-2'>
                            {checkedCount < WASH_STEPS.length && (
                              <div className='flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 p-2.5 rounded-xl mb-1'>
                                <AlertCircle className='w-4 h-4 shrink-0' />
                                Khuyên dùng: Hoàn thành đầy đủ {WASH_STEPS.length} bước trên để đảm bảo chất lượng xe trước khi bàn giao QC.
                              </div>
                            )}

                            <button
                              onClick={() => finishWashMutation.mutate(wo.id)}
                              disabled={finishWashMutation.isPending}
                              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                                checkedCount === WASH_STEPS.length
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                              }`}
                            >
                              <CheckCircle2 className='w-4.5 h-4.5' />
                              Hoàn thành rửa xe
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Đã hoàn thành (Chờ QC hoặc Lịch sử) */}
                      {isCompleted && (
                        <div className='bg-slate-50/80 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2'>
                          <p className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                            <CheckCircle2 className='w-4.5 h-4.5 text-emerald-500' />
                            Trạng thái công việc: {wo.status === 'quality_check' ? 'Đã rửa xong (Đang chờ kiểm định QC)' : 'Đã kiểm duyệt QC thành công'}
                          </p>
                          <p className='text-xs text-slate-400 leading-relaxed font-medium'>
                            {wo.status === 'quality_check' 
                              ? 'Đã gửi báo cáo hoàn tất cho Cashier/Manager. Hiện tại xe đang ở khu vực bàn giao hoặc chờ đánh giá chất lượng (QC).'
                              : 'Xe đã được kiểm duyệt chất lượng đạt tiêu chuẩn và sẵn sàng bàn giao cho khách hàng.'}
                          </p>

                          {/* Kết quả QC của manager nếu có */}
                          {wo.qcPassed !== undefined && wo.qcPassed !== null && (
                            <div className='mt-2 p-3 bg-white border border-slate-100 rounded-xl text-xs'>
                              <div className='font-bold text-slate-800 flex items-center gap-1.5'>
                                {wo.qcPassed ? (
                                  <span className='text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100'>QC ĐẠT</span>
                                ) : (
                                  <span className='text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100'>QC KHÔNG ĐẠT</span>
                                )}
                                <span>Ghi chú từ quản lý:</span>
                              </div>
                              {wo.qcNote ? (
                                <p className='text-slate-500 mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100/50'>&quot;{wo.qcNote}&quot;</p>
                              ) : (
                                <p className='text-slate-400 mt-1 italic'>Không có ghi chú thêm.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={() => setPreviewPhoto(null)}>
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-150'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewPhoto} alt='Enlarged Preview' className='rounded-2xl max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/10' />
            <button 
              onClick={() => setPreviewPhoto(null)} 
              className='absolute top-3 right-3 bg-black/50 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/10 animate-pulse'
            >
              Đóng xem ảnh (Esc)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
