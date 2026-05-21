'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { useLogin } from '@/hooks/auth/useLogin';
import { LoginFormData } from '@/schemas/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { getRoleHome } from '@/constants';

function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = async (data: LoginFormData): Promise<void> => {
    login.mutate(data, {
      onSuccess: (res) => {
        setAccessToken(res.accessToken);
        setRefreshToken(res.refreshToken);
        setUser(res.user);

        // Điều hướng theo role — đồng nhất với app/(auth)/layout.tsx.
        router.replace(getRoleHome(res.user?.role));
        toast.success('Đăng nhập thành công!');
      },
      onError: () => {
        toast.error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
      },
    });
  };

  return (
    <div className='flex-1 bg-primary relative overflow-hidden flex items-center py-8 lg:py-12'>
      <div className='absolute inset-0 opacity-10'>
        <svg className='w-full h-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
          <path d='M0 100 C 20 0 50 0 100 100 Z' fill='white' />
        </svg>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10'>
        <div className='grid lg:grid-cols-2 gap-10 lg:gap-12 items-center'>
          <div className='hidden lg:flex flex-col items-center text-center text-white'>
            <Image
              src='/logo-wave.jpg'
              alt='WAVE'
              width={144}
              height={144}
              sizes='144px'
              className='rounded-full object-cover shadow-sm'
            />

            <h1 className='text-6xl font-black tracking-tighter m-6'>
              WAVE
            </h1>
            <p className='text-xl font-medium text-white/80 max-w-md leading-relaxed uppercase tracking-widest'>
              Nền tảng chăm sóc xe hơi <br /> thông minh & hiện đại hàng đầu
            </p>
          </div>

          <div className='flex justify-center lg:justify-end'>
            <div className='w-full max-w-md'>
              <LoginForm
                onSubmit={handleSubmit}
                loading={login.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
