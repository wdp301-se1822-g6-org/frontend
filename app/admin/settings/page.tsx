'use client';

import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Shield, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  const { authUser } = useAuthStore();

  return (
    <>
      <AdminTopbar title='Cài đặt hệ thống' subtitle='Cấu hình chung của ứng dụng' />
      <main className='flex-1 p-8 overflow-y-auto'>
        <div className='max-w-3xl mx-auto flex flex-col gap-8'>

          {/* Account Info */}
          <div className='bg-white rounded-2xl border border-border/50 shadow-sm p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'>
                <User className='w-5 h-5 text-primary' />
              </div>
              <h2 className='font-heading font-black text-foreground text-lg'>Thông tin tài khoản</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {[
                { label: 'Họ và tên', value: authUser?.name ?? '—' },
                { label: 'Email', value: authUser?.email ?? '—' },
                { label: 'Vai trò', value: authUser?.role ?? '—' },
                { label: 'Trạng thái', value: authUser?.isActive ? 'Hoạt động' : 'Vô hiệu' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className='block text-xs font-black uppercase tracking-widest text-foreground/40 mb-1.5'>{label}</label>
                  <div className='px-4 py-3 bg-muted rounded-xl text-sm font-semibold text-foreground'>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* App Settings */}
          <div className='bg-white rounded-2xl border border-border/50 shadow-sm p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center'>
                <Globe className='w-5 h-5 text-secondary' />
              </div>
              <h2 className='font-heading font-black text-foreground text-lg'>Thông tin hệ thống</h2>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                { label: 'Tên hệ thống', value: 'WAVE Car Wash' },
                { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL ?? '—' },
                { label: 'Phiên bản', value: 'v1.0.0' },
                { label: 'Môi trường', value: process.env.NODE_ENV ?? 'production' },
              ].map(({ label, value }) => (
                <div key={label} className='flex items-center justify-between py-3 border-b border-border/50 last:border-0'>
                  <span className='text-sm font-semibold text-foreground/60'>{label}</span>
                  <span className='text-sm font-black text-foreground font-mono'>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className='bg-white rounded-2xl border border-border/50 shadow-sm p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center'>
                <Shield className='w-5 h-5 text-rose-500' />
              </div>
              <h2 className='font-heading font-black text-foreground text-lg'>Bảo mật</h2>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50'>
                <div>
                  <p className='font-semibold text-foreground text-sm'>Xác thực hai bước</p>
                  <p className='text-xs text-foreground/40 mt-0.5'>Bảo vệ tài khoản bằng OTP</p>
                </div>
                <span className='px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[11px] font-black uppercase'>Sắp có</span>
              </div>
              <div className='flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50'>
                <div>
                  <p className='font-semibold text-foreground text-sm'>Nhật ký truy cập</p>
                  <p className='text-xs text-foreground/40 mt-0.5'>Theo dõi lịch sử đăng nhập</p>
                </div>
                <span className='px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[11px] font-black uppercase'>Sắp có</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
