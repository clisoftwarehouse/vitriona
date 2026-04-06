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

interface Brand {
  id: string;
  name: string;
}

interface BundleComponentOption {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: 'active' | 'inactive' | 'out_of_stock';
}

interface EditProductWrapperProps {
  productId: string;
  catalogId?: string;
  businessId: string;
  categories: Category[];
  catalogs?: Catalog[];
  brands?: Brand[];
  attributes?: AttributeDefinition[];
  bundleComponentOptions?: BundleComponentOption[];
  defaultValues: Partial<CreateProductFormValues>;
  hasVariants?: boolean;
  currency?: string;
}

export function EditProductWrapper({
  productId,
  catalogId,
  businessId,
  categories,
  catalogs,
  brands,
  attributes,
  bundleComponentOptions,
  defaultValues,
  hasVariants,
  currency,
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
      brands={brands}
      attributes={attributes}
      bundleComponentOptions={bundleComponentOptions}
      defaultValues={defaultValues}
      hasVariants={hasVariants}
      currency={currency}
      onSubmitAction={handleSubmit}
    />
  );
}
