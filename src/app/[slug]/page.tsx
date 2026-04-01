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
