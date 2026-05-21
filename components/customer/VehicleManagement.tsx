'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  Bike, 
  Plus, 
  Check, 
  Trash2, 
  Pencil, 
  AlertTriangle, 
  X, 
  Loader2, 
  Star 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      toast.error(err.response?.data?.message || 'Không thể tải danh sách phương tiện');
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
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
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
      toast.error(err.response?.data?.message || 'Không thể xóa phương tiện');
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
      toast.error(err.response?.data?.message || 'Không thể đặt làm mặc định');
    }
  };

  // Helper to get type name
  const getTypeName = (typeId: string): string => {
    if (!typeId) return 'Chưa phân loại';
    const found = vehicleTypes.find(t => (t._id || t.id) === typeId);
    return found?.name || 'Chưa phân loại';
  };

  // Helper to render beautiful license plate
  const renderLicensePlate = (plate: string) => {
    return (
      <div className="inline-flex flex-col items-center justify-center border-2 border-slate-300 rounded-lg px-4 py-1.5 bg-slate-50 shadow-sm min-w-[140px] text-center font-mono">
        <div className="w-full border-b border-slate-200 text-[9px] tracking-wider text-slate-400 font-sans pb-0.5 leading-none">VIỆT NAM</div>
        <span className="text-sm font-bold text-slate-800 tracking-wide pt-0.5 leading-none">{plate}</span>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header section */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4'>
        <div>
          <h1 className='text-xl font-bold text-foreground'>Xe Của Tôi</h1>
          <p className='text-sm text-muted-foreground'>Quản lý danh sách phương tiện cá nhân của bạn để đặt lịch nhanh chóng hơn</p>
        </div>
        <Button 
          onClick={handleOpenAddModal}
          className='bg-primary hover:bg-primary/90 text-white rounded-xl px-5 py-3 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          Thêm Phương Tiện
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Đang tải danh sách xe...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <Card className='border-2 border-dashed border-border/60 shadow-none rounded-2xl bg-white/40 backdrop-blur-md py-16 text-center'>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Car className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Chưa có phương tiện nào</h3>
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
                className={`relative border-none overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-lg hover:scale-[1.01] bg-white/90 backdrop-blur-sm ${
                  vehicle.isDefault ? 'ring-2 ring-primary/60 shadow-primary/5 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-6 flex flex-col justify-between h-full min-h-[200px]">
                  <div>
                    {/* Header info card */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          vehicle.isDefault ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isMotorbike ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-md flex items-center gap-2">
                            {vehicle.nickname || vehicle.brand || 'Xe của tôi'}
                            {vehicle.isDefault && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full shadow-sm shadow-primary/10">
                                <Check className="w-3 h-3" /> Mặc định
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            {getTypeName(vehicle.vehicleTypeId)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle details */}
                    <div className="grid grid-cols-2 gap-4 items-center mb-6">
                      {renderLicensePlate(vehicle.licensePlate)}
                      
                      <div className="space-y-1 text-xs text-muted-foreground font-medium">
                        {(vehicle.brand || vehicle.model) && (
                          <div>
                            <span className="text-slate-400">Hiệu xe:</span>{' '}
                            <span className="text-foreground font-bold">{[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}</span>
                          </div>
                        )}
                        {vehicle.color && (
                          <div>
                            <span className="text-slate-400">Màu sắc:</span>{' '}
                            <span className="text-foreground font-bold">{vehicle.color}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    {!vehicle.isDefault ? (
                      <button 
                        onClick={() => handleSetDefault(vehicle._id || vehicle.id || '')}
                        className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors group"
                      >
                        <Star className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        Đặt mặc định
                      </button>
                    ) : (
                      <span className="text-xs text-primary font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Xe chính
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(vehicle)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDeleteModal(vehicle)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all"
                        title="Xóa xe"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <Card className="w-full max-w-lg border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  {selectedVehicle ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biển số xe *</Label>
                    <Input
                      required
                      placeholder="VD: 51A-12345"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all uppercase placeholder:normal-case font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại xe *</Label>
                    <select
                      value={formData.vehicleTypeId}
                      onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
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
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên gọi / Biệt danh (không bắt buộc)</Label>
                  <Input
                    placeholder="VD: Xe đi làm, Xe đi phượt..."
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hãng xe</Label>
                    <Input
                      placeholder="VD: Honda, Toyota"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dòng xe</Label>
                    <Input
                      placeholder="VD: SH, Wave, Vios"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Màu sắc</Label>
                    <Input
                      placeholder="VD: Đỏ, Trắng, Đen"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all"
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
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isDefaultCheckbox" className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                      Đặt làm phương tiện mặc định
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
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
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-2.5 font-semibold shadow-lg shadow-primary/15 min-w-[120px]"
                    disabled={isSubmitLoading}
                  >
                    {isSubmitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Lưu lại'}
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
          <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-full bg-red-50 text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-foreground">Xóa phương tiện</h3>
                  <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa phương tiện có biển số{' '}
                    <span className="font-mono font-bold text-slate-800">{selectedVehicle.licensePlate}</span> không?
                  </p>
                  <p className="text-xs text-red-500 font-medium">Hành động này không thể hoàn tác và phương tiện sẽ không dùng để đặt lịch mới được nữa.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2 font-semibold shadow-lg shadow-red-500/15 min-w-[100px]"
                  disabled={isSubmitLoading}
                >
                  {isSubmitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Đồng ý xóa'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
