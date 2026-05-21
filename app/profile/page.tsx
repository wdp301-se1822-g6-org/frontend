'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { Camera, AlertCircle, X, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { getInitials } from '@/lib/format';
import type { User } from '@/types/auth';

type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  day: string;
  month: string;
  year: string;
};

function getProfileFormData(user: User): ProfileFormData {
  const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;

  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    day: dob ? dob.getDate().toString() : '',
    month: dob ? (dob.getMonth() + 1).toString() : '',
    year: dob ? dob.getFullYear().toString() : '',
  };
}

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => 2024 - i);

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.authUser);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) {
    return <ProfilePageSkeleton />;
  }

  if (!authUser) {
    return (
      <EmptyState
        icon={LogIn}
        title='Bạn cần đăng nhập để xem hồ sơ'
        description='Hồ sơ cá nhân chỉ hiển thị khi hệ thống xác định được phiên đăng nhập của bạn.'
        className='bg-card/80'
        action={
          <Button asChild className='font-bold'>
            <Link href='/login'>Đăng nhập</Link>
          </Button>
        }
      />
    );
  }

  return <ProfileContent key={authUser.id ?? authUser.email} authUser={authUser} />;
}

function ProfileContent({ authUser }: { authUser: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(() => getProfileFormData(authUser));
  const [showAlert, setShowAlert] = useState(true);

  const initials = getInitials(authUser.name);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
    toast.info(
      'Tính năng cập nhật hồ sơ đang được phát triển. Dữ liệu của bạn chưa bị thay đổi.',
    );
  };

  return (
    <div className='space-y-4'>
      {showAlert && (
        <div className='flex items-center justify-between rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='size-4' />
            <span>Tính năng thay đổi thông tin cá nhân sắp được ra mắt.</span>
          </div>
          <button
            type='button'
            onClick={() => setShowAlert(false)}
            className='text-warning/70 transition-colors hover:text-warning'
            aria-label='Đóng thông báo'
          >
            <X className='size-4' />
          </button>
        </div>
      )}

      <Card className='overflow-hidden rounded-xl border-none bg-card/80 shadow-md backdrop-blur-md'>
        <CardContent className='p-8'>
          <div className='mb-8 border-b border-border pb-4'>
            <h1 className='font-heading text-xl font-bold text-foreground'>
              Hồ Sơ Của Tôi
            </h1>
            <p className='text-sm text-muted-foreground'>
              Quản lý thông tin hồ sơ để bảo mật tài khoản
            </p>
          </div>

          <div className='grid grid-cols-1 gap-12 lg:grid-cols-12'>
            <div className='space-y-6 lg:col-span-8'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4'>
                <Label className='font-medium text-muted-foreground sm:text-right'>
                  Tên
                </Label>
                <div className='sm:col-span-2'>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className='h-10 rounded-xl'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4'>
                <Label className='font-medium text-muted-foreground sm:text-right'>
                  Email
                </Label>
                <div className='flex items-center gap-2 sm:col-span-2'>
                  <span className='text-foreground'>
                    {formData.email.replace(/(.{2}).+(@.+)/, '$1******$2')}
                  </span>
                  <button className='text-xs text-primary hover:underline'>
                    Thay Đổi
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4'>
                <Label className='font-medium text-muted-foreground sm:text-right'>
                  Số điện thoại
                </Label>
                <div className='flex items-center gap-2 sm:col-span-2'>
                  <span className='text-foreground'>
                    {formData.phone.replace(/(.{3}).+(.{2})/, '$1********$2')}
                  </span>
                  <button className='text-xs text-primary hover:underline'>
                    Thay Đổi
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4'>
                <Label className='font-medium text-muted-foreground sm:text-right'>
                  Ngày sinh
                </Label>
                <div className='grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3'>
                  <Select
                    value={formData.day}
                    onValueChange={(day) => setFormData({ ...formData, day })}
                  >
                    <SelectTrigger className='h-10 rounded-xl'>
                      <SelectValue placeholder='Ngày' />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.month}
                    onValueChange={(month) =>
                      setFormData({ ...formData, month })
                    }
                  >
                    <SelectTrigger className='h-10 rounded-xl'>
                      <SelectValue placeholder='Tháng' />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.year}
                    onValueChange={(year) => setFormData({ ...formData, year })}
                  >
                    <SelectTrigger className='h-10 rounded-xl'>
                      <SelectValue placeholder='Năm' />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3 sm:items-center sm:gap-4'>
                <div />
                <div className='sm:col-span-2'>
                  <Button
                    type='button'
                    size='lg'
                    disabled={isLoading}
                    aria-busy={isLoading}
                    onClick={handleSave}
                    className='rounded-xl px-10 font-bold shadow-md shadow-primary/20'
                  >
                    {isLoading && <Spinner />}
                    {isLoading ? 'Đang xử lý...' : 'Lưu'}
                  </Button>
                </div>
              </div>
            </div>

            <div className='flex flex-col items-center justify-start space-y-4 border-t border-border pt-8 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-4'>
              <div className='group relative'>
                <div className='flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-md transition-all group-hover:opacity-90'>
                  {authUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={authUser.avatarUrl}
                      alt='Ảnh đại diện'
                      className='size-full object-cover'
                    />
                  ) : (
                    <span className='text-3xl font-black text-muted-foreground/40'>
                      {initials}
                    </span>
                  )}
                  <div className='absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Camera className='size-8 text-white' />
                  </div>
                </div>
              </div>

              <Button variant='outline' className='rounded-xl font-semibold'>
                Chọn Ảnh
              </Button>

              <div className='space-y-1 text-center'>
                <p className='text-xs text-muted-foreground'>
                  Dung lượng file tối đa 1 MB
                </p>
                <p className='text-xs text-muted-foreground'>
                  Định dạng: .JPEG, .PNG
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-14 w-full rounded-md' />
      <Card className='border-none bg-card/80 shadow-md'>
        <CardContent className='p-8'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='mt-3 h-4 w-72' />
          <div className='mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12'>
            <div className='space-y-6 lg:col-span-8'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4'
                >
                  <Skeleton className='h-4 w-28 sm:justify-self-end' />
                  <Skeleton className='h-10 w-full sm:col-span-2' />
                </div>
              ))}
            </div>
            <div className='flex flex-col items-center gap-4 lg:col-span-4'>
              <Skeleton className='h-32 w-32 rounded-full' />
              <Skeleton className='h-10 w-28' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
