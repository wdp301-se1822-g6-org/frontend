import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyOrders,
  getMyOrder,
  createOrder,
  rescheduleOrder,
  cancelOrder,
  getAvailableSlots,
  getActiveServiceTypes,
  getMyLoyalty,
  previewOrder,
} from '@/lib/customer-api';
import {
  CreateOrderDto,
  RescheduleOrderDto,
  CancelOrderDto,
  PreviewOrderResponse,
} from '@/types/order';

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await getMyOrders();
      return res.data?.data || res.data || [];
    },
  });
};

export const useMyOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['my-order', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await getMyOrder(id);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      const res = await createOrder(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
};

export const useRescheduleOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RescheduleOrderDto;
    }) => {
      const res = await rescheduleOrder(id, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-order', variables.id] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelOrderDto }) => {
      const res = await cancelOrder(id, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-order', variables.id] });
    },
  });
};

export const useAvailableSlots = (params: {
  serviceTypeId: string;
  vehicleTypeId: string;
  from: string;
  to: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [
      'available-slots',
      params.serviceTypeId,
      params.vehicleTypeId,
      params.from,
      params.to,
    ],
    queryFn: async () => {
      if (
        !params.serviceTypeId ||
        !params.vehicleTypeId ||
        !params.from ||
        !params.to
      )
        return [];
      const res = await getAvailableSlots({
        serviceTypeId: params.serviceTypeId,
        vehicleTypeId: params.vehicleTypeId,
        from: params.from,
        to: params.to,
      });
      return res.data || [];
    },
    enabled:
      params.enabled !== false &&
      !!params.serviceTypeId &&
      !!params.vehicleTypeId &&
      !!params.from &&
      !!params.to,
  });
};

export const useActiveServiceTypes = () => {
  return useQuery({
    queryKey: ['active-service-types'],
    queryFn: async () => {
      const res = await getActiveServiceTypes();
      return res.data || [];
    },
  });
};

/** Tài khoản loyalty của khách (điểm + tiến độ voucher rửa miễn phí). */
export interface MyLoyalty {
  tierName: string;
  pointsBalance: number;
  successfulWashesTowardVoucher: number;
  totalSuccessfulWashes: number;
}

export const useMyLoyalty = () => {
  return useQuery({
    queryKey: ['my-loyalty'],
    queryFn: async (): Promise<MyLoyalty | null> => {
      const res = await getMyLoyalty();
      return res.data?.data ?? res.data ?? null;
    },
  });
};

/**
 * Xem trước giá đơn (giảm theo hạng + golden hour + voucher) trước khi đặt.
 * Không tiêu voucher. Tự chạy lại khi đổi service/giờ/voucher.
 */
export const usePreviewOrder = (params: {
  serviceTypeId: string;
  vehicleTypeId: string;
  scheduledAt: string;
  voucherId?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [
      'order-preview',
      params.serviceTypeId,
      params.vehicleTypeId,
      params.scheduledAt,
      params.voucherId ?? null,
    ],
    queryFn: async (): Promise<PreviewOrderResponse | null> => {
      if (!params.serviceTypeId || !params.vehicleTypeId || !params.scheduledAt)
        return null;
      const res = await previewOrder({
        serviceTypeId: params.serviceTypeId,
        vehicleTypeId: params.vehicleTypeId,
        scheduledAt: params.scheduledAt,
        voucherId: params.voucherId,
      });
      return res.data?.data ?? res.data ?? null;
    },
    enabled:
      params.enabled !== false &&
      !!params.serviceTypeId &&
      !!params.vehicleTypeId &&
      !!params.scheduledAt,
  });
};
