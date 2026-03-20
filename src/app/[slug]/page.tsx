import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StorefrontCatalog } from '@/modules/storefront/ui/components/storefront-catalog';
import {
  getBusinessBySlug,
  getDefaultCatalog,
  getPublicProducts,
  getCatalogSettings,
  getPublicCategories,
  getCatalogsWithPreviewProducts,
} from '@/modules/storefront/server/queries/get-storefront-data';

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  const catalog = await getDefaultCatalog(business.id);
  const settings = catalog ? await getCatalogSettings(catalog.id) : null;

  const title = settings?.seoTitle || `${business.name} — Catálogo`;
  const description = settings?.seoDescription || business.description || `Explora el catálogo de ${business.name}`;

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

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { slug } = await params;
  const { categoria, buscar } = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) notFound();

  const [categoriesList, productsList, settings, allCatalogsWithProducts] = await Promise.all([
    getPublicCategories(catalog.id, business.id),
    getPublicProducts(business.id),
    getCatalogSettings(catalog.id),
    getCatalogsWithPreviewProducts(business.id, 6),
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
      catalogSections={allCatalogsWithProducts}
    />
  );
}
