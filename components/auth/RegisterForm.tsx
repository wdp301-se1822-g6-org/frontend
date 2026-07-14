'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Calendar1, Phone } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { RegisterFormData, registerSchema } from '@/schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/components/ui/spinner';
import { AuthFormField } from './AuthFormField';
import { SocialAuthSection } from './SocialAuthSection';

export function RegisterForm({
  className,
  onSubmit,
  loading,
  ...props
}: Omit<React.ComponentProps<'div'>, 'onSubmit'> & {
  onSubmit: (data: RegisterFormData) => void;
  loading: boolean;
}) {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
    },
  });
  const router = useRouter();

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <div className='space-y-1.5 pb-6 text-center'>
        <h1 className='font-heading text-3xl font-bold tracking-tight text-primary'>
          Tham gia ngay
        </h1>
        <p className='text-sm font-medium text-muted-foreground'>
          Điền thông tin để tạo tài khoản WAVE
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className='gap-5'>
          <div className='flex flex-col gap-4'>
            <AuthFormField
              control={form.control}
              name='name'
              id='register-name'
              label='Họ và tên'
              icon={User}
              placeholder='Họ và tên của bạn'
              autoComplete='name'
              disabled={loading}
            />
            <AuthFormField
              control={form.control}
              name='phone'
              id='register-phone'
              label='Số điện thoại'
              icon={Phone}
              type='tel'
              placeholder='Số điện thoại'
              autoComplete='tel'
              disabled={loading}
            />
            <AuthFormField
              control={form.control}
              name='email'
              id='register-email'
              label='Email'
              icon={Mail}
              type='email'
              placeholder='Địa chỉ Email'
              autoComplete='email'
              disabled={loading}
            />

            <Controller
              name='dateOfBirth'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-date-of-birth'>
                    Ngày sinh
                  </FieldLabel>
                  <div className='group relative'>
                    <Calendar1 className='absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-foreground/30 transition-colors group-focus-within:text-primary' />
                    <Input
                      id='register-date-of-birth'
                      type='date'
                      disabled={loading}
                      autoComplete='bday'
                      aria-invalid={fieldState.invalid}
                      className='h-12 rounded-xl border-primary/10 bg-muted/40 pl-11 transition-all focus:border-primary focus:bg-background focus:ring-primary/20'
                      value={
                        field.value instanceof Date &&
                        !Number.isNaN(field.value.getTime())
                          ? field.value.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <AuthFormField
              control={form.control}
              name='password'
              id='register-password'
              label='Mật khẩu'
              icon={Lock}
              type='password'
              placeholder='Mật khẩu'
              autoComplete='new-password'
              disabled={loading}
            />
            <AuthFormField
              control={form.control}
              name='confirmPassword'
              id='register-confirm-password'
              label='Xác nhận mật khẩu'
              icon={Lock}
              type='password'
              placeholder='Xác nhận mật khẩu'
              autoComplete='new-password'
              disabled={loading}
            />

            <Button
              type='submit'
              size='xl'
              disabled={loading}
              aria-busy={loading}
              className='w-full rounded-xl shadow-lg shadow-primary/20'
            >
              {loading && <Spinner />}
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
          </div>

          <SocialAuthSection disabled={loading} />

          <div className='text-center text-sm font-medium text-muted-foreground'>
            Đã có tài khoản?{' '}
            <button
              type='button'
              className='ml-1 font-semibold text-primary hover:underline'
              onClick={() => router.push('/login')}
            >
              Đăng nhập
            </button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
