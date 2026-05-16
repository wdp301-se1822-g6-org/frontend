'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Eye, EyeOff, Calendar1, Phone } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import Image from 'next/image';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { useRef, useState } from 'react';
import { RegisterFormData, registerSchema } from '@/schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '../ui/spinner';

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
      dateOfBirth: new Date(),
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  return (
    <div
      className={cn('flex flex-col gap-6 ', className)}
      {...props}
    >
      <Card className='border-primary/10 shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-xl'>
        <CardHeader className='text-center space-y-2 pb-8'>
          <CardTitle className='text-3xl font-black tracking-tight text-primary uppercase'>
            Tham Gia Ngay
          </CardTitle>
          <p className='text-sm text-foreground/50 font-medium'>Khám phá những ưu đãi tuyệt vời nhất</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className='grid gap-6'>
                <div className='grid gap-6 text-black'>
                  <Controller
                    name='name'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className='grid gap-3 relative group'>
                          <User className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            placeholder='Họ và tên của bạn'
                            autoComplete='off'
                            className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                          />
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <div className='grid gap-3 relative'>
                    <Controller
                      name='email'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              placeholder='Địa chỉ Email'
                              autoComplete='off'
                              className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                            />
                          </div>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className='grid gap-3 relative'>
                    <Controller
                      name='dateOfBirth'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Calendar1 className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              type='date'
                              className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                              value={
                                field.value
                                  ? new Date(field.value)
                                      .toISOString()
                                      .split('T')[0]
                                  : ''
                              }
                              onChange={(e) =>
                                field.onChange(new Date(e.target.value))
                              }
                            />
                          </div>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className='grid gap-3 relative'>
                    <Controller
                      name='password'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Mật khẩu'
                              autoComplete='on'
                              className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                            />
                            <button
                              type='button'
                              onClick={() => setShowPassword((prev) => !prev)}
                              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition cursor-pointer'
                              tabIndex={-1}
                            >
                              {!showPassword ? (
                                <EyeOff className='w-4 h-4' />
                              ) : (
                                <Eye className='w-4 h-4' />
                              )}
                            </button>
                          </div>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className='grid gap-3 relative'>
                    <Controller
                      name='confirmPassword'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Xác nhận mật khẩu'
                              autoComplete='on'
                              className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                            />
                            <button
                              type='button'
                              onClick={() => setShowPassword((prev) => !prev)}
                              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition cursor-pointer'
                              tabIndex={-1}
                            >
                              {!showPassword ? (
                                <EyeOff className='w-4 h-4' />
                              ) : (
                                <Eye className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className='grid gap-3 relative'>
                    <Controller
                      name='phone'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Phone className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              placeholder='Số điện thoại'
                              autoComplete='off'
                              className='pl-11 h-12 bg-white border-primary/10 focus:border-primary focus:ring-primary/20 rounded-xl transition-all'
                            />
                          </div>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <Button
                    type='submit'
                    className='h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-4'
                  >
                    {loading ? (
                      <Spinner className='h-5 w-5' />
                    ) : (
                      'TẠO TÀI KHOẢN'
                    )}
                  </Button>
                </div>

                <div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 h-px bg-gray-800'></div>
                    <span className='text-sm text-gray-800'>
                      Hoặc tiếp tục với
                    </span>
                    <div className='flex-1 h-px bg-gray-800'></div>
                  </div>
                  <div className='flex flex-col gap-4 mt-8'>
                    <Button
                      variant='outline'
                      type='button'
                      className='h-12 w-full border-primary/10 bg-white/50 hover:bg-primary/5 text-foreground font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3'
                      onClick={() => {
                        googleBtnRef.current
                          ?.querySelector<HTMLDivElement>('div[role=button]')
                          ?.click();
                      }}
                    >
                      <Image
                        className='rounded-full'
                        src='/logo-google.jpg'
                        alt='Google'
                        width={24}
                        height={24}
                      />
                      Đăng nhập với Google
                    </Button>
                  </div>
                </div>

                <div className='text-center text-sm text-foreground/60 font-medium'>
                  Đã có tài khoản?{' '}
                  <button
                    type='button'
                    className='text-primary font-bold hover:underline ml-1'
                    onClick={() => {
                      router.push('/login');
                    }}
                  >
                    ĐĂNG NHẬP
                  </button>
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
