'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { useLogin } from '@/hooks/auth/useLogin';
import { LoginFormData } from '@/schemas/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
        router.replace(getRoleHome(res.user?.role));
        toast.success('Đăng nhập thành công!');
      },
      onError: () => {
        toast.error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
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
            <LoginForm onSubmit={handleSubmit} loading={login.isPending} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
