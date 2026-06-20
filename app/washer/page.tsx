'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  washerGetWorkOrders,
  washerStartWorkOrder,
  washerFinishWorkOrder,
  washerGetSchedule
} from '@/lib/washer-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
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
  Eye,
  Calendar,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

function WashTimer({ startedAt }: { startedAt?: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setSeconds(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs rounded-xl shadow-xs animate-pulse'>
      <span>⏱️ {formatTime(seconds)}</span>
    </div>
  );
}

interface WorkOrderData {
  id: string;
  // BE có thể trả orderId dạng chuỗi id hoặc object đã populate ({ _id }).
  orderId: string | { _id?: string; id?: string };
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

interface WasherScheduleItem {
  bookingId?: string;
  scheduledAt?: string;
  vehicle?: { licensePlate?: string };
  service?: { name?: string; durationMinutes?: number };
  customer?: { name?: string; phone?: string };
  location?: string;
  status?: string;
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
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'schedule'>('todo');
  
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

  const handleUploadPhotos = async (woId: string, files: FileList | null, type: 'pre' | 'post') => {
    if (!files) return;
    
    const rawWoPhotos = inspectionPhotos[woId];
    const woPhotos = (rawWoPhotos && typeof rawWoPhotos === 'object' && 'preWash' in rawWoPhotos)
      ? rawWoPhotos
      : { preWash: [], postWash: [] };

    const currentList = Array.isArray(type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      ? (type === 'pre' ? woPhotos.preWash : woPhotos.postWash)
      : [];
    
    const toastId = toast.loading('Đang tải ảnh lên Cloudinary...');
    try {
      const { uploadImages } = await import('@/lib/upload-api');
      const res = await uploadImages(files);
      const urls = res.data.urls;
      const updatedList = [...currentList, ...urls];
      const updatedWoPhotos = {
        ...woPhotos,
        [type === 'pre' ? 'preWash' : 'postWash']: updatedList
      };
      const newMap = { ...inspectionPhotos, [woId]: updatedWoPhotos };
      setInspectionPhotos(newMap);
      localStorage.setItem('wave_inspection_photos', JSON.stringify(newMap));
      toast.success(`Đã tải lên thành công ${urls.length} ảnh ${type === 'pre' ? 'trước khi rửa' : 'sau khi rửa'}!`, { id: toastId });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải ảnh lên.';
      toast.error(`Lỗi tải ảnh: ${errMsg}`, { id: toastId });
    }
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
  const { data: workOrdersRes, isLoading: isLoadingWO, refetch: refetchWO, isRefetching: isRefetchingWO } = useQuery({
    queryKey: ['washer-work-orders', activeTab],
    queryFn: () => washerGetWorkOrders(),
  });

  // Lấy lịch trình cá nhân của thợ
  const { data: scheduleRes, isLoading: isLoadingSchedule, refetch: refetchSchedule, isRefetching: isRefetchingSchedule } = useQuery({
    queryKey: ['washer-schedule'],
    queryFn: () => washerGetSchedule(),
    enabled: activeTab === 'schedule',
  });

  const allWorkOrders: WorkOrderData[] = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];
  const scheduleItems = scheduleRes?.data ?? [];

  const isLoading = activeTab === 'schedule' ? isLoadingSchedule : isLoadingWO;
  const isRefetching = activeTab === 'schedule' ? isRefetchingSchedule : isRefetchingWO;

  const refetch = () => {
    if (activeTab === 'schedule') {
      refetchSchedule();
    } else {
      refetchWO();
    }
  };

  // Lọc work orders theo Tab hoạt động
  const workOrders = useMemo(() => {
    return allWorkOrders.filter((wo) => {
      if (activeTab === 'todo') {
        return wo.status === 'assigned' || wo.status === 'in_progress' || wo.status === 'returned';
      }
      return wo.status === 'quality_check' || wo.status === 'done';
    });
  }, [allWorkOrders, activeTab]);

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
    mutationFn: async ({ woId, photoKey, currentStatus }: { woId: string; photoKey: string; currentStatus: string }) => {
      if (currentStatus === 'returned') {
        await washerStartWorkOrder(woId);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      const rawWoPhotos = inspectionPhotos[photoKey];
      const postWashPhotos = (rawWoPhotos && typeof rawWoPhotos === 'object' && 'postWash' in rawWoPhotos)
        ? (rawWoPhotos.postWash as string[])
        : [];
      await washerFinishWorkOrder(woId, postWashPhotos);
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
                  activeTab === 'todo' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-600'
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
                  activeTab === 'completed' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-600'
                }`}
              >
                Đã hoàn thành
                {activeTab === 'completed' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full' />
                )}
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-600'
                }`}
              >
                Lịch trình cá nhân
                {activeTab === 'schedule' && (
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
          ) : activeTab === 'schedule' ? (
            scheduleItems.length === 0 ? (
              <div className='bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-md mx-auto mt-8'>
                <div className='w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 text-indigo-600'>
                  <Calendar className='w-8 h-8' />
                </div>
                <h3 className='font-heading text-lg font-black text-slate-800 mb-2'>Trống lịch trình</h3>
                <p className='text-slate-500 text-sm leading-relaxed'>
                  Hôm nay ông chủ chưa có lịch hẹn đặt trước nào được ghi nhận.
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {scheduleItems.map((item: WasherScheduleItem) => {
                  const dateStr = item.scheduledAt
                    ? new Date(item.scheduledAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })
                    : '-';
                  return (
                    <div
                      key={item.bookingId}
                      className='bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl font-mono font-black text-sm tracking-wide border border-indigo-100'>
                          {item.vehicle?.licensePlate || '-'}
                        </div>
                        <div>
                          <h4 className='font-heading font-bold text-slate-800 text-sm'>
                            {item.service?.name || 'Gói rửa xe'} ({item.service?.durationMinutes || 30} phút)
                          </h4>
                          <p className='text-xs text-slate-500 font-medium mt-0.5'>
                            Khách hàng: <span className='text-slate-700 font-bold'>{item.customer?.name || 'Khách vãng lai'}</span>
                            {item.customer?.phone && ` • SĐT: ${item.customer.phone}`}
                          </p>
                          {item.location && (
                            <p className='text-xs text-slate-500 font-semibold mt-1'>
                              Vị trí: <span className='text-indigo-600'>{item.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-col items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50'>
                        <span className='text-slate-500 text-xs font-semibold flex items-center gap-1'>
                          <Clock className='w-3.5 h-3.5' /> {dateStr}
                        </span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          item.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          item.status === 'checked_in' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          item.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {item.status === 'confirmed' && 'Chờ rửa xe'}
                          {item.status === 'checked_in' && 'Đã nhận xe'}
                          {item.status === 'in_progress' && 'Đang rửa'}
                          {item.status === 'completed' && 'Hoàn thành'}
                          {item.status === 'cancelled' && 'Đã hủy'}
                          {item.status === 'pending_payment' && 'Chờ thanh toán'}
                          {item.status === 'no_show' && 'Vắng mặt'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
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
                const customer = `Mã phiếu: ${wo.code || wo.id.slice(-6).toUpperCase()}`;
                const plate = wo.vehicleSnapshot?.plate ?? '-';
                const service = wo.serviceName ?? '-';
                // Ảnh lưu theo orderId để khớp ảnh thu ngân chụp trước khi rửa.
                // BE có thể populate orderId thành object -> chuẩn hoá về chuỗi id.
                const photoKey =
                  typeof wo.orderId === 'string'
                    ? wo.orderId
                    : (wo.orderId?._id ?? wo.orderId?.id ?? wo.id);

                const isPending = wo.status === 'assigned' || wo.status === 'waiting' || wo.status === 'returned';
                const isInProgress = wo.status === 'in_progress';
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
                          <p className='text-xs text-slate-500 font-medium'>Định danh: <span className='text-slate-600 font-bold'>{customer}</span></p>
                        </div>
                      </div>

                      {/* Status & Timer Badge */}
                      <div className='flex flex-col items-end gap-1.5'>
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
                        {isInProgress && (
                          <WashTimer startedAt={wo.updatedAt as string || wo.createdAt as string} />
                        )}
                      </div>
                    </div>

                    {/* Card Content & Active Flow */}
                    <div className='p-6'>
                      {/* Đang chuẩn bị rửa */}
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
                          <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5'>Quy trình rửa xe chuẩn WAVE</p>
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
                                  <span className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-500 font-medium' : ''}`}>
                                    {step}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Ảnh kiểm định xe - lưu theo orderId */}
                          <div className='mt-6 mb-6 border-t border-slate-100 pt-5 space-y-6'>
                            {/* 1. Trước khi rửa - CHỈ XEM (thu ngân chụp khi nhận xe) */}
                            <div>
                              <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                                <Camera className='w-4 h-4 text-amber-500' />
                                1. Ảnh trước khi rửa (Trầy xước/Móp méo có sẵn)
                              </p>

                              {((wo.checkinPhotos && (wo.checkinPhotos as string[]).length > 0) || (inspectionPhotos[photoKey]?.preWash && inspectionPhotos[photoKey].preWash.length > 0)) ? (
                                <div className='grid grid-cols-4 gap-3'>
                                  {((wo.checkinPhotos as string[]) || inspectionPhotos[photoKey]?.preWash || []).map((photo, pIdx) => (
                                    <div
                                      key={pIdx}
                                      onClick={() => setPreviewPhoto(photo)}
                                      className='group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer'
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={photo} alt='Pre-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200' />
                                      <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center'>
                                        <Eye className='w-5 h-5 text-white' />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className='p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center py-6'>
                                  <p className='text-xs font-semibold text-slate-500 italic'>Thu ngân chưa chụp ảnh hiện trạng xe lúc nhận. Ảnh sẽ hiển thị ở đây để bạn đối chiếu.</p>
                                </div>
                              )}
                            </div>

                            {/* 2. Sau khi rửa - thợ chụp/tải lên */}
                            <div>
                              <p className='text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5'>
                                <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                                2. Ảnh sau khi rửa (Nghiệm thu xe sạch đẹp)
                              </p>

                              <div className='grid grid-cols-4 gap-3'>
                                {(inspectionPhotos[photoKey]?.postWash && inspectionPhotos[photoKey].postWash.length > 0) ? (
                                  <>
                                    {inspectionPhotos[photoKey].postWash.map((photo, pIdx) => (
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
                                            onClick={() => handleDeletePhoto(photoKey, pIdx, 'post')}
                                            className='w-7 h-7 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-sm'
                                          >
                                            <Trash2 className='w-4 h-4' />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <label className='aspect-square rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200'>
                                      <Plus className='w-5 h-5 text-slate-500' />
                                      <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>Thêm ảnh</span>
                                      <input
                                        type='file'
                                        multiple
                                        accept='image/*'
                                        className='hidden'
                                        onChange={(e) => handleUploadPhotos(photoKey, e.target.files, 'post')}
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <div className='col-span-4 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center gap-2 text-center py-6'>
                                    <p className='text-xs font-semibold text-slate-500 italic'>Chưa chụp ảnh nghiệm thu sau khi rửa xe.</p>
                                    <label className='px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5'>
                                      <Plus className='w-3.5 h-3.5' /> Chụp / Tải ảnh lên
                                      <input
                                        type='file'
                                        multiple
                                        accept='image/*'
                                        className='hidden'
                                        onChange={(e) => handleUploadPhotos(photoKey, e.target.files, 'post')}
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
                              onClick={() => finishWashMutation.mutate({ woId: wo.id, photoKey, currentStatus: wo.status })}
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
                          <p className='text-xs text-slate-500 leading-relaxed font-medium'>
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
                                <p className='text-slate-500 mt-1 italic'>Không có ghi chú thêm.</p>
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
