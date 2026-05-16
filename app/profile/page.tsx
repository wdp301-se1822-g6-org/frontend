'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Camera, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.authUser);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    day: '',
    month: '',
    year: '',
  });

  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    if (authUser) {
      const dob = authUser.dateOfBirth ? new Date(authUser.dateOfBirth) : null;
      setFormData({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        day: dob ? dob.getDate().toString() : '',
        month: dob ? (dob.getMonth() + 1).toString() : '',
        year: dob ? dob.getFullYear().toString() : '',
      });
    }
  }, [authUser]);

  const initials =
    authUser?.name
      ?.split(' ')
      .map((w: string) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() ?? '?';

  return (
    <div className='space-y-4'>
      {/* Update Alert */}
      {showAlert && (
        <div className='bg-[#FFFBF2] border border-[#F9E1B2] rounded-md p-4 flex items-center justify-between text-[#856404] text-sm'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-4 h-4 text-orange-400' />
            <span>Tính năng thay đổi thông tin cá nhân sắp được ra mắt.</span>
          </div>
          <button onClick={() => setShowAlert(false)} className='text-muted-foreground hover:text-foreground'>
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      <Card className='border-none shadow-xl shadow-black/5 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md'>
        <CardContent className='p-8'>
          <div className='mb-8 border-b border-border pb-4'>
            <h1 className='text-xl font-bold text-foreground'>Hồ Sơ Của Tôi</h1>
            <p className='text-sm text-muted-foreground'>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
            {/* Form Left */}
            <div className='lg:col-span-8 space-y-6'>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Tên</Label>
                <div className='col-span-2'>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className='rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all'
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Email</Label>
                <div className='col-span-2 flex items-center gap-2'>
                  <span className='text-foreground'>{formData.email.replace(/(.{2}).+(@.+)/, '$1******$2')}</span>
                  <button className='text-xs text-blue-600 hover:underline'>Thay Đổi</button>
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Số điện thoại</Label>
                <div className='col-span-2 flex items-center gap-2'>
                  <span className='text-foreground'>{formData.phone.replace(/(.{3}).+(.{2})/, '$1********$2')}</span>
                  <button className='text-xs text-blue-600 hover:underline'>Thay Đổi</button>
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Ngày sinh</Label>
                <div className='col-span-2 flex gap-3'>
                  {/* Simple Select replacements for premium look */}
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Ngày</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}> {m}</option>
                    ))}
                  </select>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Năm</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4 pt-4'>
                <div />
                <div className='col-span-2'>
                  <Button
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      await new Promise(r => setTimeout(r, 800)); // Simulate API call
                      setIsLoading(false);
                      toast.success('Cập nhật hồ sơ thành công!');
                    }}
                    className='bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]'
                  >
                    {isLoading ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Lưu'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Avatar Right */}
            <div className='lg:col-span-4 flex flex-col items-center justify-start pt-4 border-l border-border/50 space-y-4'>
              <div className='relative group'>
                <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-muted flex items-center justify-center group-hover:opacity-90 transition-all'>
                  {authUser?.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt='Avatar'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <span className='text-3xl font-black text-muted-foreground/40'>{initials}</span>
                  )}

                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                    <Camera className='w-8 h-8 text-white' />
                  </div>
                </div>
              </div>

              <Button variant='outline' className='rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all font-semibold'>
                Chọn Ảnh
              </Button>

              <div className='text-center space-y-1'>
                <p className='text-xs text-muted-foreground'>Dung lượng file tối đa 1 MB</p>
                <p className='text-xs text-muted-foreground'>Định dạng:.JPEG, .PNG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
