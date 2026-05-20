'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const router = useRouter();

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='border-primary/10 bg-white/80 shadow-2xl shadow-primary/5 backdrop-blur-xl'>
        <CardHeader className='space-y-2 pb-8 text-center'>
          <CardTitle className='font-heading text-3xl font-black tracking-tight text-primary'>
            CHÀO MỪNG TRỞ LẠI
          </CardTitle>
          <p className='text-sm font-medium text-muted-foreground'>
            Vui lòng đăng nhập để tiếp tục
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className='gap-6'>
              <div className='grid gap-6'>
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
                  <span className='cursor-pointer text-xs font-bold tracking-wider text-primary uppercase transition-colors hover:text-primary/80'>
                    Quên mật khẩu?
                  </span>
                </div>

                <Button
                  type='submit'
                  size='xl'
                  disabled={loading}
                  aria-busy={loading}
                  className='w-full rounded-xl font-bold shadow-lg shadow-primary/20'
                >
                  {loading && <Spinner />}
                  {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
                </Button>
              </div>

              <SocialAuthSection disabled={loading} />

              <div className='text-center text-sm font-medium text-muted-foreground'>
                Bạn chưa có tài khoản?{' '}
                <button
                  type='button'
                  className='ml-1 font-bold text-primary hover:underline'
                  onClick={() => router.push('/register')}
                >
                  TẠO TÀI KHOẢN
                </button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
