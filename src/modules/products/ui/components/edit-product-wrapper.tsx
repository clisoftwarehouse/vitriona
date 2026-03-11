'use client';

import { ProductForm } from './product-form';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { updateProductAction } from '@/modules/products/server/actions/update-product.action';

interface Category {
  id: string;
  name: string;
}

interface AttributeDefinition {
  id: string;
  name: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
}

interface EditProductWrapperProps {
  productId: string;
  catalogId: string;
  businessId: string;
  categories: Category[];
  attributes?: AttributeDefinition[];
  defaultValues: Partial<CreateProductFormValues>;
}

export function EditProductWrapper({
  productId,
  catalogId,
  businessId,
  categories,
  attributes,
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
      attributes={attributes}
      defaultValues={defaultValues}
      onSubmitAction={handleSubmit}
    />
  );
}
