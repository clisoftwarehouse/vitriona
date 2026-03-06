'use client';

import { ProductForm } from './product-form';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { updateProductAction } from '@/modules/products/server/actions/update-product.action';

interface Category {
  id: string;
  name: string;
}

interface EditProductWrapperProps {
  productId: string;
  catalogId: string;
  businessId: string;
  categories: Category[];
  defaultValues: Partial<CreateProductFormValues>;
}

export function EditProductWrapper({
  productId,
  catalogId,
  businessId,
  categories,
  defaultValues,
}: EditProductWrapperProps) {
  const handleSubmit = async (values: CreateProductFormValues) => {
    return updateProductAction(productId, values);
  };

  return (
    <ProductForm
      mode='edit'
      catalogId={catalogId}
      businessId={businessId}
      categories={categories}
      defaultValues={defaultValues}
      onSubmitAction={handleSubmit}
    />
  );
}
