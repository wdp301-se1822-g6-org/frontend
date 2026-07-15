'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Bike,
  Plus,
  Check,
  Trash2,
  Pencil,
  AlertTriangle,
  X,
  Star,
  History
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatLicensePlate, capitalizeWords } from '@/lib/format';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { 
  getMyVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle, 
  setDefaultVehicle, 
  getActiveVehicleTypes 
} from '@/lib/customer-api';

interface VehicleType {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
}

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

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    vehicleTypeId: '',
    licensePlate: '',
    nickname: '',
    brand: '',
    model: '',
    color: '',
    isDefault: false
  });

  // Fetch all vehicles and vehicle types on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [vehiclesRes, typesRes] = await Promise.all([
        getMyVehicles(),
        getActiveVehicleTypes()
      ]);
      const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
      const tData = typesRes.data?.data || typesRes.data || [];
      setVehicles(Array.isArray(vData) ? vData : []);
      setVehicleTypes(Array.isArray(tData) ? tData : []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi khi tải dữ liệu xe:', err);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedVehicle(null);
    setFormData({
      vehicleTypeId: vehicleTypes[0]?._id || vehicleTypes[0]?.id || '',
      licensePlate: '',
      nickname: '',
      brand: '',
      model: '',
      color: '',
      isDefault: vehicles.length === 0 // Auto-default if it's the first vehicle
    });
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleTypeId: vehicle.vehicleTypeId,
      licensePlate: vehicle.licensePlate,
      nickname: vehicle.nickname || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      isDefault: vehicle.isDefault
    });
    setIsFormOpen(true);
  };

  const handleOpenDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleTypeId) {
      toast.warning('Vui lòng chọn loại xe');
      return;
    }
    if (!formData.licensePlate.trim()) {
      toast.warning('Vui lòng nhập biển số xe');
      return;
    }

    setIsSubmitLoading(true);
    try {
      if (selectedVehicle) {
        // Update vehicle
        await updateVehicle(selectedVehicle._id || selectedVehicle.id || '', {
          vehicleTypeId: formData.vehicleTypeId,
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          nickname: formData.nickname.trim() || undefined,
          brand: formData.brand.trim() || undefined,
          model: formData.model.trim() || undefined,
          color: formData.color.trim() || undefined,
        });
        toast.success('Cập nhật thông tin xe thành công!');
      } else {
        // Create vehicle
        await createVehicle({
          vehicleTypeId: formData.vehicleTypeId,
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          nickname: formData.nickname.trim() || undefined,
          brand: formData.brand.trim() || undefined,
          model: formData.model.trim() || undefined,
          color: formData.color.trim() || undefined,
          isDefault: formData.isDefault
        });
        toast.success('Thêm phương tiện mới thành công!');
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi lưu xe:', err);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    setIsSubmitLoading(true);
    try {
      await deleteVehicle(selectedVehicle._id || selectedVehicle.id || '');
      toast.success('Đã xóa phương tiện thành công!');
      setIsDeleteOpen(false);
      await fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi xóa xe:', err);
      toast.error('Không thể xóa phương tiện.', { description: getErrorMessage(error) });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultVehicle(id);
      toast.success('Đã đặt làm phương tiện mặc định!');
      await fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi cài đặt mặc định:', err);
      toast.error('Không thể đặt xe mặc định.', { description: getErrorMessage(error) });
    }
  };

  // Tên loại xe hiển thị tiếng Việt (dữ liệu BE đang lưu tên tiếng Anh).
  const VEHICLE_TYPE_VI: Record<string, string> = {
    car: 'Ô tô',
    motorbike: 'Xe máy',
  };
  const getTypeName = (typeId: string): string => {
    if (!typeId) return 'Chưa phân loại';
    const found = vehicleTypes.find(t => (t._id || t.id) === typeId);
    if (!found?.name) return 'Chưa phân loại';
    return VEHICLE_TYPE_VI[found.name.toLowerCase()] || found.name;
  };

  // Helper to render beautiful license plate
  const renderLicensePlate = (plate: string) => {
    return (
      <div className="inline-flex flex-col items-center justify-center border-2 border-border rounded-lg px-4 py-1.5 bg-muted/40 shadow-xs min-w-35 text-center font-mono">
        <div className="w-full border-b border-border text-[9px] tracking-wider text-placeholder font-sans pb-0.5 leading-none">VIỆT NAM</div>
        <span className="text-sm font-bold text-foreground tracking-wide pt-0.5 leading-none">{formatLicensePlate(plate)}</span>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header section */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4'>
        <div>
          <h1 className='font-heading text-xl font-bold text-foreground'>Xe của tôi</h1>
          <p className='text-sm text-muted-foreground'>
            {isLoading
              ? 'Quản lý danh sách phương tiện để đặt lịch nhanh hơn'
              : `${vehicles.length} phương tiện đã lưu — dùng để đặt lịch nhanh hơn`}
          </p>
        </div>
        <Button 
          onClick={handleOpenAddModal}
          className='bg-primary hover:bg-primary/90 text-white rounded-xl px-5 py-3 font-semibold shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          Thêm phương tiện
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner className="size-10 text-primary" />
          <span className="text-muted-foreground text-sm">Đang tải danh sách xe...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <Card className='border-2 border-dashed border-border/60 shadow-none rounded-xl bg-white/40 backdrop-blur-md py-16 text-center'>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Car className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-foreground">Chưa có phương tiện nào</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Thêm thông tin xe giúp chúng tôi gợi ý dịch vụ phù hợp và rút ngắn thời gian đặt lịch rửa xe của bạn.
              </p>
            </div>
            <Button
              onClick={handleOpenAddModal}
              variant="outline"
              className="mt-2 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all font-semibold"
            >
              Thêm Phương Tiện Ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => {
            const typeName = getTypeName(vehicle.vehicleTypeId).toLowerCase();
            const isMotorbike = typeName.includes('motor') || typeName.includes('xe máy');
            const vId = vehicle._id || vehicle.id || '';
            
            return (
              <Card
                key={vId}
                className={`relative overflow-hidden rounded-xl shadow-xs transition-all hover:shadow-md bg-card py-0 gap-0 ${
                  vehicle.isDefault ? 'border-primary/40' : 'border-border'
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-44">
                  <div>
                    {/* Header info card */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          vehicle.isDefault ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isMotorbike ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-foreground text-md flex items-center gap-2">
                            {capitalizeWords(vehicle.nickname || vehicle.brand) || 'Xe của tôi'}
                            {vehicle.isDefault && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                <Check className="w-3 h-3" /> Xe mặc định
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            {getTypeName(vehicle.vehicleTypeId)}
                            {(vehicle.brand || vehicle.model) && (
                              <> · {capitalizeWords([vehicle.brand, vehicle.model].filter(Boolean).join(' '))}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle details */}
                    <div className="flex items-center gap-4 mb-5">
                      {renderLicensePlate(vehicle.licensePlate)}
                      {vehicle.color && (
                        <div className="text-xs text-muted-foreground font-medium">
                          <span className="text-placeholder">Màu sắc</span>{' '}
                          <span className="text-foreground font-semibold block">{capitalizeWords(vehicle.color)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 mt-auto">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/profile/orders?q=${encodeURIComponent(vehicle.licensePlate)}`}
                        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 inline-flex items-center transition-colors"
                      >
                        <History className="w-3.5 h-3.5 mr-1" />
                        Lịch sử rửa
                      </Link>
                      {!vehicle.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(vehicle._id || vehicle.id || '')}
                          className="h-8 rounded-lg px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Đặt làm mặc định
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(vehicle)}
                        className="h-8 rounded-lg px-3 text-xs font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDeleteModal(vehicle)}
                        className="h-8 rounded-lg px-3 text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border-none shadow-2xl rounded-xl overflow-hidden bg-card py-0 gap-0 animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {selectedVehicle ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-placeholder hover:text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biển số xe *</Label>
                    <Input
                      required
                      placeholder="VD: 51A-12345"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all uppercase placeholder:normal-case font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loại xe *</Label>
                    <select
                      value={formData.vehicleTypeId}
                      onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                      {vehicleTypes.map((type) => {
                        const typeId = type._id || type.id;
                        return (
                          <option key={typeId} value={typeId}>
                            {type.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên gọi / Biệt danh (không bắt buộc)</Label>
                  <Input
                    placeholder="VD: Xe đi làm, Xe đi phượt..."
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hãng xe</Label>
                    <Input
                      placeholder="VD: Honda, Toyota"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dòng xe</Label>
                    <Input
                      placeholder="VD: SH, Wave, Vios"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Màu sắc</Label>
                    <Input
                      placeholder="VD: Đỏ, Trắng, Đen"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-card transition-all"
                    />
                  </div>
                </div>

                {!selectedVehicle && vehicles.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefaultCheckbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isDefaultCheckbox" className="text-sm font-semibold text-muted-foreground cursor-pointer select-none">
                      Đặt làm phương tiện mặc định
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl px-5 py-2.5 font-semibold"
                    disabled={isSubmitLoading}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-2.5 font-semibold shadow-lg min-w-[120px]"
                    disabled={isSubmitLoading}
                  >
                    {isSubmitLoading ? <Spinner className="size-5 mx-auto" /> : 'Lưu lại'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-xl overflow-hidden bg-card py-0 gap-0 animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-heading text-lg font-bold text-foreground">Xóa phương tiện</h3>
                  <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa phương tiện có biển số{' '}
                    <span className="font-mono font-bold text-foreground">{selectedVehicle.licensePlate}</span> không?
                  </p>
                  <p className="text-xs text-destructive font-medium">Hành động này không thể hoàn tác và phương tiện sẽ không dùng để đặt lịch mới được nữa.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  className="rounded-xl px-4 py-2 font-semibold"
                  disabled={isSubmitLoading}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-xl px-5 py-2 font-semibold shadow-lg min-w-25"
                  disabled={isSubmitLoading}
                >
                  {isSubmitLoading ? <Spinner className="size-5 mx-auto" /> : 'Đồng ý xóa'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
