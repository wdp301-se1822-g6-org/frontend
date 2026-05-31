'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  Bike, 
  Plus, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Loader2,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  Ticket,
  Sparkles,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMyVehicles, getActiveVehicleTypes, createVehicle } from '@/lib/customer-api';
import {
  useActiveServiceTypes,
  useAvailableSlots,
  useCreateOrder,
  useMyVouchers,
  useMyLoyalty,
  usePreviewOrder,
} from '@/hooks/orders/useOrders';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type {
  ServiceType as ServiceTypeBase,
  AvailableSlot,
  Voucher,
} from '@/types/order';

type ServiceTypeItem = ServiceTypeBase & { _id?: string };

interface Vehicle {
  id?: string;
  _id?: string;
  vehicleTypeId: string;
  licensePlate: string;
  nickname?: string;
  brand?: string;
  model?: string;
  color?: string;
  isDefault: boolean;
}

interface VehicleType {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
}

export default function BookingPage() {
  return (
    <AuthGuard>
      <BookingFlow />
    </AuthGuard>
  );
}

function BookingFlow() {
  const router = useRouter();
  const createOrderMutation = useCreateOrder();

  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [note, setNote] = useState<string>('');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [voucherCodeError, setVoucherCodeError] = useState<string>('');

  // Add vehicle modal/form in step 1
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    vehicleTypeId: '',
    licensePlate: '',
    nickname: '',
    brand: '',
    model: '',
    color: '',
  });
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  const fetchVehiclesAndTypes = useCallback(async () => {
    try {
      const [vehiclesRes, typesRes] = await Promise.all([
        getMyVehicles(),
        getActiveVehicleTypes()
      ]);
      const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
      const tData = typesRes.data?.data || typesRes.data || [];
      setVehicles(vData);
      setVehicleTypes(tData);

      // Pre-select default vehicle
      const defaultVehicle = vData.find((v: Vehicle) => v.isDefault);
      if (defaultVehicle) {
        setSelectedVehicleId(defaultVehicle._id || defaultVehicle.id || '');
      } else if (vData.length > 0) {
        setSelectedVehicleId(vData[0]._id || vData[0].id || '');
      }

      if (tData.length > 0) {
        setNewVehicleData(prev =>
          prev.vehicleTypeId
            ? prev
            : { ...prev, vehicleTypeId: tData[0]._id || tData[0].id || '' }
        );
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu phương tiện:', error);
      toast.error('Không thể tải danh sách xe. Vui lòng tải lại trang.');
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  // Fetch initial data for Step 1
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [vehiclesRes, typesRes] = await Promise.all([
          getMyVehicles(),
          getActiveVehicleTypes()
        ]);
        if (!active) return;
        const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
        const tData = typesRes.data?.data || typesRes.data || [];
        setVehicles(vData);
        setVehicleTypes(tData);

        const defaultVehicle = vData.find((v: Vehicle) => v.isDefault);
        if (defaultVehicle) {
          setSelectedVehicleId(defaultVehicle._id || defaultVehicle.id || '');
        } else if (vData.length > 0) {
          setSelectedVehicleId(vData[0]._id || vData[0].id || '');
        }

        if (tData.length > 0) {
          setNewVehicleData(prev =>
            prev.vehicleTypeId
              ? prev
              : { ...prev, vehicleTypeId: tData[0]._id || tData[0].id || '' }
          );
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu phương tiện:', error);
        toast.error('Không thể tải danh sách xe. Vui lòng tải lại trang.');
      } finally {
        if (active) setIsLoadingVehicles(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Pre-select today or tomorrow as date when step 3 starts
  const goToStep3 = () => {
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    }
    setStep(3);
  };

  // Date range for picking (Next 7 days)
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const current = new Date(today);
      current.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      
      let label = current.toLocaleDateString('vi-VN', { weekday: 'long' });
      // Capitalize first letter
      label = label.charAt(0).toUpperCase() + label.slice(1);
      if (isToday) label = 'Hôm nay';
      if (isTomorrow) label = 'Ngày mai';

      dates.push({
        value: current.toISOString().split('T')[0],
        label,
        dateFormatted: current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      });
    }
    return dates;
  }, []);

  // Fetch slots based on service type & selected date
  const slotQueryParams = useMemo(() => {
    if (!selectedServiceId || !selectedDate) {
      return { serviceTypeId: '', from: '', to: '', enabled: false };
    }
    // API available-slots expects from & to as ISO string.
    // Query exact selected date: from start of day to end of day.
    const fromStr = `${selectedDate}T00:00:00.000Z`;
    const toStr = `${selectedDate}T23:59:59.000Z`;
    return {
      serviceTypeId: selectedServiceId,
      from: fromStr,
      to: toStr,
      enabled: step === 3
    };
  }, [selectedServiceId, selectedDate, step]);

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useAvailableSlots(slotQueryParams);

  // Active Service Types
  const { data: serviceTypes = [], isLoading: isLoadingServices } = useActiveServiceTypes();

  // Selected details helpers
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => (v._id || v.id) === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  const selectedService = useMemo(() => {
    return serviceTypes.find((s: ServiceTypeItem) => (s._id || s.id) === selectedServiceId);
  }, [serviceTypes, selectedServiceId]);

  // ─── Tiến độ voucher rửa miễn phí (mốc 10 lần rửa) ───
  const { data: myLoyalty } = useMyLoyalty();
  const WASHES_PER_FREE_VOUCHER = 10; // khớp BE
  const towardVoucher = myLoyalty?.successfulWashesTowardVoucher ?? 0;
  const washesToVoucher = Math.max(WASHES_PER_FREE_VOUCHER - towardVoucher, 0);

  // ─── Voucher & xem trước giá ───
  const { data: myVouchers = [] } = useMyVouchers('unused');
  // BE đã lọc status=unused và cron tự đẩy voucher hết hạn sang EXPIRED.
  // Nếu vẫn lọt voucher hết hạn, preview/create sẽ trả voucherError để hiển thị.
  const validVouchers = useMemo(
    () => (myVouchers as Voucher[]).filter((v) => v.status === 'unused'),
    [myVouchers],
  );

  const serviceVoucherEligible = selectedService
    ? (selectedService as ServiceTypeItem).isVoucherEligible !== false
    : true;

  const { data: preview } = usePreviewOrder({
    serviceTypeId: selectedServiceId,
    scheduledAt: selectedSlot,
    voucherId: selectedVoucherId || undefined,
    enabled: step === 4 && !!selectedServiceId && !!selectedSlot,
  });

  const isFreeOrder = preview?.amount === 0;
  // Đơn 0đ buộc thanh toán tiền mặt — BE từ chối online khi total = 0.
  const effectivePaymentMethod: 'online' | 'cash' = isFreeOrder
    ? 'cash'
    : paymentMethod;

  // Bộ lọc dịch vụ thông minh dựa trên Loại xe đã chọn ở Bước 1
  const selectedVehicleType = useMemo(() => {
    if (!selectedVehicle) return '';
    const foundType = vehicleTypes.find(t => (t._id || t.id) === selectedVehicle.vehicleTypeId);
    return foundType?.name || '';
  }, [selectedVehicle, vehicleTypes]);

  const filteredServiceTypes = useMemo(() => {
    if (!selectedVehicleType) return serviceTypes;
    
    const isMotorbike = selectedVehicleType.toLowerCase().includes('motor') || 
                        selectedVehicleType.toLowerCase().includes('xe máy');
                        
    return serviceTypes.filter((service: ServiceTypeItem) => {
      const nameLower = service.name.toLowerCase();
      const descLower = (service.description || '').toLowerCase();
      
      if (isMotorbike) {
        // Chỉ hiện các gói dành cho Xe máy hoặc các gói chung không ghi rõ ô tô
        return nameLower.includes('xe máy') || nameLower.includes('motorbike') || nameLower.includes('moto') ||
               (!nameLower.includes('ô tô') && !nameLower.includes('car') && !nameLower.includes('suv') && !nameLower.includes('sedan') &&
                !descLower.includes('ô tô') && !descLower.includes('car'));
      } else {
        // Chỉ hiện các gói dành cho Ô tô hoặc các gói chung không ghi rõ xe máy
        return nameLower.includes('ô tô') || nameLower.includes('car') || nameLower.includes('suv') || nameLower.includes('sedan') ||
               (!nameLower.includes('xe máy') && !nameLower.includes('motorbike') && !nameLower.includes('moto') &&
                !descLower.includes('xe máy') && !descLower.includes('motorbike'));
      }
    });
  }, [serviceTypes, selectedVehicleType]);

  // Handle Quick Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleData.licensePlate.trim()) {
      toast.warning('Vui lòng nhập biển số xe');
      return;
    }
    setIsSavingVehicle(true);
    try {
      const res = await createVehicle({
        vehicleTypeId: newVehicleData.vehicleTypeId,
        licensePlate: newVehicleData.licensePlate.trim().toUpperCase(),
        nickname: newVehicleData.nickname.trim() || undefined,
        brand: newVehicleData.brand.trim() || undefined,
        model: newVehicleData.model.trim() || undefined,
        color: newVehicleData.color.trim() || undefined,
        isDefault: vehicles.length === 0
      });
      toast.success('Đã thêm xe mới thành công!');
      const addedVehicle = res.data;
      
      // Refresh vehicles and select the newly added one
      await fetchVehiclesAndTypes();
      if (addedVehicle) {
        setSelectedVehicleId(addedVehicle._id || addedVehicle.id || '');
      }
      setIsAddingVehicle(false);
    } catch (error) {
      console.error('Lỗi khi thêm xe nhanh:', error);
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra khi thêm xe');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  // Submit flow
  const handleSubmitBooking = async () => {
    if (!selectedVehicleId || !selectedServiceId || !selectedSlot) {
      toast.error('Vui lòng hoàn tất đầy đủ các bước trước khi đặt!');
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        vehicleId: selectedVehicleId,
        serviceTypeId: selectedServiceId,
        scheduledAt: selectedSlot,
        paymentMethod: effectivePaymentMethod,
        note: note.trim() || undefined,
        voucherId: selectedVoucherId || undefined
      });

      toast.success('Đặt lịch thành công!');

      if (effectivePaymentMethod === 'online' && order.payosCheckoutUrl) {
        toast.info('Đang chuyển hướng đến cổng thanh toán PayOS...');
        // Chuyển hướng đến cổng thanh toán
        window.location.href = order.payosCheckoutUrl;
      } else {
        // Trực tiếp đưa về trang đơn hàng
        router.push('/profile/orders?success=true');
      }
    } catch (error) {
      console.error('Lỗi đặt lịch:', error);
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại!');
    }
  };

  // UI rendering of steps indicator
  const renderStepsIndicator = () => {
    const steps = [
      { num: 1, title: 'Chọn xe' },
      { num: 2, title: 'Chọn gói' },
      { num: 3, title: 'Chọn thời gian' },
      { num: 4, title: 'Xác nhận' }
    ];
    return (
      <div className="flex items-center justify-between max-w-xl mx-auto mb-6 px-4">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => step > s.num && setStep(s.num)}
              disabled={step <= s.num}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all cursor-pointer",
                step === s.num
                  ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30"
                  : step > s.num
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </button>
            <span className={cn(
              "hidden sm:inline text-xs font-bold ml-2",
              step === s.num ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.title}
            </span>
            {idx < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4",
                step > s.num ? "bg-emerald-500" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderLicensePlate = (plate: string) => {
    return (
      <div className="inline-flex flex-col items-center justify-center border border-slate-300 rounded-md px-3 py-1 bg-slate-50 font-mono shadow-xs">
        <div className="text-[8px] tracking-wider text-slate-400 font-sans leading-none">VIỆT NAM</div>
        <span className="text-xs font-bold text-slate-800 tracking-wide pt-0.5 leading-none">{plate}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 pt-8 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Banner header */}
        <div className="relative mb-5 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer rounded-xl px-3 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Về trang chủ</span>
          </Button>
          <div className="text-center">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Đặt lịch rửa xe
            </h1>
            <p className="hidden text-muted-foreground text-[13px] sm:block">
              Hoàn tất 4 bước để đặt lịch và thanh toán
            </p>
          </div>
          {/* Spacer cân đối với nút Về trang chủ để tiêu đề căn giữa */}
          <div className="w-9 shrink-0 sm:w-29" aria-hidden />
        </div>

        {/* Steps navigation */}
        {renderStepsIndicator()}

        {/* Tiến độ voucher rửa miễn phí (hiển thị mọi bước) */}
        {myLoyalty && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-bold text-amber-800">
                  {washesToVoucher > 0 ? (
                    <>
                      Còn <span className="font-black">{washesToVoucher}</span> lần rửa nữa để nhận voucher rửa miễn phí!
                    </>
                  ) : (
                    'Tuyệt vời — bạn sắp nhận voucher rửa miễn phí!'
                  )}
                </p>
                <span className="text-xs font-black text-amber-700 shrink-0">
                  {towardVoucher}/{WASHES_PER_FREE_VOUCHER}
                </span>
              </div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min((towardVoucher / WASHES_PER_FREE_VOUCHER) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Step Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Step content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <CardContent className="p-5 sm:p-6">
                
                {/* ──────── STEP 1: CHỌN XE ──────── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                        <Car className="w-5 h-5 text-primary" /> Bước 1: Chọn Xe Của Bạn
                      </h2>
                      {!isAddingVehicle && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsAddingVehicle(true)}
                          className="text-xs text-primary font-bold flex items-center gap-1 hover:bg-primary/5 rounded-lg px-2.5 py-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm xe nhanh
                        </Button>
                      )}
                    </div>

                    {isAddingVehicle ? (
                      <Card className="border border-primary/20 bg-primary/5 rounded-2xl overflow-hidden p-6 animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleAddVehicle} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-4">
                            <span className="font-bold text-primary text-sm">Thêm phương tiện mới</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingVehicle(false)}
                              className="text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biển số *</Label>
                              <Input
                                required
                                placeholder="51A-12345"
                                value={newVehicleData.licensePlate}
                                onChange={e => setNewVehicleData({...newVehicleData, licensePlate: e.target.value})}
                                className="bg-white rounded-xl uppercase font-mono font-bold border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại xe *</Label>
                              <select
                                value={newVehicleData.vehicleTypeId}
                                onChange={e => setNewVehicleData({...newVehicleData, vehicleTypeId: e.target.value})}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              >
                                {vehicleTypes.map(t => (
                                  <option key={t._id || t.id} value={t._id || t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biệt danh / Tên gọi</Label>
                            <Input
                              placeholder="Xe đi làm, xe ga..."
                              value={newVehicleData.nickname}
                              onChange={e => setNewVehicleData({...newVehicleData, nickname: e.target.value})}
                              className="bg-white rounded-xl border-slate-200"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hãng xe</Label>
                              <Input
                                placeholder="Honda..."
                                value={newVehicleData.brand}
                                onChange={e => setNewVehicleData({...newVehicleData, brand: e.target.value})}
                                className="bg-white rounded-xl text-xs h-9 border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dòng xe</Label>
                              <Input
                                placeholder="Wave..."
                                value={newVehicleData.model}
                                onChange={e => setNewVehicleData({...newVehicleData, model: e.target.value})}
                                className="bg-white rounded-xl text-xs h-9 border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Màu sắc</Label>
                              <Input
                                placeholder="Đen..."
                                value={newVehicleData.color}
                                onChange={e => setNewVehicleData({...newVehicleData, color: e.target.value})}
                                className="bg-white rounded-xl text-xs h-9 border-slate-200"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddingVehicle(false)}
                              className="rounded-xl text-xs h-9 px-4 cursor-pointer"
                              disabled={isSavingVehicle}
                            >
                              Quay lại
                            </Button>
                            <Button
                              type="submit"
                              className="bg-primary hover:bg-primary/95 text-white rounded-xl text-xs h-9 px-5 cursor-pointer"
                              disabled={isSavingVehicle}
                            >
                              {isSavingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu & Chọn'}
                            </Button>
                          </div>
                        </form>
                      </Card>
                    ) : isLoadingVehicles ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Đang tải danh sách xe...</span>
                      </div>
                    ) : vehicles.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl bg-slate-50/50 p-6">
                        <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-foreground mb-1">Chưa có phương tiện nào trong garage của bạn</p>
                        <p className="text-xs text-muted-foreground mb-4">Bạn cần đăng ký thông tin xe để tiếp tục đặt lịch rửa xe.</p>
                        <Button
                          onClick={() => setIsAddingVehicle(true)}
                          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-4 cursor-pointer"
                        >
                          Thêm Phương Tiện Ngay
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {vehicles.map(v => {
                          const isSelected = (v._id || v.id) === selectedVehicleId;
                          const foundType = vehicleTypes.find(t => (t._id || t.id) === v.vehicleTypeId);
                          const isMotor = foundType?.name.toLowerCase().includes('motor') || foundType?.name.toLowerCase().includes('xe máy');

                          return (
                            <button
                              key={v._id || v.id}
                              onClick={() => setSelectedVehicleId(v._id || v.id || '')}
                              className={cn(
                                "text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[120px] cursor-pointer hover:shadow-md relative",
                                isSelected 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs" 
                                  : "border-border bg-card"
                              )}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "p-1.5 rounded-lg text-xs",
                                    isSelected ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                                  )}>
                                    {isMotor ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <span className="font-black text-sm block leading-tight text-foreground truncate max-w-[120px]">
                                      {v.nickname || v.brand || 'Phương tiện'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block">
                                      {foundType?.name || 'Chưa rõ loại'}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="absolute top-3 right-3 bg-primary text-white p-0.5 rounded-full">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-center justify-between w-full">
                                {renderLicensePlate(v.licensePlate)}
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {v.color || 'Màu tùy chọn'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <Button
                        disabled={!selectedVehicleId}
                        onClick={() => setStep(2)}
                        className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6 py-2.5 shadow-lg shadow-primary/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
                      >
                        Tiếp theo <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ──────── STEP 2: CHỌN GÓI DỊCH VỤ ──────── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-primary" /> Bước 2: Chọn Gói Dịch Vụ
                    </h2>

                    {isLoadingServices ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Đang tải danh sách gói rửa xe...</span>
                      </div>
                    ) : filteredServiceTypes.length === 0 ? (
                      <p className="text-center py-10 text-muted-foreground text-sm">Chưa có dịch vụ nào phù hợp với loại xe này.</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredServiceTypes.map((service: ServiceTypeItem) => {
                          const isSelected = (service._id || service.id) === selectedServiceId;
                          return (
                            <button
                              key={service._id || service.id}
                              onClick={() => {
                                setSelectedServiceId(service._id || service.id || '');
                                setSelectedVoucherId('');
                              }}
                              className={cn(
                                "w-full text-left p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:shadow-md relative",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                                  : "border-border bg-card"
                              )}
                            >
                              <div className="flex-1 space-y-1 max-w-md">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-black text-base text-foreground tracking-tight">
                                    {service.name}
                                  </span>
                                  {service.pointsMultiplier > 1 && (
                                    <span className="text-[9px] bg-yellow-400/20 text-yellow-600 font-extrabold px-2 py-0.5 rounded-full">
                                      x{service.pointsMultiplier} Điểm
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                  {service.description || 'Dịch vụ chuyên nghiệp toàn diện cho chiếc xe của bạn'}
                                </p>
                                
                                {/* Checklist preview */}
                                {service.checklistTemplate && service.checklistTemplate.length > 0 && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
                                    {service.checklistTemplate.slice(0, 3).map((item: string, i: number) => (
                                      <span key={i} className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                                        <Check className="w-3 h-3 text-emerald-500" /> {item}
                                      </span>
                                    ))}
                                    {service.checklistTemplate.length > 3 && (
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        +{service.checklistTemplate.length - 3} bước khác
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 pt-3 sm:pt-0 shrink-0">
                                <span className="font-black text-lg text-primary">
                                  {formatCurrency(Number(service.basePrice))}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  khoảng {service.estimatedMinutes} phút hoàn thành
                                </span>
                              </div>

                              {isSelected && (
                                <span className="absolute top-3 right-3 bg-primary text-white p-0.5 rounded-full">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="rounded-xl font-bold px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                      </Button>
                      <Button
                        disabled={!selectedServiceId}
                        onClick={goToStep3}
                        className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6 py-2.5 shadow-lg shadow-primary/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
                      >
                        Tiếp theo <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ──────── STEP 3: CHỌN NGÀY & GIỜ TRỐNG ──────── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" /> Bước 3: Chọn Ngày & Giờ Rửa Xe
                    </h2>

                    {/* Date Horizontal Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Chọn ngày rửa xe</Label>
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                        {dateOptions.map(d => {
                          const isSelected = d.value === selectedDate;
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => {
                                setSelectedDate(d.value);
                                setSelectedSlot(''); // reset slot khi đổi ngày
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[85px] cursor-pointer focus:outline-none shrink-0",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                                  : "border-border bg-card hover:bg-slate-50"
                              )}
                            >
                              <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-primary" : "text-slate-400")}>
                                {d.label}
                              </span>
                              <span className="text-lg font-black text-foreground mt-0.5 tracking-tight">
                                {d.dateFormatted.split('/')[0]}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Th. {d.dateFormatted.split('/')[1]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Available Slots Grid */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Chọn giờ còn trống</Label>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" /> Lưới giờ chạy cách nhau 30 phút
                        </span>
                      </div>

                      {isLoadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Đang tìm kiếm ca trống phù hợp...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <Card className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                            <p className="text-sm font-bold text-amber-800">Không có ca rửa xe nào trống vào ngày này</p>
                            <p className="text-xs text-amber-700 max-w-sm">
                              Tất cả các ca của nhân viên đều đã kín lịch hoặc hôm nay không có ca trực. Vui lòng chọn ngày khác.
                            </p>
                          </div>
                        </Card>
                      ) : (
                        <>
                        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-amber-600 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          Ô màu vàng là Giờ Vàng — đặt vào khung này được giảm giá theo hạng thành viên.
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map((slot: AvailableSlot) => {
                            const isSelected = slot.scheduledAt === selectedSlot;
                            const isFull = slot.remainingCapacity <= 0;
                            const isGolden = slot.isGoldenHour && !isFull;
                            // Format time from ISO
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
                                onClick={() => setSelectedSlot(slot.scheduledAt)}
                                className={cn(
                                  "p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center relative focus:outline-none",
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                                    : isFull
                                    ? "border-border bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : isGolden
                                    ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                                    : "border-border bg-card hover:bg-slate-50"
                                )}
                              >
                                {isGolden && (
                                  <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 shadow-sm">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {slot.discountPercent > 0 ? `-${slot.discountPercent}%` : 'Giờ vàng'}
                                  </span>
                                )}
                                <span className="font-extrabold text-sm text-foreground tracking-tight">
                                  {timeStr}
                                </span>
                                <span className={cn(
                                  "text-[9px] font-bold mt-1",
                                  isSelected
                                    ? "text-primary"
                                    : isFull
                                    ? "text-slate-400"
                                    : isGolden
                                    ? "text-amber-600"
                                    : "text-emerald-500"
                                )}>
                                  {isFull ? 'Hết chỗ' : `Trống: ${slot.remainingCapacity}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="rounded-xl font-bold px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                      </Button>
                      <Button
                        disabled={!selectedSlot}
                        onClick={() => setStep(4)}
                        className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6 py-2.5 shadow-lg shadow-primary/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
                      >
                        Tiếp theo <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ──────── STEP 4: XÁC NHẬN ĐƠN HÀNG ──────── */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-primary" /> Bước 4: Thanh Toán & Xác Nhận Đặt Lịch
                    </h2>

                    {/* Voucher rửa miễn phí */}
                    {validVouchers.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Voucher rửa miễn phí ({validVouchers.length})
                        </Label>

                        {!serviceVoucherEligible ? (
                          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Gói dịch vụ này không áp dụng voucher.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Nhập mã voucher */}
                            <div className="flex gap-2">
                              <input
                                value={voucherCodeInput}
                                onChange={(e) => {
                                  setVoucherCodeInput(e.target.value.toUpperCase());
                                  setVoucherCodeError('');
                                }}
                                placeholder="Nhập mã voucher…"
                                className="flex-1 min-w-0 border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-primary/50"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const q = voucherCodeInput.trim().toUpperCase();
                                  if (!q) return;
                                  const found = validVouchers.find(
                                    (v) => v.code.toUpperCase() === q
                                  );
                                  if (found) {
                                    setSelectedVoucherId(found.id);
                                    setVoucherCodeError('');
                                    setVoucherCodeInput('');
                                  } else {
                                    setVoucherCodeError(
                                      'Mã không hợp lệ hoặc không thuộc tài khoản của bạn.'
                                    );
                                  }
                                }}
                                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shrink-0 cursor-pointer"
                              >
                                Áp dụng
                              </button>
                            </div>
                            {voucherCodeError && (
                              <p className="text-[11px] text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{' '}
                                {voucherCodeError}
                              </p>
                            )}
                            <div className="text-[11px] text-muted-foreground pt-1">
                              Hoặc chọn từ voucher bạn đang có:
                            </div>
                            {validVouchers.map((v) => {
                              const isSelected = v.id === selectedVoucherId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVoucherId(isSelected ? '' : v.id)
                                  }
                                  className={cn(
                                    'w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer focus:outline-none',
                                    isSelected
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                      : 'border-border bg-card hover:bg-slate-50'
                                  )}
                                >
                                  <div className={cn(
                                    'p-2 rounded-lg shrink-0',
                                    isSelected ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500'
                                  )}>
                                    <Ticket className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-sm text-foreground block truncate">
                                      {v.code}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground block">
                                      Giảm tối đa {formatCurrency(v.discountCapVnd)} · HSD{' '}
                                      {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                  {isSelected ? (
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                  ) : (
                                    <span className="text-[11px] font-bold text-primary shrink-0">
                                      Áp dụng
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                            {selectedVoucherId && (
                              <button
                                type="button"
                                onClick={() => setSelectedVoucherId('')}
                                className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Bỏ áp dụng voucher
                              </button>
                            )}
                          </div>
                        )}

                        {preview?.voucherError && selectedVoucherId && (
                          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {preview.voucherError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Method Picker */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chọn hình thức thanh toán</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* PayOS Online */}
                        <button
                          type="button"
                          disabled={isFreeOrder}
                          onClick={() => !isFreeOrder && setPaymentMethod('online')}
                          className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 focus:outline-none",
                            isFreeOrder
                              ? "border-border bg-slate-100 opacity-60 cursor-not-allowed"
                              : effectivePaymentMethod === 'online'
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs cursor-pointer"
                              : "border-border bg-card hover:bg-slate-50 cursor-pointer"
                          )}
                        >
                          <div className={cn(
                            "p-2.5 rounded-lg",
                            effectivePaymentMethod === 'online' ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"
                          )}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-foreground block leading-tight">Thanh toán Online (PayOS)</span>
                            <span className="text-[10px] text-muted-foreground">Qua mã QR ngân hàng cực kỳ tiện lợi</span>
                          </div>
                          {effectivePaymentMethod === 'online' && <Check className="w-4 h-4 text-primary ml-auto" />}
                        </button>

                        {/* Cash */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 cursor-pointer focus:outline-none",
                            effectivePaymentMethod === 'cash'
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                              : "border-border bg-card hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "p-2.5 rounded-lg",
                            effectivePaymentMethod === 'cash' ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"
                          )}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-foreground block leading-tight">Thanh toán tại quầy (Tiền mặt)</span>
                            <span className="text-[10px] text-muted-foreground">Thanh toán sau khi xe của bạn rửa sạch</span>
                          </div>
                          {effectivePaymentMethod === 'cash' && <Check className="w-4 h-4 text-primary ml-auto" />}
                        </button>
                      </div>
                      {isFreeOrder && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-primary" />
                          Đơn được voucher giảm về 0đ — chỉ thanh toán tiền mặt tại quầy.
                        </p>
                      )}
                    </div>

                    {/* Booking Notes */}
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="booking-note" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Ghi chú yêu cầu thêm (không bắt buộc)
                      </Label>
                      <Textarea
                        id="booking-note"
                        placeholder="VD: Hút bụi kỹ ghế sau, rửa sạch vết bẩn gầm xe..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all text-sm resize-none h-24"
                        maxLength={500}
                      />
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setStep(3)}
                        className="rounded-xl font-bold px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                      </Button>
                      <Button
                        onClick={handleSubmitBooking}
                        disabled={createOrderMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold px-7 py-2.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-102 flex items-center gap-1.5"
                      >
                        {createOrderMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo đơn đặt...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Xác nhận đặt lịch
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* ─── SIDEBAR HÓA ĐƠN TÓM TẮT DỊCH VỤ ─── */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-6">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-heading font-black text-lg text-foreground tracking-tight border-b border-slate-100 pb-3">
                  Tóm Tắt Đơn Đặt Lịch
                </h3>

                <div className="space-y-4 text-sm font-medium">
                  {/* Vehicle Summary */}
                  {selectedVehicle ? (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-xs shrink-0 mt-0.5">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Phương tiện</span>
                        <span className="text-foreground font-bold text-sm block">
                          {selectedVehicle.nickname || selectedVehicle.brand || 'Xe của tôi'}
                        </span>
                        {renderLicensePlate(selectedVehicle.licensePlate)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 italic flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" /> Chưa chọn phương tiện
                    </div>
                  )}

                  {/* Service Summary */}
                  {selectedService ? (
                    <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-xs shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dịch vụ</span>
                        <span className="text-foreground font-bold text-sm block">
                          {selectedService.name}
                        </span>
                        <span className="text-xs text-muted-foreground block font-bold">
                          {selectedService.estimatedMinutes} phút • Gói lẻ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 italic flex items-center gap-2 border-t border-slate-100 pt-3">
                      <HelpCircle className="w-4 h-4" /> Chưa chọn gói dịch vụ
                    </div>
                  )}

                  {/* Date & Time Summary */}
                  {selectedSlot ? (
                    <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-xs shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Thời gian hẹn</span>
                        <span className="text-foreground font-bold text-sm block">
                          {new Date(selectedSlot).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground block font-bold">
                          {new Date(selectedSlot).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 italic flex items-center gap-2 border-t border-slate-100 pt-3">
                      <HelpCircle className="w-4 h-4" /> Chưa chọn thời gian
                    </div>
                  )}
                </div>

                {/* Total Payment Details */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {(() => {
                    const base = selectedService ? Number(selectedService.basePrice) : 0;
                    const original = preview?.originalAmount ?? base;
                    const discount = preview?.discountAmount ?? 0;
                    const total = preview?.amount ?? base;
                    return (
                      <>
                        <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                          <span>Giá niêm yết</span>
                          <span>{formatCurrency(original)}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                            <span className="flex items-center gap-1">
                              <Ticket className="w-3.5 h-3.5" />
                              {selectedVoucherId && !preview?.voucherError
                                ? 'Giảm giá (voucher)'
                                : 'Giảm giá'}
                            </span>
                            <span>− {formatCurrency(discount)}</span>
                          </div>
                        )}

                        {preview?.isGoldenHour && preview.tierDiscountPercent > 0 && (
                          <p className="text-[10px] text-muted-foreground -mt-1.5">
                            Khung giờ vàng · hạng {preview.tierName} giảm{' '}
                            {preview.tierDiscountPercent}%
                          </p>
                        )}

                        <div className="flex justify-between items-center text-md font-black text-foreground pt-1 border-t border-dashed border-slate-100">
                          <span>Tổng thanh toán</span>
                          <span className="text-xl text-primary font-black">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Security badges */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                  <div className="text-emerald-500 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-snug">
                    <span className="font-black text-foreground block">Đảm bảo an toàn 100%</span>
                    Cam kết giữ chỗ, hủy lịch miễn phí trước 2 tiếng qua ứng dụng.
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
