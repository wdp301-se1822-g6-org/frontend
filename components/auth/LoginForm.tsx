'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, loginSchema } from '@/schemas/auth';
import { useForm } from 'react-hook-form';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { AuthFormField } from './AuthFormField';
import { SocialAuthSection } from './SocialAuthSection';

export function LoginForm({
  className,
  onSubmit,
  loading,
  ...props
}: Omit<React.ComponentProps<'div'>, 'onSubmit'> & {
  onSubmit: (data: LoginFormData) => void;
  loading: boolean;
}) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const router = useRouter();

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <div className='space-y-1.5 text-center'>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-primary'>
          Chào mừng trở lại
        </h1>
        <p className='text-sm font-medium text-muted-foreground'>
          Vui lòng đăng nhập để tiếp tục
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className='gap-5'>
              <div className='grid gap-5'>
                <AuthFormField
                  control={form.control}
                  name='email'
                  id='login-email'
                  label='Email'
                  icon={User}
                  type='email'
                  placeholder='email@example.com'
                  autoComplete='email'
                  disabled={loading}
                />
                <AuthFormField
                  control={form.control}
                  name='password'
                  id='login-password'
                  label='Mật khẩu'
                  icon={Lock}
                  type='password'
                  placeholder='Mật khẩu'
                  autoComplete='current-password'
                  disabled={loading}
                />

                <div className='flex justify-end'>
                  <span className='cursor-pointer text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline'>
                    Quên mật khẩu?
                  </span>
                </div>

                <Button
                  type='submit'
                  size='xl'
                  disabled={loading}
                  aria-busy={loading}
                  className='w-full rounded-xl shadow-lg shadow-primary/20'
                >
                  {loading && <Spinner />}
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </div>

              <SocialAuthSection disabled={loading} />

              <div className='text-center text-sm font-medium text-muted-foreground'>
                Bạn chưa có tài khoản?{' '}
                <button
                  type='button'
                  className='ml-1 font-semibold text-primary hover:underline'
                  onClick={() => router.push('/register')}
                >
                  Tạo tài khoản
                </button>
              </div>
            </FieldGroup>
      </form>
    </div>
  );
}
