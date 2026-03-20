import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adjustStockAction, getInventoryOverviewAction } from '@/modules/inventory/server/actions/inventory.actions';

export const inventoryKeys = {
  overview: (businessId: string) => ['inventory', businessId] as const,
};

export function useInventoryOverview(businessId: string) {
  return useQuery({
    queryKey: inventoryKeys.overview(businessId),
    queryFn: async () => {
      const result = await getInventoryOverviewAction(businessId);
      if (result.error) throw new Error(result.error);
      return { products: result.products!, movements: result.movements! };
    },
  });
}

export function useAdjustStock(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      type,
      quantity,
      reason,
    }: {
      productId: string;
      type: 'in' | 'out' | 'adjustment';
      quantity: number;
      reason?: string;
    }) => {
      const result = await adjustStockAction(productId, { type, quantity, reason });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.overview(businessId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
