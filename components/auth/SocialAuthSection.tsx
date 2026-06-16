'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type SocialAuthSectionProps = {
  disabled?: boolean;
};

/**
 * Khối "Hoặc tiếp tục với" + nút đăng nhập Google.
 * Dùng chung cho cả LoginForm và RegisterForm.
 * Lưu ý: đăng nhập Google chưa được cấu hình - hiện chỉ thông báo.
 */
export function SocialAuthSection({ disabled }: SocialAuthSectionProps) {
  return (
    <div>
      <div className='flex items-center gap-2'>
        <div className='h-px flex-1 bg-border' />
        <span className='text-sm text-muted-foreground'>
          Hoặc tiếp tục với
        </span>
        <div className='h-px flex-1 bg-border' />
      </div>

      <Button
        variant='outline'
        type='button'
        disabled={disabled}
        onClick={() => toast.info('Đăng nhập Google chưa được cấu hình.')}
        className='mt-5 h-12 w-full gap-3 rounded-xl border-primary/10 font-semibold'
      >
        <Image
          src='/logo-google.jpg'
          alt='Google'
          width={24}
          height={24}
          className='rounded-full'
        />
        Đăng nhập với Google
      </Button>
    </div>
  );
}
