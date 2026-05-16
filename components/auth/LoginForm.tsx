'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, loginSchema } from '@/schemas/auth';
import { Controller, useForm } from 'react-hook-form';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { useRef, useState } from 'react';
import { Spinner } from '../ui/spinner';

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
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card className='border-primary/10 shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-xl'>
        <CardHeader className='text-center space-y-2 pb-8'>
          <CardTitle className='text-3xl font-black tracking-tight text-primary'>
            CHÀO MỪNG TRỞ LẠI
          </CardTitle>
          <p className='text-sm text-foreground/50 font-medium'>Vui lòng đăng nhập để tiếp tục</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className='grid gap-6'>
                <div className='grid gap-6 text-black'>
                  <Controller
                    name='email'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className='grid gap-3 relative group'>
                          <User className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            placeholder='Email của bạn'
                            autoComplete='email'
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
                      name='password'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className='grid gap-3 relative group'>
                            <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors w-4.5 h-4.5' />
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              placeholder='Mật khẩu'
                              autoComplete='current-password'
                              type={showPassword ? 'text' : 'password'}
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
                  <div className='flex justify-end'>
                    <span className='text-xs text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer uppercase tracking-wider'>
                      Quên mật khẩu?
                    </span>
                  </div>

                  <Button
                    type='submit'
                    className='h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  >
                    {loading ? <Spinner className='h-5 w-5' /> : 'ĐĂNG NHẬP'}
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
                      className='h-12 w-full border-primary/10 bg-white hover:bg-primary/5 text-foreground font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3'
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
                  Bạn chưa có tài khoản?{' '}
                  <button
                    type='button'
                    className='text-primary font-bold hover:underline ml-1'
                    onClick={() => {
                      router.push('/register');
                    }}
                  >
                    TẠO TÀI KHOẢN
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
