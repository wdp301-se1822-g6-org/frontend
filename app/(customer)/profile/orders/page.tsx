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
  User2,
  X
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
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
import { getMyVehicles, submitFeedback } from '@/lib/customer-api';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { Order, OrderStatus, AvailableSlot } from '@/types/order';

interface CustomerVehicle {
  _id?: string;
  id?: string;
  nickname?: string;
  brand?: string;
  licensePlate?: string;
  vehicleTypeId?: string;
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

  // Feedback states
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wave_submitted_feedbacks');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Fetch customer vehicles for name representation
  useEffect(() => {
    getMyVehicles().then(res => {
      setVehicles(res.data?.data || res.data || []);
    }).catch(err => console.error(err));
  }, []);

  // Nghe realtime tiến trình rửa xe (tên sự kiện khớp BE: wash:started/completed).
  // KHÔNG tự connect/disconnect socket ở đây — NotificationSocketBridge quản lý
  // vòng đời kết nối chung; ở đây chỉ đăng ký/gỡ listener.
  useEffect(() => {
    const onStarted = () => {
      toast.info('Xe của bạn đang được rửa.');
      refetch();
    };
    const onCompleted = () => {
      toast.success('Xe của bạn đã rửa xong.');
      refetch();
    };
    socket.on('wash:started', onStarted);
    socket.on('wash:completed', onCompleted);

    return () => {
      socket.off('wash:started', onStarted);
      socket.off('wash:completed', onCompleted);
    };
  }, [refetch]);

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

