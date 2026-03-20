import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';
import { createCategoryAction } from '@/modules/categories/server/actions/create-category.action';
import { deleteCategoryAction } from '@/modules/categories/server/actions/delete-category.action';
import { updateCategoryAction } from '@/modules/categories/server/actions/update-category.action';
import { reorderCategoriesAction } from '@/modules/categories/server/actions/reorder-categories.action';

export const categoryKeys = {
  all: (businessId: string) => ['categories', businessId] as const,
};

export function useCategories(businessId: string) {
  return useQuery({
    queryKey: categoryKeys.all(businessId),
    queryFn: () => getCategoriesAction(businessId),
  });
}

export function useCreateCategory(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateCategoryFormValues) => createCategoryAction(businessId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(businessId) });
      }
    },
  });
}

export function useUpdateCategory(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, values }: { categoryId: string; values: CreateCategoryFormValues }) =>
      updateCategoryAction(categoryId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(businessId) });
      }
    },
  });
}

export function useDeleteCategory(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategoryAction(categoryId),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(businessId) });
      }
    },
  });
}

export function useReorderCategories(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderCategoriesAction(businessId, orderedIds),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(businessId) });
      }
    },
  });
}
