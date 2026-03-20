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

interface Catalog {
  id: string;
  name: string;
}

interface EditProductWrapperProps {
  productId: string;
  catalogId?: string;
  businessId: string;
  categories: Category[];
  catalogs?: Catalog[];
  attributes?: AttributeDefinition[];
  defaultValues: Partial<CreateProductFormValues>;
}

export function EditProductWrapper({
  productId,
  catalogId,
  businessId,
  categories,
  catalogs,
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
      catalogs={catalogs}
      attributes={attributes}
      defaultValues={defaultValues}
      onSubmitAction={handleSubmit}
    />
  );
}
