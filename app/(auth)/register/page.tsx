'use client';

import { getErrorMessage } from '@/lib/getErrorMessage';
import { useRegister } from '@/hooks/auth/useRegister';
import { RegisterFormData } from '@/schemas/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

export default function RegisterPage() {
  const route = useRouter();
  const register = useRegister();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = async (data: RegisterFormData): Promise<void> => {
    const { confirmPassword, ...payload } = data;
    if (confirmPassword !== data.password) {
      toast.error('Mật khẩu nhập lại không khớp.');
      return;
    }

    register.mutate(payload, {
      onSuccess: (res) => {
        const authData = res?.data || res;
        const token = authData?.accessToken;
        const refreshToken = authData?.refreshToken;
        const user = authData?.user;

        if (token && user) {
          setAccessToken(token);
          if (refreshToken) setRefreshToken(refreshToken);
          setUser(user);
          toast.success('Đăng ký và đăng nhập thành công.');
          route.replace('/');
        } else {
          toast.success('Đăng ký thành công. Vui lòng đăng nhập.');
          route.replace('/login');
        }
      },

      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <div className='relative flex-1 overflow-hidden bg-muted/30'>
      <div className='pointer-events-none absolute -top-32 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]' />
      <div className='pointer-events-none absolute -bottom-45 left-1/2 h-105 w-105 -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[120px]' />

      <div className='relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10'>
        <div className='grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5 lg:grid-cols-2'>
          <AuthBrandPanel />
          <div className='p-6 sm:p-8 lg:p-10'>
            <RegisterForm onSubmit={handleSubmit} loading={register.isPending} />
          </div>
        </div>
      </div>
    </div>
  );
}
