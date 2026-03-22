import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getOrderDetailAction, getOrdersByBusinessAction } from '@/modules/orders/server/actions/get-orders.action';
import { cancelOrderAction, updateOrderStatusAction } from '@/modules/orders/server/actions/update-order-status.action';

type OrderStatus = 'pending_payment' | 'payment_verified' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export const orderKeys = {
  all: (businessId: string) => ['orders', businessId] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
};

export function useOrders(businessId: string) {
  return useQuery({
    queryKey: orderKeys.all(businessId),
    queryFn: async () => {
      const result = await getOrdersByBusinessAction(businessId);
      if (result.error || !result.orders) throw new Error(result.error ?? 'Error al cargar pedidos');
      return result.orders;
    },
    refetchInterval: 15_000,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId!),
    queryFn: async () => {
      const result = await getOrderDetailAction(orderId!);
      if (result.error) throw new Error(result.error);
      return { items: result.items!, statusHistory: result.statusHistory! };
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, note }: { orderId: string; status: OrderStatus; note?: string }) => {
      const result = await updateOrderStatusAction(orderId, status, note);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all(businessId) });
    },
  });
}

export function useCancelOrder(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const result = await cancelOrderAction(orderId, reason);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all(businessId) });
    },
  });
}
