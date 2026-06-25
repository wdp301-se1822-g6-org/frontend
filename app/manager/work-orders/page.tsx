'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import {
  adminGetWorkOrders,
  adminAssignWasher,
  adminUpdateOrderStatus,
  adminGetWorkOrdersQueue,
  adminGetShiftStaff
} from '@/lib/admin-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  Wrench, Users, CheckCircle2,
  Clock, ChevronDown, RefreshCw,
  Camera, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  _id: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface WorkOrderData {
  id: string;
  orderId: string | {
    _id: string;
    customerName?: string;
    userId?: { fullName?: string };
    vehicleId?: { licensePlate?: string };
    licensePlate?: string;
    serviceTypeId?: { name?: string };
    serviceName?: string;
    amount?: number;
    totalPrice?: number;
    status?: string;
  };
  assignedWasherId?: string;
  assignedWasherName?: string;
  washerId?: {
    _id: string;
    fullName?: string;
    name?: string;
  };
  status: 'waiting' | 'assigned' | 'in_progress' | 'quality_check' | 'returned' | 'done';
  qcPassed?: boolean | null;
  qcNote?: string;
  createdAt?: string;
  vehicleSnapshot?: {
    plate?: string;
    vehicleTypeName?: string;
    color?: string;
  };
  serviceName?: string;
  [key: string]: unknown;
}



