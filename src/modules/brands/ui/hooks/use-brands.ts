import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getBrandsAction } from '@/modules/brands/server/actions/get-brands.action';
import type { CreateBrandFormValues } from '@/modules/brands/ui/schemas/brand.schemas';
import { createBrandAction } from '@/modules/brands/server/actions/create-brand.action';
import { deleteBrandAction } from '@/modules/brands/server/actions/delete-brand.action';
import { updateBrandAction } from '@/modules/brands/server/actions/update-brand.action';

export const brandKeys = {
  all: (businessId: string) => ['brands', businessId] as const,
};

export function useBrands(businessId: string) {
  return useQuery({
    queryKey: brandKeys.all(businessId),
    queryFn: () => getBrandsAction(businessId),
  });
}

export function useCreateBrand(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateBrandFormValues) => createBrandAction(businessId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: brandKeys.all(businessId) });
      }
    },
  });
}

export function useUpdateBrand(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, values }: { brandId: string; values: CreateBrandFormValues }) =>
      updateBrandAction(brandId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: brandKeys.all(businessId) });
      }
    },
  });
}

export function useDeleteBrand(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteBrandAction(brandId),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: brandKeys.all(businessId) });
      }
    },
  });
}
