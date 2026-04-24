import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StorefrontCatalog } from '@/modules/storefront/ui/components/storefront-catalog';
import {
  getCatalogBySlug,
  getBusinessBySlug,
  getPublicProducts,
  getCatalogSettings,
  getPublicCategories,
} from '@/modules/storefront/server/queries/get-storefront-data';

interface CatalogViewPageProps {
  params: Promise<{ slug: string; catalogSlug: string }>;
  searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

export async function generateMetadata({ params }: CatalogViewPageProps): Promise<Metadata> {
  const { slug, catalogSlug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  const catalog = await getCatalogBySlug(business.id, catalogSlug);
  if (!catalog) return {};

  const settings = await getCatalogSettings(catalog.id);

  const title = settings?.seoTitle || `${catalog.name} — ${business.name}`;
  const description = settings?.seoDescription || catalog.description || `Explora ${catalog.name} de ${business.name}`;

  return {
    title,
    description,
    ...(settings?.seoKeywords ? { keywords: settings.seoKeywords.split(',').map((k: string) => k.trim()) } : {}),
    ...(settings?.seoCanonicalUrl ? { alternates: { canonical: settings.seoCanonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      ...(settings?.ogImageUrl ? { images: [{ url: settings.ogImageUrl }] } : {}),
    },
  };
}

export default async function CatalogViewPage({ params, searchParams }: CatalogViewPageProps) {
  const { slug, catalogSlug } = await params;
  const { categoria, buscar } = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getCatalogBySlug(business.id, catalogSlug);
  if (!catalog) notFound();

  const [categoriesList, productsList, settings] = await Promise.all([
    getPublicCategories(catalog.id, business.id),
    getPublicProducts(business.id, undefined, catalog.id),
    getCatalogSettings(catalog.id),
  ]);

  return (
    <StorefrontCatalog
      slug={slug}
      business={business}
      categories={categoriesList}
      products={productsList}
      activeCategory={categoria}
      searchQuery={buscar}
      settings={settings}
      catalogName={catalog.name}
    />
  );
}