  // Phân trang phía client (BE trả toàn bộ đơn của khách).
  const ORDERS_PER_PAGE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);
  const pagedOrders = useMemo(
    () =>
      filteredOrders.slice(
        (safePage - 1) * ORDERS_PER_PAGE,
        safePage * ORDERS_PER_PAGE,
      ),
    [filteredOrders, safePage],
  );

  // Fetch slots for reschedule
  const slotQueryParams = useMemo(() => {
    if (!reschedulingOrder || !rescheduleDate) {
      return { serviceTypeId: '', vehicleTypeId: '', from: '', to: '', enabled: false };
    }
    const fromStr = `${rescheduleDate}T00:00:00.000Z`;
    const toStr = `${rescheduleDate}T23:59:59.000Z`;
    const vehicle = vehicles.find(v => (v._id || v.id) === reschedulingOrder.vehicleId);
    return {
      serviceTypeId: reschedulingOrder.serviceTypeId,
      vehicleTypeId: vehicle?.vehicleTypeId || '',
      from: fromStr,
      to: toStr,
      enabled: !!reschedulingOrder && !!rescheduleDate && !!vehicle?.vehicleTypeId
    };
  }, [reschedulingOrder, rescheduleDate, vehicles]);

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
    const dateOnly = targetTime.split('T')[0];
    const fromStr = `${dateOnly}T00:00:00.000Z`;
    const toStr = `${dateOnly}T23:59:59.000Z`;

    const { getAvailableShifts } = await import('@/lib/customer-api');
    const res = await getAvailableShifts({ from: fromStr, to: toStr, shiftType: 'washer' });
    const shifts = res.data || [];

    const targetDate = new Date(targetTime).getTime();
    return shifts.filter((s: { startAt: string; endAt: string; currentBookings?: number; maxBookings?: number }) => {
      const start = new Date(s.startAt).getTime();
      const end = new Date(s.endAt).getTime();
      return targetDate >= start && targetDate < end && ((s.currentBookings ?? 0) < (s.maxBookings ?? 0));
    });
  };

  const getWasherInfo = (order: Order) => {
    if (!order.assignedWasherName) return null;
    return {
      name: order.assignedWasherName,
      rating: typeof order.assignedWasherAvgRating === 'number' ? order.assignedWasherAvgRating.toFixed(1) : '5.0',
      phone: order.assignedWasherPhone || 'Chưa cập nhật',
    };
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackOrder) return;
    toast.loading('Đang gửi đánh giá...');
    try {
      await submitFeedback({
        orderId: feedbackOrder.id,
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined
      });
      const updated = { ...submittedFeedbacks, [feedbackOrder.id]: true };
      setSubmittedFeedbacks(updated);
      localStorage.setItem('wave_submitted_feedbacks', JSON.stringify(updated));
      toast.dismiss();
      toast.success('Cảm ơn bạn đã gửi đánh giá dịch vụ!');
      setFeedbackOrder(null);
      setFeedbackRating(5);
      setFeedbackComment('');
    } catch (err) {
      toast.dismiss();
      console.error(err);
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể gửi đánh giá.';
      toast.error(`Lỗi: ${errMsg}`);
    }
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
          <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning font-semibold px-2.5 py-1 rounded-full shadow-xs border border-warning/30/50">
            <Clock className="w-3 h-3 animate-pulse" /> Chờ thanh toán
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-info/10 text-blue-600 font-semibold px-2.5 py-1 rounded-full border border-blue-200/50">
            <CheckCircle className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-info/10 text-sky-600 font-semibold px-2.5 py-1 rounded-full border border-sky-200/50">
            <User2 className="w-3 h-3" /> Đã check-in
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-accent text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/30/50">
            <RefreshCw className="w-3 h-3 animate-spin" /> Đang rửa xe
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success font-semibold px-2.5 py-1 rounded-full border border-success/30/50">
            <CheckCircle className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive font-semibold px-2.5 py-1 rounded-full border border-destructive/30/50">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground font-semibold px-2.5 py-1 rounded-full">
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
      <div className="inline-flex flex-col items-center justify-center border border-border rounded-md px-2.5 py-0.5 bg-muted/40 font-mono shadow-xs text-[10px] leading-none shrink-0 scale-95 origin-left">
        <div className="text-[7px] text-placeholder font-sans pb-0.5 leading-none">VIỆT NAM</div>
        <span className="font-bold text-foreground tracking-wide leading-none">{plate}</span>
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
          className="bg-primary hover:bg-primary/95 text-white rounded-xl px-5 py-2.5 font-bold shadow-lg transition-all hover:scale-102 flex items-center gap-1.5"
        >
          Đặt lịch ngay
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-border pb-1.5 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 border border-transparent",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main orders list */}
      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="size-10 text-primary" />
          <span className="text-sm text-muted-foreground">Đang tải danh sách lịch đặt...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-2 border-dashed border-border py-16 text-center rounded-xl bg-white/40">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <Calendar className="w-12 h-12 text-placeholder" />
            <p className="font-bold text-foreground">Không tìm thấy lịch hẹn nào</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Bạn chưa có lịch hẹn nào tương ứng với trạng thái lọc này.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pagedOrders.map(order => {
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
                  "border-none rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all bg-white/95 backdrop-blur-md relative",
                  isPendingPayment ? "ring-1 ring-amber-500/20" : ""
                )}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-1 space-y-3">

                    {/* Header: Service Name & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                      <span className="font-semibold text-base text-foreground tracking-tight">
                        {getServiceName(order.serviceTypeId)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Middle info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground">

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
                            "ml-1 font-semibold",
                            order.paymentStatus === 'paid'
                              ? "text-success"
                              : Number(order.amount) === 0
                                ? "text-success"
                                : "text-warning"
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
                      <div className="bg-muted/40 p-2.5 rounded-lg text-xs font-medium text-muted-foreground flex items-start gap-1.5 border border-border max-w-2xl">
                        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Ghi chú: {order.note}</span>
                      </div>
                    )}

                    {/* Washer info representation */}
                    {(order.status === 'checked_in' || order.status === 'in_progress' || order.status === 'completed') && (() => {
                      const washer = getWasherInfo(order);
                      if (!washer) {
                        return (
                          <div className="mt-3 bg-muted/40 border border-border p-3 rounded-xl flex items-center justify-between gap-3 max-w-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-placeholder text-xs border border-border">
                                ?
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Thợ rửa xe</p>
                                <p className="font-bold text-warning text-xs">Đang chờ phân công thợ</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-3 bg-accent border border-primary/30/30 p-3 rounded-xl flex items-center justify-between gap-3 max-w-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-xs border border-primary/30">
                              {washer.name[0]}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Thợ rửa xe</p>
                              <p className="font-bold text-foreground text-xs">{washer.name}</p>
                              <p className="text-[10px] text-warning font-bold">⭐ {washer.rating}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions right panel */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5 shrink-0 gap-3">
                    <div className="flex flex-col md:items-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tổng thanh toán</span>
                      <span className="text-base font-semibold text-primary tracking-tight">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPendingPayment && order.payosCheckoutUrl && (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = order.payosCheckoutUrl!}
                          className="bg-warning hover:bg-amber-600 text-white rounded-xl text-xs font-bold h-8 px-3 cursor-pointer"
                        >
                          Thanh toán
                        </Button>
                      )}

                      {order.status === 'completed' && !submittedFeedbacks[order.id] && (
                        <Button
                          size="sm"
                          onClick={() => setFeedbackOrder(order)}
                          className="bg-success hover:bg-success/90 text-white rounded-xl text-xs font-bold h-8 px-3 cursor-pointer"
                        >
                          Đánh giá thợ
                        </Button>
                      )}

                      {order.status === 'completed' && submittedFeedbacks[order.id] && (
                        <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/30 flex items-center gap-1 w-fit">
                          Đã đánh giá
                        </span>
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
                          className="rounded-xl text-xs font-semibold h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            className="pt-2"
          />
        </div>
      )}

      {/* ─── MODAL ĐỔI LỊCH (RESCHEDULE DIALOG) ─── */}
      {reschedulingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-none shadow-2xl rounded-xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">

              <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Đổi lịch hẹn rửa xe
                </h3>
                <button
                  onClick={() => {
                    setReschedulingOrder(null);
                    setRescheduleSlot('');
                    setRescheduleDate('');
                  }}
                  className="p-1 text-placeholder hover:text-muted-foreground cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Gói rửa xe đang đổi</span>
                  <span className="font-semibold text-sm text-foreground block">
                    {getServiceName(reschedulingOrder.serviceTypeId)}
                  </span>
                  <span className="text-[10px] text-placeholder font-semibold block">
                    Lịch cũ: {new Date(reschedulingOrder.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(reschedulingOrder.scheduledAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Date Picker select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Chọn ngày mới</Label>
                  <select
                    value={rescheduleDate}
                    onChange={e => {
                      setRescheduleDate(e.target.value);
                      setRescheduleSlot('');
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Chọn giờ còn trống</Label>

                  {isLoadingSlots ? (
                    <div className="flex justify-center items-center py-8">
                      <Spinner className="size-6 text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-warning font-bold bg-warning/10 p-3 border border-warning/30 rounded-xl text-center">
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
                                  ? "border-border bg-muted text-placeholder cursor-not-allowed"
                                  : "border-border bg-card hover:bg-muted/50"
                            )}
                          >
                            <span className="font-semibold text-xs text-foreground">{timeStr}</span>
                            <span className="text-[8px] font-bold mt-0.5 text-success">Trống {slot.remainingCapacity}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
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
          <Card className="w-full max-w-md border-none shadow-2xl rounded-xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">

              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-destructive/10 text-destructive mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-foreground">Bạn muốn hủy lịch rửa xe này?</h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Lịch hẹn vào lúc <span className="font-bold text-foreground">
                      {new Date(cancellingOrder.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(cancellingOrder.scheduledAt).toLocaleDateString('vi-VN')}
                    </span> sẽ bị hủy bỏ.
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="cancel-reason" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Lý do hủy lịch (không bắt buộc)
                </Label>
                <Input
                  id="cancel-reason"
                  placeholder="VD: Thay đổi kế hoạch đột xuất, có việc bận..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
                  className="bg-destructive/100 hover:bg-red-600 text-white rounded-xl text-xs font-bold px-5 h-9 cursor-pointer"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? <Spinner className="size-4" /> : 'Xác nhận hủy'}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── MODAL ĐÁNH GIÁ DỊCH VỤ (FEEDBACK DIALOG) ─── */}
      {feedbackOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">

              <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                <h3 className="font-heading text-base font-bold text-foreground">Đánh giá chất lượng rửa xe</h3>
                <button
                  onClick={() => {
                    setFeedbackOrder(null);
                    setFeedbackRating(5);
                    setFeedbackComment('');
                  }}
                  className="p-1 text-placeholder hover:text-muted-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Thợ được đánh giá */}
                <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm">
                    {getWasherInfo(feedbackOrder)?.name[0] || '?'}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Thợ phụ trách</span>
                    <span className="font-bold text-foreground text-xs block">{getWasherInfo(feedbackOrder)?.name || 'Chưa phân công'}</span>
                  </div>
                </div>

                {/* Chọn số sao */}
                <div className="space-y-2 text-center py-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Chọn mức độ hài lòng</Label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="text-2xl focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      >
                        {star <= feedbackRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-warning block">
                    {feedbackRating === 5 && 'Rất hài lòng (5 sao)'}
                    {feedbackRating === 4 && 'Hài lòng (4 sao)'}
                    {feedbackRating === 3 && 'Bình thường (3 sao)'}
                    {feedbackRating === 2 && 'Không hài lòng (2 sao)'}
                    {feedbackRating === 1 && 'Rất tệ (1 sao)'}
                  </span>
                </div>

                {/* Bình luận */}
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-comment" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Nhận xét của bạn</Label>
                  <textarea
                    id="feedback-comment"
                    placeholder="VD: Thợ rửa rất sạch, nhiệt tình, đúng giờ..."
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    rows={3}
                    className="w-full border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-primary transition-all resize-none placeholder:text-placeholder"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFeedbackOrder(null);
                    setFeedbackRating(5);
                    setFeedbackComment('');
                  }}
                  className="rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  className="bg-success hover:bg-success/90 text-white rounded-xl text-xs font-bold px-5 h-9 cursor-pointer"
                >
                  Gửi đánh giá
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
