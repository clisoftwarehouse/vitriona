'use client';

import { ProductForm } from './product-form';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { createProductAction } from '@/modules/products/server/actions/create-product.action';

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

interface CreateProductWrapperProps {
  catalogId: string;
  businessId: string;
  categories: Category[];
  attributes?: AttributeDefinition[];
}

export function CreateProductWrapper({ catalogId, businessId, categories, attributes }: CreateProductWrapperProps) {
  const handleSubmit = async (values: CreateProductFormValues) => {
    return createProductAction(catalogId, values);
  };

  return (
    <ProductForm
      mode='create'
      catalogId={catalogId}
      businessId={businessId}
      categories={categories}
      attributes={attributes}
      onSubmitAction={handleSubmit}
    />
  );
}