export default function ManagerWorkOrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'fifo'>('all');
  // Ảnh kiểm định chỉ để XEM ở trang Vận hành (thu ngân chụp ảnh trước khi rửa
  // ở trang Lịch hẹn, thợ chụp ảnh sau khi rửa). Lưu chung localStorage theo orderId.
  const [inspectionPhotos] = useState<Record<string, { preWash: string[]; postWash: string[] }>>(() => {
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

  // States cho Dialog giao việc
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<WorkOrderData | null>(null);
  const [selectedWasherId, setSelectedWasherId] = useState('');

  // Lấy danh sách Work Orders
  const { data: workOrdersRes, isLoading: isLoadingWO, refetch: refetchWO } = useQuery({
    queryKey: ['manager-work-orders'],
    queryFn: () => adminGetWorkOrders(),
  });

  // Lấy danh sách hàng đợi FIFO
  const { data: fifoQueueRes, isLoading: isLoadingFIFO, refetch: refetchFIFO } = useQuery({
    queryKey: ['manager-work-orders-queue'],
    queryFn: () => adminGetWorkOrdersQueue(),
    enabled: statusFilter === 'fifo',
  });

  // Lấy danh sách thợ rửa xe
  const { data: washersRes } = useQuery({
    queryKey: ['admin-washers'],
    queryFn: async () => {
      const res = await adminGetShiftStaff();
      const staff = res.data || [];
      return {
        data: staff.filter((s: { role: string }) => s.role === 'washer')
      };
    },
  });

  const FALLBACK_WASHERS: UserData[] = [
    {
      _id: "6a069f4666ba32cfd229da66",
      id: "6a069f4666ba32cfd229da66",
      fullName: "Default Washer",
      name: "Default Washer",
      email: "washer@washauto.local",
      role: "washer"
    },
    {
      _id: "6a070891165edfd36ae6e89b",
      id: "6a070891165edfd36ae6e89b",
      fullName: "Test Staff 1778845840",
      name: "Test Staff 1778845840",
      email: "staff1778845840@test.local",
      role: "washer"
    }
  ];

  const allWorkOrders: WorkOrderData[] = workOrdersRes?.data?.data ?? workOrdersRes?.data ?? [];
  const fifoQueue: WorkOrderData[] = fifoQueueRes?.data ?? [];
  const fetchedWashers: UserData[] = washersRes?.data?.data ?? washersRes?.data ?? [];
  const washers = fetchedWashers.length > 0 ? fetchedWashers : FALLBACK_WASHERS;

  const isPageLoading = statusFilter === 'fifo' ? isLoadingFIFO : isLoadingWO;
  const refetch = () => {
    if (statusFilter === 'fifo') {
      refetchFIFO();
    } else {
      refetchWO();
    }
  };

  // Thợ đang bận = đang được giao việc hoặc đang rửa (kể cả rửa lại sau QC).
  // Những thợ này không hiện trong danh sách để gán tiếp.
  const availableWashers = useMemo(() => {
    const busyIds = new Set(
      allWorkOrders
        .filter(
          (wo) =>
            wo.status === 'assigned' ||
            wo.status === 'in_progress' ||
            wo.status === 'returned',
        )
        .map((wo) => wo.assignedWasherId)
        .filter((id): id is string => Boolean(id)),
    );
    return washers.filter(
      (w) => !busyIds.has(w._id) && !busyIds.has(w.id ?? ''),
    );
  }, [allWorkOrders, washers]);

  // Lọc phiếu rửa xe theo trạng thái ở frontend để khớp tab
  const workOrders = useMemo(() => {
    if (statusFilter === 'fifo') {
      return fifoQueue;
    }
    return allWorkOrders.filter((wo) => {
      if (statusFilter === 'all') {
        return wo.status !== 'done'; // Chỉ hiện những phiếu đang hoạt động
      }
      if (statusFilter === 'pending') {
        return wo.status === 'waiting' || wo.status === 'assigned';
      }
      if (statusFilter === 'in_progress') {
        return wo.status === 'in_progress' || wo.status === 'returned';
      }
      return true;
    });
  }, [allWorkOrders, statusFilter, fifoQueue]);

  // Mutation giao việc cho thợ
  const assignWasherMutation = useMutation({
    mutationFn: async ({ woId, washerId }: { woId: string; washerId: string }) => {
      await adminAssignWasher(woId, washerId);
    },
    onSuccess: () => {
      toast.success('Đã phân công thợ phụ trách rửa xe thành công!');
      setIsAssignOpen(false);
      setAssignTarget(null);
      setSelectedWasherId('');
      qc.invalidateQueries({ queryKey: ['manager-work-orders'] });
      qc.invalidateQueries({ queryKey: ['manager-dashboard-workorders'] });
    },
    onError: (err) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể gán thợ.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  // Mutation hoàn thành đơn (hoàn thành trực tiếp, không qua QC phức tạp)
  const qcMutation = useMutation({
    mutationFn: async ({ targetWo }: { woId?: string; targetWo: WorkOrderData }) => {
      const oId = typeof targetWo.orderId === 'string'
        ? targetWo.orderId
        : (targetWo.orderId as { _id?: string; id?: string })?._id || (targetWo.orderId as { _id?: string; id?: string })?.id;
      if (oId) {
        await adminUpdateOrderStatus(oId, 'completed');
      }
    },
    onSuccess: () => {
      toast.success('Đã hoàn thành và đóng đơn hàng rửa xe thành công!');
      qc.invalidateQueries({ queryKey: ['manager-work-orders'] });
      qc.invalidateQueries({ queryKey: ['manager-dashboard-workorders'] });
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
    },
    onError: (err) => {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể hoàn tất đơn hàng.';
      toast.error(`Lỗi: ${errMsg}`);
    }
  });

  const handleOpenAssign = (wo: WorkOrderData) => {
    setAssignTarget(wo);
    setIsAssignOpen(true);
  };

  const handleConfirmComplete = (wo: WorkOrderData) => {
    if (confirm('Xác nhận xe đã rửa sạch đẹp và hoàn thành đơn hàng này?')) {
      qcMutation.mutate({ woId: wo.id, targetWo: wo });
    }
  };

  return (
    <>
      <AdminTopbar title='Vận hành Rửa xe' subtitle='Giao việc cho nhân viên và đánh giá chất lượng xe sau khi rửa (QC)' />
      <main className='flex-1 p-8 overflow-y-auto bg-slate-50/50'>
        <div className='max-w-7xl mx-auto'>

          {/* Status Tabs Filter */}
          <div className='flex items-center justify-between mb-8 border-b border-slate-200 pb-2'>
            <div className='flex gap-6'>
              {(['all', 'pending', 'in_progress', 'fifo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    statusFilter === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-600'
                  }`}
                >
                  {tab === 'all' && 'Tất cả phiếu'}
                  {tab === 'pending' && 'Chờ giao thợ'}
                  {tab === 'in_progress' && 'Đang rửa xe'}
                  {tab === 'fifo' && 'Hàng đợi FIFO (Hôm nay)'}
                  
                  {statusFilter === tab && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full' />
                  )}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => refetch()}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:border-slate-300 transition-all shadow-sm'
            >
              <RefreshCw className='w-3.5 h-3.5' /> Làm mới
            </button>
          </div>

          {/* Cards Grid */}
          {isPageLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48' />
              ))}
            </div>
          ) : workOrders.length === 0 ? (
            <div className='bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-lg mx-auto mt-12'>
              <div className='w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 text-indigo-600'>
                <Wrench className='w-8 h-8' />
              </div>
              <h3 className='font-heading text-lg font-black text-slate-800 mb-2'>Không tìm thấy phiếu rửa xe nào</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                Hiện tại không có xe nào ở trạng thái này. Vui lòng kiểm tra mục &quot;Đơn đặt lịch&quot; để tiến hành Check-in nhận xe mới.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {workOrders.map((wo) => {
                const customer = `Mã phiếu: ${wo.code || wo.id.slice(-6).toUpperCase()}`;
                const plate = wo.vehicleSnapshot?.plate ?? '-';
                const service = wo.serviceName ?? '-';
                // Ảnh lưu theo orderId để khớp với ảnh thu ngân chụp ở trang Lịch hẹn.
                const woOrderId =
                  typeof wo.orderId === 'string'
                    ? wo.orderId
                    : (wo.orderId?._id ?? wo.id);
                
                // Ưu tiên tên thợ BE trả kèm (manager không gọi được /admin/users),
                // fallback về danh sách washers nếu có.
                const washerObj = washers.find((w) => w._id === wo.assignedWasherId || w.id === wo.assignedWasherId);
                const washer =
                  wo.assignedWasherName ??
                  washerObj?.fullName ??
                  washerObj?.name ??
                  (wo.assignedWasherId ? 'Đã giao (Chờ nhận)' : undefined);

                const isPending = wo.status === 'waiting' || wo.status === 'assigned';
                const isInProgress = wo.status === 'in_progress' || wo.status === 'returned';
                const isCompleted = wo.status === 'quality_check';

                return (
                  <div
                    key={wo.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col p-6 relative overflow-hidden ${
                      isPending ? 'border-amber-100 hover:border-amber-200' :
                      isInProgress ? 'border-indigo-100 hover:border-indigo-200 ring-2 ring-indigo-500/5' :
                      'border-emerald-100 hover:border-emerald-200'
                    }`}
                  >
                    {/* Header: License Plate & Status Badge */}
                    <div className='flex items-center justify-between mb-4'>
                      <span className='font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl text-xs border border-indigo-100 shadow-sm'>
                        {plate}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isPending ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        isInProgress ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {wo.status === 'waiting' && 'Chờ giao thợ'}
                        {wo.status === 'assigned' && 'Đã giao thợ'}
                        {isInProgress && (wo.status === 'returned' ? 'QC Không đạt (Rửa lại)' : 'Đang rửa xe')}
                        {isCompleted && 'Chờ QC'}
                      </span>
                    </div>

                    {/* Customer & Service info */}
                    <div className='flex-1 flex flex-col gap-2.5 mb-6'>
                      <div>
                        <p className='text-slate-500 text-[10px] uppercase font-bold tracking-wider'>Định danh phiếu</p>
                        <p className='font-bold text-slate-800 text-sm'>{customer}</p>
                      </div>
                      <div>
                        <p className='text-slate-500 text-[10px] uppercase font-bold tracking-wider'>Gói dịch vụ</p>
                        <p className='font-bold text-slate-700 text-sm'>{service}</p>
                      </div>
                      
                      {/* Thợ phụ trách */}
                      <div className='mt-2 border-t border-slate-100 pt-3'>
                        <p className='text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1'>Thợ phụ trách</p>
                        {washer ? (
                          <div className='flex items-center gap-1.5 text-slate-700 text-sm font-semibold'>
                            <Users className='w-4 h-4 text-slate-500' />
                            {washer}
                          </div>
                        ) : (
                          <span className='text-amber-500 font-bold text-xs italic flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-fit'>
                            <Clock className='w-3.5 h-3.5' /> Đang đợi phân công thợ
                          </span>
                        )}
                      </div>
                      {/* Ảnh kiểm định xe (CHỈ XEM) */}
                      <div className='mt-3 space-y-3.5 border-t border-slate-100 pt-3'>
                        {/* Trước khi rửa (Check-in) */}
                        <div>
                          <p className='text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1'>
                            <Camera className='w-3.5 h-3.5 text-indigo-500' />
                            Ảnh trước khi rửa (Thu ngân chụp)
                          </p>
                          {((wo.checkinPhotos && (wo.checkinPhotos as string[]).length > 0) || (inspectionPhotos[woOrderId]?.preWash && inspectionPhotos[woOrderId].preWash.length > 0)) ? (
                            <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-thin'>
                              {((wo.checkinPhotos as string[]) || inspectionPhotos[woOrderId]?.preWash || []).map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setPreviewPhoto(photo)}
                                  className='relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer hover:border-indigo-500 transition-all shrink-0 group'
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo} alt='Pre-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                                  <div className='absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                    <Eye className='w-3 h-3 text-white' />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-xs italic text-slate-500 font-medium pl-1'>Chưa có ảnh trước khi rửa.</p>
                          )}
                        </div>

                        {/* Sau khi rửa */}
                        <div>
                          <p className='text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1'>
                            <Camera className='w-3.5 h-3.5 text-emerald-500' />
                            Ảnh sau khi rửa (Nghiệm thu sạch đẹp)
                          </p>
                          {(inspectionPhotos[woOrderId]?.postWash && inspectionPhotos[woOrderId].postWash.length > 0) ? (
                            <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-thin'>
                              {inspectionPhotos[woOrderId].postWash.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setPreviewPhoto(photo)}
                                  className='relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer hover:border-emerald-500 transition-all shrink-0 group'
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo} alt='Post-wash' className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                                  <div className='absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                    <Eye className='w-3 h-3 text-white' />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-xs italic text-slate-500 font-medium pl-1'>Chưa có ảnh sau khi rửa.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className='mt-auto pt-4 border-t border-slate-100'>
                      {isPending && (
                        <button
                          onClick={() => handleOpenAssign(wo)}
                          className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5'
                        >
                          <Users className='w-4 h-4' />
                          {wo.status === 'assigned' ? 'Đổi thợ phụ trách' : 'Giao thợ rửa xe'}
                        </button>
                      )}

                      {isInProgress && (
                        <div className='flex gap-2 w-full'>
                          <button
                            onClick={() => handleOpenAssign(wo)}
                            className='flex-1 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-1'
                          >
                            <Users className='w-3.5 h-3.5' /> Đổi thợ
                          </button>
                          <div className='flex-[1.5] bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600'>
                            <Clock className='w-4 h-4 animate-spin' /> {wo.status === 'returned' ? 'Đang rửa lại...' : 'Đang rửa...'}
                          </div>
                        </div>
                      )}

                      {isCompleted && (
                        <button
                          disabled={qcMutation.isPending}
                          onClick={() => handleConfirmComplete(wo)}
                          className='w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50'
                        >
                          <CheckCircle2 className='w-4 h-4' />
                          Xác nhận hoàn thành
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── DIALOG: Giao việc thợ rửa xe ── */}
      {isAssignOpen && assignTarget && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150'>
            <div className='flex items-center gap-3 mb-4 text-indigo-600'>
              <div className='w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center'>
                <Users className='w-5 h-5' />
              </div>
              <div>
                <h3 className='font-heading font-black text-slate-800 text-base'>Phân công thợ rửa xe</h3>
                <p className='text-xs text-slate-500'>Chọn thợ rửa xe phụ trách cho xe {assignTarget.vehicleSnapshot?.plate ?? ''}</p>
              </div>
            </div>

            <div className='mb-6'>
              <label className='block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider'>Chọn nhân viên rửa xe</label>
              <div className='relative'>
                <select
                  value={selectedWasherId}
                  onChange={(e) => setSelectedWasherId(e.target.value)}
                  disabled={availableWashers.length === 0}
                  className='w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-400'
                >
                  <option value=''>-- Chọn nhân viên đang rảnh --</option>
                  {availableWashers.map((w) => {
                    const washerId = w._id ?? w.id ?? '';
                    return (
                      <option key={washerId} value={washerId}>
                        {w.fullName ?? w.name} ({w.email})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className='absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none' />
              </div>
              {availableWashers.length === 0 && (
                <p className='mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600'>
                  <Clock className='w-3.5 h-3.5 shrink-0' />
                  Tất cả thợ đang bận (được giao việc hoặc đang rửa). Vui lòng đợi
                  thợ hoàn thành.
                </p>
              )}
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => { setIsAssignOpen(false); setAssignTarget(null); }}
                className='px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all'
              >
                Hủy bỏ
              </button>
              <button
                disabled={!selectedWasherId || assignWasherMutation.isPending}
                onClick={() => assignWasherMutation.mutate({ woId: assignTarget.id, washerId: selectedWasherId })}
                className='px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/10'
              >
                Xác nhận giao việc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Đã gỡ bỏ Dialog QC kiểm định phức tạp */}

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
