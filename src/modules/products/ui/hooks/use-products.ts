import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { getProductsAction } from '@/modules/products/server/actions/get-products.action';
import { deleteProductAction } from '@/modules/products/server/actions/delete-product.action';

interface ProductFilters {
  search?: string;
  status?: string;
  categoryId?: string;
}

export const productKeys = {
  all: (businessId: string) => ['products', businessId] as const,
  filtered: (businessId: string, filters: ProductFilters) => ['products', businessId, filters] as const,
};

export function useProducts(businessId: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.filtered(businessId, filters),
    queryFn: async () => {
      return getProductsAction(businessId, filters);
    },
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useDeleteProduct(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await deleteProductAction(productId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all(businessId) });
    },
  });
}
