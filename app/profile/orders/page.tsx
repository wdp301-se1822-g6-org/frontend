'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  Car, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  CreditCard,
  Loader2,
  User2
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  useMyOrders, 
  useCancelOrder, 
  useRescheduleOrder, 
  useAvailableSlots, 
  useActiveServiceTypes 
} from '@/hooks/orders/useOrders';
import { getMyVehicles } from '@/lib/customer-api';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { Order, OrderStatus, AvailableSlot, StaffShift } from '@/types/order';

interface CustomerVehicle {
  _id?: string;
  id?: string;
  nickname?: string;
  brand?: string;
  licensePlate?: string;
}

interface ServiceTypeOption {
  _id?: string;
  id?: string;
  name?: string;
}

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'processing', label: 'Đang rửa' },
  { id: 'completed', label: 'Đã hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' }
];

export default function MyOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: orders = [], isLoading: isLoadingOrders, refetch } = useMyOrders();
  const { data: serviceTypes = [] } = useActiveServiceTypes();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  
  const cancelMutation = useCancelOrder();
  const rescheduleMutation = useRescheduleOrder();

  const [activeTab, setActiveTab] = useState('all');
  
  // Dialog states
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const [reschedulingOrder, setReschedulingOrder] = useState<Order | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // Fetch customer vehicles for name representation
  useEffect(() => {
    getMyVehicles().then(res => {
      setVehicles(res.data?.data || res.data || []);
    }).catch(err => console.error(err));
  }, []);

  // Alert success booking if redirect from flow - chỉ bắn 1 lần rồi xoá query
  // (tránh chồng toast do React strict mode double-invoke / re-render).
  const successToastShown = useRef(false);
  useEffect(() => {
    if (
      searchParams.get('success') === 'true' &&
      !successToastShown.current
    ) {
      successToastShown.current = true;
      toast.success('Đặt lịch thành công! Chào mừng bạn đến với WAVE.', {
        id: 'booking-success',
      });
      router.replace('/profile/orders', { scroll: false });
    }
  }, [searchParams, router]);

  // Map serviceTypeId -> Name
  const getServiceName = (id: string) => {
    const service = serviceTypes.find((s: ServiceTypeOption) => (s._id || s.id) === id);
    return service?.name || 'Gói dịch vụ';
  };

  // Map vehicleId -> Brand & Plate
  const getVehicleInfo = (id: string) => {
    const vehicle = vehicles.find(v => (v._id || v.id) === id);
    if (!vehicle) return { name: 'Phương tiện', plate: '' };
    return {
      name: vehicle.nickname || vehicle.brand || 'Xe của tôi',
      plate: vehicle.licensePlate || ''
    };
  };

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    // Sort orders by scheduledAt descending
    const sorted = [...orders].sort((a, b) => 
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

    if (activeTab === 'all') return sorted;
    return sorted.filter(order => {
      switch (activeTab) {
        case 'pending':
          return order.status === 'pending_payment';
        case 'confirmed':
          return order.status === 'confirmed' || order.status === 'checked_in';
        case 'processing':
          return order.status === 'in_progress';
        case 'completed':
          return order.status === 'completed';
        case 'cancelled':
          return order.status === 'cancelled' || order.status === 'no_show';
        default:
          return true;
      }
    });
  }, [orders, activeTab]);

  // Fetch slots for reschedule
  const slotQueryParams = useMemo(() => {
    if (!reschedulingOrder || !rescheduleDate) {
      return { serviceTypeId: '', from: '', to: '', enabled: false };
    }
    const fromStr = `${rescheduleDate}T00:00:00.000Z`;
    const toStr = `${rescheduleDate}T23:59:59.000Z`;
    return {
      serviceTypeId: reschedulingOrder.serviceTypeId,
      from: fromStr,
      to: toStr,
      enabled: !!reschedulingOrder && !!rescheduleDate
    };
  }, [reschedulingOrder, rescheduleDate]);

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useAvailableSlots(slotQueryParams);

  // Date picker options for rescheduling (next 7 days)
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const current = new Date(today);
      current.setDate(today.getDate() + i);
      const val = current.toISOString().split('T')[0];
      const lbl = current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' (' + 
        (i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : current.toLocaleDateString('vi-VN', { weekday: 'short' })) + ')';
      dates.push({ value: val, label: lbl });
    }
    return dates;
  }, []);

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async () => {
    if (!reschedulingOrder || !rescheduleSlot) return;

    try {
      // Find selected slot in available slots to pass correct staffShiftId
      // Reschedule API in BE demands: { staffShiftId, scheduledAt }
      // AvailableSlotDto gives scheduledAt.
      // Backend controller will automatically retrieve slot, but since RescheduleOrderDto demands staffShiftId,
      // let's pass a mock or empty since we don't have direct access to staffShiftId in AvailableSlotDto,
      // OR let's check if the BE supports resolve internally.
      // Wait, let's verify BE controller for reschedule. It takes RescheduleOrderDto which requires:
      // staffShiftId and scheduledAt.
      // How does the client get staffShiftId?
      // Wait, let's look at getAvailableShifts. If availableSlots doesn't return staffShiftId, we can query active shifts!
      // In NestJS controller, let's check what RescheduleOrderDto actually demands.
      // Line 4480: "RescheduleOrderDto: { properties: { staffShiftId: { type: string }, scheduledAt: { format: date-time } }, required: [staffShiftId, scheduledAt] }"
      // Oh! It requires both. How can we get staffShiftId for a slot?
      // Actually, available-slots API returns AvailableSlotDto which has remainingCapacity and scheduledAt. It does NOT have staffShiftId!
      // But `/shifts/available` returns shifts including staffShiftId (`id`) and startAt/endAt.
      // Let's call `/shifts/available` to find a shift that covers `scheduledAt`.
      // Let's find the shift:
      toast.loading('Đang xử lý đổi lịch...');
      
      const slotsRes = await getAvailableSlotsForReschedule(reschedulingOrder.serviceTypeId, rescheduleSlot);
      if (!slotsRes || slotsRes.length === 0) {
        toast.dismiss();
        toast.error('Không tìm thấy ca trực trống tương ứng.');
        return;
      }

      await rescheduleMutation.mutateAsync({
        id: reschedulingOrder.id,
        data: {
          staffShiftId: slotsRes[0].id,
          scheduledAt: rescheduleSlot
        }
      });

      toast.dismiss();
      toast.success('Đã dời lịch thành công!');
      setReschedulingOrder(null);
      setRescheduleSlot('');
      setRescheduleDate('');
      refetch();
    } catch (error) {
      toast.dismiss();
      console.error(error);
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể dời lịch. Vui lòng thử lại!');
    }
  };

  // Quick helper to fetch active shift covering the slot
  const getAvailableSlotsForReschedule = async (serviceTypeId: string, targetTime: string) => {
    // Target time is ISO string. Fetch shifts covering this time
    const dateOnly = targetTime.split('T')[0];
    const fromStr = `${dateOnly}T00:00:00.000Z`;
    const toStr = `${dateOnly}T23:59:59.000Z`;
    
    // We can call getAvailableShifts from customer-api
    const { getAvailableShifts } = await import('@/lib/customer-api');
    const res = await getAvailableShifts({ from: fromStr, to: toStr, shiftType: 'washer' });
    const shifts = res.data || [];
    
    // Filter shifts that fully cover target time
    const targetDate = new Date(targetTime).getTime();
    return shifts.filter((s: StaffShift) => {
      const start = new Date(s.startAt).getTime();
      const end = new Date(s.endAt).getTime();
      return targetDate >= start && targetDate < end && (s.currentBookings < s.maxBookings);
    });
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async () => {
    if (!cancellingOrder) return;

    try {
      await cancelMutation.mutateAsync({
        id: cancellingOrder.id,
        data: { reason: cancelReason.trim() || undefined }
      });
      toast.success('Đã hủy lịch đặt thành công!');
      setCancellingOrder(null);
      setCancelReason('');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hủy lịch thất bại. Vui lòng thử lại!');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 font-extrabold px-2.5 py-1 rounded-full shadow-xs border border-amber-200/50">
            <Clock className="w-3 h-3 animate-pulse" /> Chờ thanh toán
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-extrabold px-2.5 py-1 rounded-full border border-blue-200/50">
            <CheckCircle className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-600 font-extrabold px-2.5 py-1 rounded-full border border-sky-200/50">
            <User2 className="w-3 h-3" /> Đã check-in
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full border border-indigo-200/50">
            <RefreshCw className="w-3 h-3 animate-spin" /> Đang rửa xe
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 font-extrabold px-2.5 py-1 rounded-full border border-emerald-200/50">
            <CheckCircle className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 font-extrabold px-2.5 py-1 rounded-full border border-rose-200/50">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 font-extrabold px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" /> Vắng mặt (No show)
          </span>
        );
      default:
        return null;
    }
  };

  const renderLicensePlate = (plate: string) => {
    if (!plate) return null;
    return (
      <div className="inline-flex flex-col items-center justify-center border border-slate-300 rounded-md px-2.5 py-0.5 bg-slate-50 font-mono shadow-xs text-[10px] leading-none shrink-0 scale-95 origin-left">
        <div className="text-[7px] text-slate-400 font-sans pb-0.5 leading-none">VIỆT NAM</div>
        <span className="font-bold text-slate-800 tracking-wide leading-none">{plate}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Lịch Sử Rửa Xe</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và quản lý lịch hẹn rửa xe của bạn tại WAVE</p>
        </div>
        <Button
          onClick={() => router.push('/booking')}
          className="bg-primary hover:bg-primary/95 text-white rounded-xl px-5 py-2.5 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-102 flex items-center gap-1.5"
        >
          Đặt lịch ngay
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-border pb-1.5 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 border border-transparent",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md shadow-primary/15"
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main orders list */}
      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Đang tải danh sách lịch đặt...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-2 border-dashed border-border py-16 text-center rounded-2xl bg-white/40">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <Calendar className="w-12 h-12 text-slate-300" />
            <p className="font-bold text-foreground">Không tìm thấy lịch hẹn nào</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Ông chủ chưa có lịch hẹn nào tương ứng với trạng thái lọc này.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const vInfo = getVehicleInfo(order.vehicleId);
            const isPendingPayment = order.status === 'pending_payment';
            const isCancellable = order.status === 'confirmed' || order.status === 'pending_payment';
            const isReschedulable = order.status === 'confirmed' || order.status === 'pending_payment';

            const timeStr = new Date(order.scheduledAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            const dateStr = new Date(order.scheduledAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            return (
              <Card 
                key={order.id}
                className={cn(
                  "border-none rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white/95 backdrop-blur-md relative",
                  isPendingPayment ? "ring-1 ring-amber-500/20" : ""
                )}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-1 space-y-3">
                    
                    {/* Header: Service Name & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                      <span className="font-black text-base text-foreground tracking-tight">
                        {getServiceName(order.serviceTypeId)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Middle info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                      
                      {/* Vehicle */}
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground font-bold">{vInfo.name}</span>
                          {renderLicensePlate(vInfo.plate)}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-foreground font-bold">{timeStr} • {dateStr}</span>
                      </div>

                      {/* Payment Method / Status */}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-foreground font-bold">
                          {order.paymentMethod === 'online' ? 'Chuyển khoản' : 'Tiền mặt'} •
                          <span className={cn(
                            "ml-1 font-extrabold",
                            order.paymentStatus === 'paid'
                              ? "text-emerald-500"
                              : Number(order.amount) === 0
                              ? "text-emerald-600"
                              : "text-amber-500"
                          )}>
                            {order.paymentStatus === 'paid'
                              ? 'Đã trả'
                              : Number(order.amount) === 0
                              ? 'Miễn phí (voucher)'
                              : 'Chưa trả'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {order.note && (
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-medium text-slate-500 flex items-start gap-1.5 border border-slate-100 max-w-2xl">
                        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Ghi chú: {order.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions right panel */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 shrink-0 gap-3">
                    <div className="flex flex-col md:items-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tổng thanh toán</span>
                      <span className="text-base font-black text-primary tracking-tight">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPendingPayment && order.payosCheckoutUrl && (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = order.payosCheckoutUrl!}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold h-8 px-3 cursor-pointer"
                        >
                          Thanh toán
                        </Button>
                      )}

                      {isReschedulable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReschedulingOrder(order);
                            // Preselect today
                            setRescheduleDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer"
                        >
                          Đổi lịch
                        </Button>
                      )}

                      {isCancellable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancellingOrder(order)}
                          className="rounded-xl text-xs font-semibold h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Hủy
                        </Button>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── MODAL ĐỔI LỊCH (RESCHEDULE DIALOG) ─── */}
      {reschedulingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Đổi lịch hẹn rửa xe
                </h3>
                <button 
                  onClick={() => {
                    setReschedulingOrder(null);
                    setRescheduleSlot('');
                    setRescheduleDate('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Gói rửa xe đang đổi</span>
                  <span className="font-extrabold text-sm text-foreground block">
                    {getServiceName(reschedulingOrder.serviceTypeId)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Lịch cũ: {new Date(reschedulingOrder.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} ngày {new Date(reschedulingOrder.scheduledAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Date Picker select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chọn ngày mới</Label>
                  <select
                    value={rescheduleDate}
                    onChange={e => {
                      setRescheduleDate(e.target.value);
                      setRescheduleSlot('');
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {dateOptions.map(d => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slots Grid */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chọn giờ còn trống</Label>
                  
                  {isLoadingSlots ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-amber-500 font-bold bg-amber-50 p-3 border border-amber-200 rounded-xl text-center">
                      Không có ca trống nào vào ngày này. Vui lòng chọn ngày khác.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {availableSlots.map((slot: AvailableSlot) => {
                        const isSelected = slot.scheduledAt === rescheduleSlot;
                        const isFull = slot.remainingCapacity <= 0;
                        const timeStr = new Date(slot.scheduledAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });

                        return (
                          <button
                            key={slot.scheduledAt}
                            type="button"
                            disabled={isFull}
                            onClick={() => setRescheduleSlot(slot.scheduledAt)}
                            className={cn(
                              "p-2.5 rounded-xl border-2 transition-all text-center cursor-pointer focus:outline-none flex flex-col items-center justify-center",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : isFull
                                ? "border-border bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-border bg-card hover:bg-slate-50"
                            )}
                          >
                            <span className="font-extrabold text-xs text-foreground">{timeStr}</span>
                            <span className="text-[8px] font-bold mt-0.5 text-emerald-500">Trống {slot.remainingCapacity}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReschedulingOrder(null);
                    setRescheduleSlot('');
                    setRescheduleDate('');
                  }}
                  className="rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  disabled={!rescheduleSlot}
                  onClick={handleRescheduleSubmit}
                  className="bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold px-5 h-9 cursor-pointer"
                >
                  Xác nhận đổi lịch
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── MODAL HỦY LỊCH (CANCEL CONFIRM DIALOG) ─── */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-red-50 text-red-500 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-foreground">Bạn muốn hủy lịch rửa xe này?</h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Lịch hẹn vào lúc <span className="font-bold text-foreground">
                      {new Date(cancellingOrder.scheduledAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} ngày {new Date(cancellingOrder.scheduledAt).toLocaleDateString('vi-VN')}
                    </span> sẽ bị hủy bỏ.
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="cancel-reason" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Lý do hủy lịch (không bắt buộc)
                </Label>
                <Input
                  id="cancel-reason"
                  placeholder="VD: Thay đổi kế hoạch đột xuất, có việc bận..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReason('');
                  }}
                  className="rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer"
                  disabled={cancelMutation.isPending}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handleCancelSubmit}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold px-5 h-9 cursor-pointer"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hủy'}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
