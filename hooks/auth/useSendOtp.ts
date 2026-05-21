import { sendOtp } from '@/lib/customer-api';
import { OtpSendDto } from '@/types/auth';
import { useMutation } from '@tanstack/react-query';

export const useSendOtp = () => {
  return useMutation({
    mutationFn: async (data: OtpSendDto) => {
      const res = await sendOtp(data);
      if (!res.data) {
        throw new Error('Send OTP failed');
      }
      return res.data;
    },
  });
};
