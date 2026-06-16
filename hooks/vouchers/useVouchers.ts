import { useQuery } from '@tanstack/react-query';
import { getMyVouchers } from '@/lib/customer-api';
import { Voucher } from '@/types/voucher';

export const useVouchers = (
  status?: 'unused' | 'used' | 'expired',
) => {
  return useQuery({
    queryKey: ['my-vouchers', status ?? 'all'],
    queryFn: async (): Promise<Voucher[]> => {
      const res = await getMyVouchers(status);
      return res.data?.data ?? res.data ?? [];
    },
  });
};
