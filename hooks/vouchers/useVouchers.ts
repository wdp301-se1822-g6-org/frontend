import { useQuery } from '@tanstack/react-query';
import { getMyVouchers } from '@/lib/customer-api';
import { Voucher } from '@/types/voucher';

export const useVouchers = () => {
  return useQuery<Voucher[]>({
    queryKey: ['my-vouchers'],
    queryFn: async () => {
      const res = await getMyVouchers();
      return res.data?.data || res.data || [];
    },
  });
};
