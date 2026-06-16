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
  Car,
  Camera,
  Trash2,
  Plus,
  Eye,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkOrderData {
  id: string;
  orderId: string | { _id?: string; id?: string };
  code: string;
  vehicleSnapshot?: {
    plate?: string;
    vehicleTypeName?: string;
    color?: string;
  };
  serviceName?: string;
  checkinPhotos?: string[];
  checkoutPhotos?: string[];
  status: 'waiting' | 'assigned' | 'in_progress' | 'quality_check' | 'returned' | 'done';
  qcPassed?: boolean | null;
  qcNote?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export default function WasherDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');

  const [postWashPhotos, setPostWashPhotos] = useState<Record<string, string[]>>({});
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleUploadPostWash = async (woId: string, files: FileList | null) => {
    if (!files) return;
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const { uploadImages } = await import('@/lib/upload-api');
      const res = await uploadImages(files);
      const urls: string[] = res.data.urls;
      const updated = [...(postWashPhotos[woId] ?? []), ...urls];
      setPostWashPhotos((prev) => ({ ...prev, [woId]: updated }));
      toast.success(`Đã tải lên ${urls.length} ảnh nghiệm thu!`, { id: toastId });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải ảnh lên.';
      toast.error(msg, { id: toastId });
    }
  };

  const handleDeletePostWash = (woId: string, idx: number) => {
    setPostWashPhotos((prev) => ({
      ...prev,
      [woId]: (prev[woId] ?? []).filter((_, i) => i !== idx),
    }));
    toast.success('Đã xóa ảnh.');
  };

  const { data: workOrdersRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['washer-work-orders', activeTab],
    queryFn: () => washerGetWorkOrders(),
  });

  const allWorkOrders: WorkOrderData[] = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];

  const workOrders = allWorkOrders.filter((wo) => {
    if (activeTab === 'todo') {
      return wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'returned';
    }
    return wo.status === 'quality_check' || wo.status === 'done';
  });

  const startWashMutation = useMutation({
    mutationFn: async (woId: string) => {
      const res = await washerStartWorkOrder(woId);
      return res.data as WorkOrderData;
    },
    onSuccess: () => {
      toast.success('Đã bắt đầu rửa xe! Cố gắng rửa thật sạch nhé ông chủ.');
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể bắt đầu rửa xe.';
      toast.error(`Lỗi: ${msg}`);
    }
  });

  const finishWashMutation = useMutation({
    mutationFn: async ({ woId, currentStatus, checkoutPhotos }: { woId: string; currentStatus: string; checkoutPhotos: string[] }) => {
      if (currentStatus === 'returned') {
        await washerStartWorkOrder(woId);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      await washerFinishWorkOrder(woId, checkoutPhotos);
    },
    onSuccess: (_, { woId }) => {
      toast.success('Tuyệt vời! Đã báo cáo hoàn thành rửa xe. Chờ Cashier kiểm duyệt QC.');
      setPostWashPhotos((prev) => { const next = { ...prev }; delete next[woId]; return next; });
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể gửi báo cáo hoàn thành.';
      toast.error(`Lỗi: ${msg}`);
    }
  });

  return (
    <>
      <AdminTopbar
        title='Lịch rửa xe của tôi'
        subtitle='Nơi cập nhật trạng thái làm việc và hoàn thành xe sạch đẹp'
      />
      <main className='flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-4xl mx-auto'>

          {/* Tab + Refresh */}
          <div className='flex items-center justify-between mb-6 border-b border-slate-200 pb-2'>
            <div className='flex gap-6'>
              {(['todo', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-600'
                  }`}
                >
                  {tab === 'todo' ? 'Cần xử lý' : 'Đã hoàn thành'}
                  {activeTab === tab && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full' />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:border-slate-300 transition-all shadow-sm'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Content */}
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
              <p className='text-slate-500 text-sm leading-relaxed'>
                {activeTab === 'todo'
                  ? 'Hiện tại ông chủ chưa có xe nào được phân công. Hãy nghỉ ngơi chút hoặc nhắc Cashier/Manager giao xe nhé!'
                  : 'Chưa có lịch sử xe hoàn thành nào trong hôm nay.'}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {workOrders.map((wo) => {
                const plate = wo.vehicleSnapshot?.plate ?? '-';
                const service = wo.serviceName ?? '-';
                const isPending = wo.status === 'assigned' || wo.status === 'waiting' || wo.status === 'returned';
                const isInProgress = wo.status === 'in_progress';
                const isCompleted = wo.status === 'quality_check' || wo.status === 'done';
                const checkinPhotos: string[] = Array.isArray(wo.checkinPhotos) ? wo.checkinPhotos : [];
                const checkoutPhotosFromApi: string[] = Array.isArray(wo.checkoutPhotos) ? wo.checkoutPhotos : [];
                const postPhotos: string[] = isInProgress
                  ? (postWashPhotos[wo.id] ?? [])
                  : checkoutPhotosFromApi;

                return (
                  <div
                    key={wo.id}
                    className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
                      isPending ? 'border-amber-100 hover:border-amber-200' :
                      isInProgress ? 'border-indigo-200 ring-2 ring-indigo-500/5' :
                      'border-emerald-100'
                    }`}
                  >
                    {/* Card Header */}
                    <div className='p-6 border-b border-slate-100/60 bg-slate-50/30 flex flex-wrap items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5'>
                        <div className='px-4 py-2 bg-indigo-600 text-white rounded-2xl font-mono font-black text-sm tracking-wide shadow-md shadow-indigo-600/10 border border-indigo-500'>
                          {plate}
                        </div>
                        <div>
                          <h4 className='font-heading font-bold text-slate-800 text-sm'>{service}</h4>
                          <p className='text-xs text-slate-500 font-medium'>
                            Mã phiếu: <span className='text-slate-600 font-bold'>{wo.code || wo.id.slice(-6).toUpperCase()}</span>
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-black ${
                        isPending ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        isInProgress ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {wo.status === 'waiting' && 'Chờ phân công'}
                        {wo.status === 'assigned' && 'Được giao việc'}
                        {wo.status === 'returned' && 'QC Không đạt (Rửa lại)'}
                        {isInProgress && 'Đang tiến hành rửa'}
                        {wo.status === 'quality_check' && 'Chờ QC'}
                        {wo.status === 'done' && 'Hoàn thành sạch đẹp'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className='p-6'>

                      {/* Chờ bắt đầu */}
                      {isPending && (
                        <div className='text-center py-6 max-w-sm mx-auto'>
                          <p className='text-slate-500 text-sm mb-4 leading-relaxed font-medium'>
                            {wo.status === 'returned'
                              ? 'Xe không đạt tiêu chuẩn kiểm định QC. Hãy click "Bắt đầu làm việc" để tiến hành rửa lại.'
                              : 'Xe đã được giao cho bạn phụ trách. Hãy click "Bắt đầu làm việc" để nhận xe vào khoang rửa.'}
                          </p>
                          <button
                            onClick={() => startWashMutation.mutate(wo.id)}
                            disabled={startWashMutation.isPending}
                            className='w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group'
                          >
                            <Play className='w-4 h-4 fill-white group-hover:scale-110 transition-transform' />
                            Bắt đầu làm việc ngay
                          </button>
                        </div>
                      )}

                      {/* Đang rửa */}
                      {isInProgress && (
                        <div className='space-y-6'>

                          {/* Ảnh check-in của thu ngân */}
                          <div>
                            <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                              <Camera className='w-4 h-4 text-amber-500' />
                              Ảnh check-in hiện trạng xe (Thu ngân chụp lúc nhận)
                            </p>
                            {checkinPhotos.length > 0 ? (
                              <div className='grid grid-cols-4 gap-3'>
                                {checkinPhotos.map((photo, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setPreviewPhoto(photo)}
                                    className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer'
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photo} alt='Check-in' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                    <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                      <Eye className='w-5 h-5 text-white' />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className='p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center py-6'>
                                <p className='text-xs font-semibold text-slate-500 italic'>Thu ngân chưa chụp ảnh hiện trạng xe lúc nhận.</p>
                              </div>
                            )}
                          </div>

                          {/* Ảnh sau khi rửa - washer tải lên */}
                          <div>
                            <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                              <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                              Ảnh sau khi rửa (Nghiệm thu xe sạch đẹp)
                            </p>
                            <div className='grid grid-cols-4 gap-3'>
                              {postPhotos.map((photo, idx) => (
                                <div key={idx} className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50'>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo} alt='Post-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                  <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                                    <button
                                      type='button'
                                      onClick={() => setPreviewPhoto(photo)}
                                      className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-lg flex items-center justify-center shadow-sm'
                                    >
                                      <Eye className='w-4 h-4' />
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => handleDeletePostWash(wo.id, idx)}
                                      className='w-7 h-7 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-sm'
                                    >
                                      <Trash2 className='w-4 h-4' />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <label className='aspect-square rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200'>
                                <Plus className='w-5 h-5 text-slate-400' />
                                <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                                  {postPhotos.length > 0 ? 'Thêm ảnh' : 'Tải ảnh lên'}
                                </span>
                                <input
                                  type='file'
                                  multiple
                                  accept='image/*'
                                  className='hidden'
                                  onChange={(e) => handleUploadPostWash(wo.id, e.target.files)}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Hoàn thành */}
                          <button
                            onClick={() => finishWashMutation.mutate({ woId: wo.id, currentStatus: wo.status, checkoutPhotos: postWashPhotos[wo.id] ?? [] })}
                            disabled={finishWashMutation.isPending}
                            className='w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2'
                          >
                            <CheckCircle2 className='w-4.5 h-4.5' />
                            Hoàn thành rửa xe
                          </button>
                        </div>
                      )}

                      {/* Đã hoàn thành */}
                      {isCompleted && (() => {
                        const isExpanded = expandedId === wo.id;
                        return (
                          <div className='flex flex-col gap-3'>
                            <button
                              type='button'
                              onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                              className='w-full bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-3 transition-all text-left'
                            >
                              <p className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                                <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0' />
                                {wo.status === 'quality_check' ? 'Đã rửa xong — Đang chờ kiểm định QC' : 'Đã kiểm duyệt QC thành công'}
                              </p>
                              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div className='flex flex-col gap-4 pt-1'>
                                {/* QC result */}
                                {wo.qcPassed !== undefined && wo.qcPassed !== null && (
                                  <div className='p-3 bg-white border border-slate-100 rounded-2xl text-xs'>
                                    <div className='font-bold text-slate-800 flex items-center gap-1.5 mb-1.5'>
                                      {wo.qcPassed ? (
                                        <span className='text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100'>QC ĐẠT</span>
                                      ) : (
                                        <span className='text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100'>QC KHÔNG ĐẠT</span>
                                      )}
                                      <span className='text-slate-500 font-medium'>Ghi chú từ quản lý:</span>
                                    </div>
                                    {wo.qcNote ? (
                                      <p className='text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100/50'>&quot;{wo.qcNote}&quot;</p>
                                    ) : (
                                      <p className='text-slate-400 italic'>Không có ghi chú thêm.</p>
                                    )}
                                  </div>
                                )}

                                {/* Ảnh check-in */}
                                <div>
                                  <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5'>
                                    <Camera className='w-3.5 h-3.5 text-amber-500' />
                                    Ảnh check-in (Thu ngân chụp lúc nhận)
                                  </p>
                                  {checkinPhotos.length > 0 ? (
                                    <div className='grid grid-cols-4 gap-2.5'>
                                      {checkinPhotos.map((photo, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => setPreviewPhoto(photo)}
                                          className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer'
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={photo} alt='Check-in' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                          <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                            <Eye className='w-4 h-4 text-white' />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className='text-xs text-slate-400 italic'>Thu ngân chưa chụp ảnh hiện trạng.</p>
                                  )}
                                </div>

                                {/* Ảnh sau khi rửa */}
                                <div>
                                  <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5'>
                                    <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500' />
                                    Ảnh nghiệm thu (Sau khi rửa)
                                  </p>
                                  {postPhotos.length > 0 ? (
                                    <div className='grid grid-cols-4 gap-2.5'>
                                      {postPhotos.map((photo, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => setPreviewPhoto(photo)}
                                          className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer'
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={photo} alt='Post-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                          <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                            <Eye className='w-4 h-4 text-white' />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className='text-xs text-slate-400 italic'>Chưa có ảnh nghiệm thu.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {previewPhoto && (
        <div
          className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={() => setPreviewPhoto(null)}
        >
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-150'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewPhoto} alt='Preview' className='rounded-2xl max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/10' />
            <button
              onClick={() => setPreviewPhoto(null)}
              className='absolute top-3 right-3 bg-black/50 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/10'
            >
              Đóng (Esc)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
