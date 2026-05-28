'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Calendar1, Phone, ArrowLeft } from 'lucide-react';
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
import { useState } from 'react';

const STEP_1_FIELDS = ['name', 'phone', 'email'] as const;

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
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = async () => {
    const valid = await form.trigger([...STEP_1_FIELDS]);
    if (valid) setStep(2);
  };

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card className='relative border-primary/10 bg-white/80 shadow-2xl shadow-primary/5 backdrop-blur-xl px-4 py-10'>
        {step === 2 && (
          <button
            type='button'
            onClick={() => setStep(1)}
            disabled={loading}
            aria-label='Quay lại'
            className='absolute top-4 left-4 inline-flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 disabled:opacity-50'
          >
            <ArrowLeft className='size-5' />
          </button>
        )}
        <CardHeader className='space-y-1 pb-6 text-center'>
          <CardTitle className='font-heading text-3xl font-bold tracking-tight text-primary'>
            Tham gia ngay
          </CardTitle>
          <p className='text-sm font-medium text-muted-foreground'>
            {step === 1
              ? 'Bước 1/2 — Thông tin liên hệ'
              : 'Bước 2/2 — Thiết lập mật khẩu'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className='gap-5'>
              {step === 1 ? (
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

                  <Button
                    type='button'
                    size='xl'
                    onClick={handleNext}
                    disabled={loading}
                    className='w-full rounded-xl shadow-lg shadow-primary/20'
                  >
                    Tiếp tục
                  </Button>
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
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
                            className='h-12 rounded-xl border-primary/10 bg-card pl-11 transition-all focus:border-primary focus:ring-primary/20'
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

                  <div className='flex gap-3'>
                    <Button
                      type='submit'
                      size='xl'
                      disabled={loading}
                      aria-busy={loading}
                      className='flex-1 rounded-xl shadow-lg shadow-primary/20'
                    >
                      {loading && <Spinner />}
                      {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                    </Button>
                  </div>
                </div>
              )}

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
        </CardContent>
      </Card>
    </div>
  );
}
