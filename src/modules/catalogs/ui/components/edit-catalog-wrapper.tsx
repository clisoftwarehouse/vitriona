'use client';

import { CatalogForm } from './catalog-form';
import type { CreateCatalogFormValues } from '@/modules/catalogs/ui/schemas/catalog.schemas';
import { updateCatalogAction } from '@/modules/catalogs/server/actions/update-catalog.action';

interface EditCatalogWrapperProps {
  businessId: string;
  catalogId: string;
  defaultValues: Partial<CreateCatalogFormValues>;
}

export function EditCatalogWrapper({ businessId, catalogId, defaultValues }: EditCatalogWrapperProps) {
  const handleSubmit = async (values: CreateCatalogFormValues) => {
    return updateCatalogAction(catalogId, values);
  };

  return (
    <CatalogForm mode='edit' businessId={businessId} defaultValues={defaultValues} onSubmitAction={handleSubmit} />
  );
}
