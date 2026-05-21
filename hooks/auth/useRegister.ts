import { axiosInstance } from '@/lib/axios';
import { UserRegister } from '@/types/auth';
import { useMutation } from '@tanstack/react-query';
import { ENDPOINTS } from '@/services/endpoints';

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: UserRegister) => {
      const res = await axiosInstance.post(ENDPOINTS.auth.register, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.data) {
        throw new Error('Register failed');
      }

      return res.data;
    },
  });
};
