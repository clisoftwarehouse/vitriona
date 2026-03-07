import { notFound } from 'next/navigation';

import { SiteBuilder } from '@/modules/catalogs/ui/components/site-builder';
import { getCatalogSettingsForBuilder } from '@/modules/catalogs/server/actions/update-catalog-settings.action';

interface BuilderPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { id, catalogId } = await params;
  const result = await getCatalogSettingsForBuilder(catalogId);

  if (result.error || !result.data) notFound();

  return (
    <SiteBuilder
      businessId={id}
      catalogId={catalogId}
      businessSlug={result.data.businessSlug}
      catalogName={result.data.catalogName}
      initialSettings={result.data.settings}
      previewData={{
        business: result.data.business,
        categories: result.data.categories,
        products: result.data.products,
      }}
    />
  );
}
