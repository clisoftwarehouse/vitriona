import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';
import { createCategoryAction } from '@/modules/categories/server/actions/create-category.action';
import { deleteCategoryAction } from '@/modules/categories/server/actions/delete-category.action';
import { updateCategoryAction } from '@/modules/categories/server/actions/update-category.action';
import { reorderCategoriesAction } from '@/modules/categories/server/actions/reorder-categories.action';

export const categoryKeys = {
  all: (catalogId: string) => ['categories', catalogId] as const,
};

export function useCategories(catalogId: string) {
  return useQuery({
    queryKey: categoryKeys.all(catalogId),
    queryFn: () => getCategoriesAction(catalogId),
  });
}

export function useCreateCategory(catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateCategoryFormValues) => createCategoryAction(catalogId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(catalogId) });
      }
    },
  });
}

export function useUpdateCategory(catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, values }: { categoryId: string; values: CreateCategoryFormValues }) =>
      updateCategoryAction(categoryId, values),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(catalogId) });
      }
    },
  });
}

export function useDeleteCategory(catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategoryAction(categoryId),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(catalogId) });
      }
    },
  });
}

export function useReorderCategories(catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderCategoriesAction(catalogId, orderedIds),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(catalogId) });
      }
    },
  });
}
