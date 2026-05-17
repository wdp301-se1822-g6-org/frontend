import { axiosInstance } from '@/lib/axios';
import { useMutation } from '@tanstack/react-query';
import { UserLogin } from '@/types/auth';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: UserLogin) => {
      const res = await axiosInstance.post('auth/login', data);
      if (!res.data) {
        throw new Error('Login failed');
      }
      return res.data;
    },
  });
};
