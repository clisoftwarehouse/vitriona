import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses } from '@/db/schema';
import { SiteBuilder } from '@/modules/catalogs/ui/components/site-builder';
import { getCatalogSettingsForBuilder } from '@/modules/catalogs/server/actions/update-catalog-settings.action';

interface BuilderPageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessBuilderPage({ params }: BuilderPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  // Verify business ownership
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, id), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) notFound();

  // Resolve the default (or first) catalog for this business
  const [catalog] = await db
    .select({ id: catalogs.id })
    .from(catalogs)
    .where(and(eq(catalogs.businessId, id), eq(catalogs.isActive, true), eq(catalogs.isDefault, true)))
    .limit(1);

  const targetCatalog =
    catalog ??
    (
      await db
        .select({ id: catalogs.id })
        .from(catalogs)
        .where(and(eq(catalogs.businessId, id), eq(catalogs.isActive, true)))
        .limit(1)
    )[0];

  if (!targetCatalog) notFound();

  const result = await getCatalogSettingsForBuilder(targetCatalog.id);

  if (result.error || !result.data) notFound();

  return (
    <SiteBuilder
      businessId={id}
      catalogId={targetCatalog.id}
      businessSlug={result.data.businessSlug}
      initialSettings={result.data.settings}
      previewData={{
        business: result.data.business,
        categories: result.data.categories,
        products: result.data.products,
        catalogs: result.data.catalogs,
      }}
    />
  );
}
