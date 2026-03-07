import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StorefrontCatalog } from '@/modules/storefront/ui/components/storefront-catalog';
import {
  getBusinessBySlug,
  getDefaultCatalog,
  getPublicProducts,
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

  return {
    title: `${business.name} — Catálogo`,
    description: business.description || `Explora el catálogo de ${business.name}`,
    openGraph: {
      title: business.name,
      description: business.description || `Catálogo de ${business.name}`,
      type: 'website',
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

  const [categories, products] = await Promise.all([
    getPublicCategories(catalog.id),
    getPublicProducts(catalog.id, categoria || undefined),
  ]);

  const filteredProducts = buscar
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(buscar.toLowerCase()) ||
          p.description?.toLowerCase().includes(buscar.toLowerCase())
      )
    : products;

  return (
    <StorefrontCatalog
      slug={slug}
      business={business}
      categories={categories}
      products={filteredProducts}
      activeCategory={categoria}
      searchQuery={buscar}
    />
  );
}
