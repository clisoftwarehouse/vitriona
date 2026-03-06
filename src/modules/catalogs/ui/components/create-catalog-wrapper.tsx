'use client';

import { CatalogForm } from './catalog-form';
import type { CreateCatalogFormValues } from '@/modules/catalogs/ui/schemas/catalog.schemas';
import { createCatalogAction } from '@/modules/catalogs/server/actions/create-catalog.action';

interface CreateCatalogWrapperProps {
  businessId: string;
}

export function CreateCatalogWrapper({ businessId }: CreateCatalogWrapperProps) {
  const handleSubmit = async (values: CreateCatalogFormValues) => {
    return createCatalogAction(businessId, values);
  };

  return <CatalogForm mode='create' businessId={businessId} onSubmitAction={handleSubmit} />;
}
