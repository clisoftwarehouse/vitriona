import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  syncCatalogProductsAction,
  getBusinessProductsWithCatalogStatus,
} from '@/modules/catalogs/server/actions/catalog-products.action';

export const catalogProductKeys = {
  all: (catalogId: string) => ['catalog-products', catalogId] as const,
};

export function useCatalogProducts(businessId: string, catalogId: string) {
  return useQuery({
    queryKey: catalogProductKeys.all(catalogId),
    queryFn: async () => {
      const result = await getBusinessProductsWithCatalogStatus(businessId, catalogId);
      if (result.error) throw new Error(result.error);
      return result.products!;
    },
  });
}

export function useSyncCatalogProducts(businessId: string, catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const result = await syncCatalogProductsAction(catalogId, businessId, productIds);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogProductKeys.all(catalogId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
