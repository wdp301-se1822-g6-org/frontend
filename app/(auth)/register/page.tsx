'use client';

import { getErrorMessage } from '@/lib/getErrorMessage';
import { useRegister } from '@/hooks/auth/useRegister';
import { RegisterFormData } from '@/schemas/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const route = useRouter();
  const register = useRegister();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = async (data: RegisterFormData): Promise<void> => {
    const { confirmPassword, ...payload } = data;
    if (confirmPassword !== data.password) {
      toast.error('Mật khẩu nhập lại không khớp.');
      return;
    }

    register.mutate(payload, {
      onSuccess: (res) => {
        // Extract data even if nested under .data property
        const authData = res?.data || res;
        const token = authData?.accessToken;
        const user = authData?.user;

        if (token && user) {
          setAccessToken(token);
          setUser(user);
          toast.success('Đăng ký và đăng nhập thành công!');
          route.replace('/');
        } else {
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
          route.replace('/login');
        }
      },

      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <div className='flex-1 bg-primary relative overflow-hidden flex items-center py-8 lg:py-12'>
      <div className='absolute inset-0 opacity-10 rotate-180'>
        <svg className='w-full h-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
          <path d='M0 100 C 20 0 50 0 100 100 Z' fill='white' />
        </svg>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10'>
        <div className='grid lg:grid-cols-2 gap-10 lg:gap-12 items-center'>
          <div className='flex justify-center lg:justify-start order-2 lg:order-1'>
            <div className='w-full max-w-xl'>
              <RegisterForm
                onSubmit={handleSubmit}
                loading={register.isPending}
              />
            </div>
          </div>

          <div className='hidden lg:flex flex-col items-center text-center text-white order-1 lg:order-2'>
            <Image
              src='/logo-wave.jpg'
              alt='WAVE'
              width={144}
              height={144}
              className='rounded-full object-cover shadow-sm'
            />
            <h1 className='text-6xl font-black tracking-tighter m-6'>
              WAVE
            </h1>
            <p className='text-xl font-medium text-white/80 max-w-md leading-relaxed uppercase tracking-widest'>
              Đăng ký ngay để nhận <br /> vô vàn ưu đãi đặc biệt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
