import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StorefrontCatalog } from '@/modules/storefront/ui/components/storefront-catalog';
import {
  getBusinessBySlug,
  getDefaultCatalog,
  getPublicProducts,
  getCatalogSettings,
  getPublicCategories,
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

  const [categoriesList, productsList, settings] = await Promise.all([
    getPublicCategories(catalog.id),
    getPublicProducts(catalog.id, categoria || undefined),
    getCatalogSettings(catalog.id),
  ]);

  const filteredProducts = buscar
    ? productsList.filter(
        (p) =>
          p.name.toLowerCase().includes(buscar.toLowerCase()) ||
          p.description?.toLowerCase().includes(buscar.toLowerCase())
      )
    : productsList;

  return (
    <StorefrontCatalog
      slug={slug}
      business={business}
      categories={categoriesList}
      products={filteredProducts}
      activeCategory={categoria}
      searchQuery={buscar}
      settings={settings}
    />
  );
}
