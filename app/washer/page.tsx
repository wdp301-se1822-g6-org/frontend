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
import { getErrorMessage } from '@/lib/getErrorMessage';
import { useEffect } from 'react';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { StatusTone } from '@/constants';

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
    <div className='flex items-center gap-1.5 px-3 py-1 bg-accent border border-primary/30 text-primary font-mono font-semibold text-xs rounded-lg motion-safe:animate-pulse tabular-nums'>
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
  // BE đã bỏ luồng QC: finish là bước cuối, done là trạng thái kết thúc.
  status: 'waiting' | 'assigned' | 'in_progress' | 'done';
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

export default function WasherDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'schedule'>('todo');

  // Realtime: được giao xe mới → danh sách việc tự cập nhật, khỏi refresh.
  // Toast do NotificationSocketBridge lo (BE đã gửi notification "Bạn được giao rửa xe").
  useSocketEvent('wash:assigned', () => {
    void qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
  });

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
    
    const toastId = toast.loading('Đang tải ảnh lên...');
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
      console.error('Upload ảnh thất bại:', err);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.', { id: toastId });
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

  const allWorkOrders: WorkOrderData[] = useMemo(
    () => workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [],
    [workOrdersRes],
  );
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
        return wo.status === 'assigned' || wo.status === 'in_progress';
      }
      return wo.status === 'done';
    });
  }, [allWorkOrders, activeTab]);

  // Mutation Bắt đầu rửa xe
  const startWashMutation = useMutation({
    mutationFn: async (woId: string) => {
      await washerStartWorkOrder(woId);
    },
    onSuccess: () => {
      toast.success('Đã bắt đầu rửa xe! Cố gắng rửa thật sạch nhé bạn.');
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      toast.error('Không thể bắt đầu rửa xe.', {
        description: getErrorMessage(err),
      });
    }
  });

  // Mutation Hoàn thành rửa xe (bước cuối của luồng — BE đã bỏ QC)
  const finishWashMutation = useMutation({
    mutationFn: async ({ woId, photoKey }: { woId: string; photoKey: string }) => {
      const rawWoPhotos = inspectionPhotos[photoKey];
      const postWashPhotos = (rawWoPhotos && typeof rawWoPhotos === 'object' && 'postWash' in rawWoPhotos)
        ? (rawWoPhotos.postWash as string[])
        : [];
      await washerFinishWorkOrder(woId, postWashPhotos);
    },
    onSuccess: () => {
      toast.success('Đã hoàn thành rửa xe. Xe sẵn sàng bàn giao cho khách.');
      qc.invalidateQueries({ queryKey: ['washer-work-orders'] });
    },
    onError: (err: unknown) => {
      toast.error('Không thể hoàn thành đơn rửa xe.', {
        description: getErrorMessage(err),
      });
    }
  });

  return (
    <>
      <AdminTopbar
        title='Lịch rửa xe của tôi'
        subtitle='Nhận xe được giao, chụp ảnh nghiệm thu và hoàn thành xe sạch đẹp'
      />
      <main className='flex-1 p-4 md:p-8 overflow-y-auto bg-background'>
        <div className='max-w-4xl mx-auto'>

          {/* Header Controls */}
          <div className='flex items-center justify-between mb-6 border-b border-border pb-2'>
            <div className='flex gap-6'>
              <button
                onClick={() => setActiveTab('todo')}
                className={`pb-3 text-sm transition-colors relative ${
                  activeTab === 'todo' ? 'font-semibold text-primary' : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                Cần xử lý
                {activeTab === 'todo' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full' />
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`pb-3 text-sm transition-colors relative ${
                  activeTab === 'completed' ? 'font-semibold text-primary' : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                Đã hoàn thành
                {activeTab === 'completed' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full' />
                )}
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`pb-3 text-sm transition-colors relative ${
                  activeTab === 'schedule' ? 'font-semibold text-primary' : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                Lịch trình cá nhân
                {activeTab === 'schedule' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full' />
                )}
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted transition-colors'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className='space-y-4'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='bg-card rounded-xl p-6 border border-border animate-pulse h-48' />
              ))}
            </div>
          ) : activeTab === 'schedule' ? (
            scheduleItems.length === 0 ? (
              <div className='bg-card rounded-xl p-16 text-center border border-border shadow-xs max-w-md mx-auto mt-8'>
                <div className='w-16 h-16 rounded-xl bg-accent flex items-center justify-center mx-auto mb-6 text-primary'>
                  <Calendar className='w-8 h-8' />
                </div>
                <h3 className='font-heading text-lg font-semibold tracking-tight text-foreground mb-2'>Chưa có lịch hẹn</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  Hôm nay bạn chưa có lịch hẹn đặt trước nào. Lịch mới sẽ hiện
                  ở đây.
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
                      className='bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='px-4 py-2 bg-muted text-foreground rounded-lg font-mono font-semibold text-sm tracking-wide border border-border'>
                          {item.vehicle?.licensePlate || '-'}
                        </div>
                        <div>
                          <h4 className='font-heading font-semibold text-foreground text-sm'>
                            {item.service?.name || 'Gói rửa xe'} ({item.service?.durationMinutes || 30} phút)
                          </h4>
                          <p className='text-xs text-muted-foreground mt-0.5'>
                            Khách hàng: <span className='text-foreground font-medium'>{item.customer?.name || 'Khách vãng lai'}</span>
                            {item.customer?.phone && ` • SĐT: ${item.customer.phone}`}
                          </p>
                          {item.location && (
                            <p className='text-xs text-muted-foreground mt-1'>
                              Vị trí: <span className='text-primary font-medium'>{item.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-col items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border'>
                        <span className='text-muted-foreground text-xs flex items-center gap-1 tabular-nums'>
                          <Clock className='w-3.5 h-3.5' /> {dateStr}
                        </span>
                        <StatusBadge
                          label={
                            item.status === 'confirmed' ? 'Chờ rửa xe'
                            : item.status === 'checked_in' ? 'Đã nhận xe'
                            : item.status === 'in_progress' ? 'Đang rửa'
                            : item.status === 'completed' ? 'Hoàn thành'
                            : item.status === 'cancelled' ? 'Đã hủy'
                            : item.status === 'pending_payment' ? 'Chờ thanh toán'
                            : item.status === 'no_show' ? 'Vắng mặt'
                            : item.status ?? '-'
                          }
                          tone={
                            (item.status === 'confirmed' ? 'info'
                            : item.status === 'checked_in' ? 'warning'
                            : item.status === 'in_progress' ? 'primary'
                            : item.status === 'completed' ? 'success'
                            : item.status === 'cancelled' ? 'destructive'
                            : 'muted') as StatusTone
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : workOrders.length === 0 ? (
            <div className='bg-card rounded-xl p-16 text-center border border-border shadow-xs max-w-md mx-auto mt-8'>
              <div className='w-16 h-16 rounded-xl bg-accent flex items-center justify-center mx-auto mb-6 text-primary'>
                <Car className='w-8 h-8' />
              </div>
              <h3 className='font-heading text-lg font-semibold tracking-tight text-foreground mb-2'>Chưa có xe được giao</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {activeTab === 'todo'
                  ? 'Bạn chưa có xe nào được phân công. Xe mới sẽ hiện ở đây khi quầy giao việc.'
                  : 'Chưa có xe hoàn thành nào trong hôm nay.'}
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

                const isPending = wo.status === 'assigned' || wo.status === 'waiting';
                const isInProgress = wo.status === 'in_progress';
                const isCompleted = wo.status === 'done';

                // BE bắt buộc ≥1 ảnh sau rửa (checkoutPhotos) mới cho hoàn thành.
                // Chặn ở FE để không bấm rồi nhận lỗi 400 mơ hồ.
                const postWashCount =
                  inspectionPhotos[photoKey]?.postWash?.length ?? 0;
                const canFinish = postWashCount > 0;

                return (
                  <div
                    key={wo.id}
                    className={`bg-card rounded-xl border transition-colors shadow-xs overflow-hidden ${
                      isInProgress
                        ? 'border-primary/40 ring-1 ring-primary/20'
                        : 'border-border'
                    }`}
                  >
                    {/* Header Card */}
                    <div className='p-6 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5'>
                        <div className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-semibold text-sm tracking-wide'>
                          {plate}
                        </div>
                        <div>
                          <h4 className='font-heading font-semibold text-foreground text-sm'>{service}</h4>
                          <p className='text-xs text-muted-foreground'>Định danh: <span className='text-foreground font-medium'>{customer}</span></p>
                        </div>
                      </div>

                      {/* Status & Timer Badge */}
                      <div className='flex flex-col items-end gap-1.5'>
                        <StatusBadge
                          label={
                            wo.status === 'waiting' ? 'Chờ phân công'
                            : wo.status === 'assigned' ? 'Được giao việc'
                            : isInProgress ? 'Đang rửa'
                            : 'Hoàn thành'
                          }
                          tone={
                            (isPending ? 'warning'
                            : isInProgress ? 'primary'
                            : 'success') as StatusTone
                          }
                        />
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
                          <p className='text-muted-foreground text-sm mb-4 leading-relaxed'>
                            Xe đã được giao cho bạn phụ trách. Bấm &quot;Bắt đầu
                            làm việc&quot; để nhận xe vào khoang rửa.
                          </p>
                          <button
                            onClick={() => startWashMutation.mutate(wo.id)}
                            disabled={startWashMutation.isPending}
                            className='w-full py-3.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm transition-colors flex items-center justify-center gap-2'
                          >
                            <Play className='w-4.5 h-4.5 fill-current' />
                            Bắt đầu làm việc
                          </button>
                        </div>
                      )}

                      {/* Đang rửa xe: đối chiếu ảnh trước + chụp ảnh nghiệm thu */}
                      {isInProgress && (
                        <div>
                          {/* Ảnh kiểm định xe - lưu theo orderId */}
                          <div className='mb-6 space-y-6'>
                            {/* 1. Trước khi rửa - CHỈ XEM (thu ngân chụp khi nhận xe) */}
                            <div>
                              <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5'>
                                <Camera className='w-4 h-4' />
                                Ảnh trước khi rửa (trầy xước, móp méo có sẵn)
                              </p>

                              {((wo.checkinPhotos && (wo.checkinPhotos as string[]).length > 0) || (inspectionPhotos[photoKey]?.preWash && inspectionPhotos[photoKey].preWash.length > 0)) ? (
                                <div className='grid grid-cols-4 gap-3'>
                                  {((wo.checkinPhotos as string[]) || inspectionPhotos[photoKey]?.preWash || []).map((photo, pIdx) => (
                                    <div
                                      key={pIdx}
                                      onClick={() => setPreviewPhoto(photo)}
                                      className='group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer'
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={photo} alt='Pre-wash' className='w-full h-full object-cover' />
                                      <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center'>
                                        <Eye className='w-5 h-5 text-white' />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className='p-4 rounded-lg border border-dashed border-border bg-muted/30 text-center py-6'>
                                  <p className='text-xs text-muted-foreground'>Thu ngân chưa chụp ảnh hiện trạng xe lúc nhận. Ảnh sẽ hiển thị ở đây để bạn đối chiếu.</p>
                                </div>
                              )}
                            </div>

                            {/* 2. Sau khi rửa - thợ chụp/tải lên */}
                            <div>
                              <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5'>
                                <CheckCircle2 className='w-4 h-4' />
                                Ảnh sau khi rửa (bắt buộc — nghiệm thu xe sạch)
                              </p>

                              <div className='grid grid-cols-4 gap-3'>
                                {(inspectionPhotos[photoKey]?.postWash && inspectionPhotos[photoKey].postWash.length > 0) ? (
                                  <>
                                    {inspectionPhotos[photoKey].postWash.map((photo, pIdx) => (
                                      <div key={pIdx} className='group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted'>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo} alt='Post-wash' className='w-full h-full object-cover' />
                                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2'>
                                          <button
                                            type='button'
                                            onClick={() => setPreviewPhoto(photo)}
                                            className='w-7 h-7 bg-white/90 hover:bg-white text-slate-700 rounded-md flex items-center justify-center'
                                          >
                                            <Eye className='w-4 h-4' />
                                          </button>
                                          <button
                                            type='button'
                                            onClick={() => handleDeletePhoto(photoKey, pIdx, 'post')}
                                            className='w-7 h-7 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-md flex items-center justify-center'
                                          >
                                            <Trash2 className='w-4 h-4' />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <label className='aspect-square rounded-lg border border-dashed border-border hover:border-primary bg-muted/40 hover:bg-accent cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors'>
                                      <Plus className='w-5 h-5 text-muted-foreground' />
                                      <span className='text-[10px] font-medium text-muted-foreground'>Thêm ảnh</span>
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
                                  <div className='col-span-4 p-4 rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-center py-6'>
                                    <p className='text-xs text-muted-foreground'>Chưa có ảnh nghiệm thu sau khi rửa.</p>
                                    <label className='px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1.5'>
                                      <Plus className='w-3.5 h-3.5' /> Chụp / tải ảnh lên
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
                            {!canFinish && (
                              <div className='flex items-center gap-1.5 text-[11px] font-medium text-foreground bg-muted/60 border border-border p-2.5 rounded-lg mb-1'>
                                <AlertCircle className='w-4 h-4 shrink-0 text-primary' />
                                Cần ít nhất 1 ảnh sau khi rửa để hoàn thành và
                                bàn giao xe.
                              </div>
                            )}

                            <button
                              onClick={() => finishWashMutation.mutate({ woId: wo.id, photoKey })}
                              disabled={finishWashMutation.isPending || !canFinish}
                              className='w-full py-3.5 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <CheckCircle2 className='w-4.5 h-4.5' />
                              Hoàn thành rửa xe
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Đã hoàn thành */}
                      {isCompleted && (
                        <div className='bg-muted/40 border border-border p-4 rounded-lg flex flex-col gap-2'>
                          <p className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                            <CheckCircle2 className='w-4.5 h-4.5 text-success' />
                            Đã hoàn thành rửa xe
                          </p>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Xe đã rửa xong và sẵn sàng bàn giao cho khách hàng.
                          </p>
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
        <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4' onClick={() => setPreviewPhoto(null)}>
          <div className='relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewPhoto} alt='Enlarged Preview' className='rounded-xl max-w-full max-h-[80vh] object-contain' />
            <button
              onClick={() => setPreviewPhoto(null)}
              className='absolute top-3 right-3 bg-black/60 hover:bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg'
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
