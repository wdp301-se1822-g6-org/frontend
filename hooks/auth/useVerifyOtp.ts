import { verifyOtp } from '@/lib/customer-api';
import { OtpVerifyDto } from '@/types/auth';
import { useMutation } from '@tanstack/react-query';

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: OtpVerifyDto) => {
      const res = await verifyOtp(data);
      if (!res.data) {
        throw new Error('Verify OTP failed');
      }
      return res.data;
    },
  });
};
