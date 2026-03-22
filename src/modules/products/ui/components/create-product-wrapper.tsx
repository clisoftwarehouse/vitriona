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

interface Catalog {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface CreateProductWrapperProps {
  catalogId?: string;
  businessId: string;
  categories: Category[];
  catalogs?: Catalog[];
  brands?: Brand[];
  attributes?: AttributeDefinition[];
}

export function CreateProductWrapper({
  catalogId,
  businessId,
  categories,
  catalogs,
  brands,
  attributes,
}: CreateProductWrapperProps) {
  const handleSubmit = async (values: CreateProductFormValues) => {
    return createProductAction(catalogId, values, businessId);
  };

  return (
    <ProductForm
      mode='create'
      catalogId={catalogId}
      businessId={businessId}
      categories={categories}
      catalogs={catalogs}
      brands={brands}
      attributes={attributes}
      onSubmitAction={handleSubmit}
    />
  );
}
