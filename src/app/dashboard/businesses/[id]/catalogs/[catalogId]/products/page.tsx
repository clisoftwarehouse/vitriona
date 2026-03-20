import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductsGrid } from '@/modules/products/ui/components/products-grid';
import { ProductsFilters } from '@/modules/products/ui/components/products-filters';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface ProductsPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { id, catalogId } = await params;

  const [business, catalog, categories] = await Promise.all([
    getBusinessByIdAction(id),
    getCatalogByIdAction(catalogId),
    getCategoriesAction(catalogId),
  ]);

  if (!business || !catalog) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon-sm' asChild>
            <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}`}>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Productos</h2>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {business.name} — {catalog.name}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products/new`}>
            <Plus className='size-4' />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <ProductsFilters categories={categories} />

      <Suspense
        fallback={
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='text-muted-foreground size-6 animate-spin' />
          </div>
        }
      >
        <ProductsGrid businessId={id} catalogId={catalogId} />
      </Suspense>
    </div>
  );
}
