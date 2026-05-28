import { useQuery } from '@tanstack/react-query';
import { getMyLoyaltyTransactions } from '@/lib/customer-api';

export const useLoyaltyTransactions = () => {
  return useQuery({
    queryKey: ['my-loyalty-transactions'],
    queryFn: async () => {
      const res = await getMyLoyaltyTransactions();
      return res.data?.data || res.data || [];
    },
  });
};
