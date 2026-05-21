import { axiosInstance } from '@/lib/axios';
import { useMutation } from '@tanstack/react-query';
import { UserLogin } from '@/types/auth';
import { ENDPOINTS } from '@/services/endpoints';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: UserLogin) => {
      const res = await axiosInstance.post(ENDPOINTS.auth.login, data);
      if (!res.data) {
        throw new Error('Login failed');
      }
      return res.data;
    },
  });
};
