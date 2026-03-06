import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus, Star, Package, ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductsFilters } from '@/modules/products/ui/components/products-filters';
import { getProductsAction } from '@/modules/products/server/actions/get-products.action';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface ProductsPageProps {
  params: Promise<{ id: string; catalogId: string }>;
  searchParams: Promise<{ search?: string; status?: string; categoryId?: string }>;
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  out_of_stock: 'Sin stock',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  out_of_stock: 'destructive',
};

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { id, catalogId } = await params;
  const filters = await searchParams;

  const [business, catalog, categories, products] = await Promise.all([
    getBusinessByIdAction(id),
    getCatalogByIdAction(catalogId),
    getCategoriesAction(catalogId),
    getProductsAction(catalogId, {
      search: filters.search,
      status: filters.status,
      categoryId: filters.categoryId,
    }),
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

      {products.length === 0 ? (
        <Card className='py-16'>
          <CardContent className='flex flex-col items-center justify-center text-center'>
            <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
              <Package className='text-muted-foreground size-6' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No hay productos</h3>
            <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
              Agrega tu primer producto para que aparezca en tu catálogo.
            </p>
            <Button asChild className='mt-6'>
              <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products/new`}>
                <Plus className='size-4' />
                Crear producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products/${product.id}`}
              className='group'
            >
              <Card className='transition-shadow group-hover:shadow-md'>
                <CardContent className='p-5'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                        <Package className='text-primary size-5' />
                      </div>
                      <div className='min-w-0'>
                        <h3 className='flex items-center gap-1.5 truncate font-semibold'>
                          {product.name}
                          {product.isFeatured && <Star className='size-3.5 shrink-0 fill-amber-500 text-amber-500' />}
                        </h3>
                        <p className='text-muted-foreground text-sm font-medium'>
                          ${Number(product.price).toFixed(2)}
                          {product.compareAtPrice && (
                            <span className='ml-1.5 line-through'>${Number(product.compareAtPrice).toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariants[product.status] ?? 'secondary'} className='shrink-0 text-[10px]'>
                      {statusLabels[product.status] ?? product.status}
                    </Badge>
                  </div>

                  {product.description && (
                    <p className='text-muted-foreground mt-3 line-clamp-2 text-sm'>{product.description}</p>
                  )}

                  <div className='mt-3 flex items-center gap-2'>
                    {product.sku && (
                      <Badge variant='outline' className='text-xs'>
                        SKU: {product.sku}
                      </Badge>
                    )}
                    {product.stock !== null && (
                      <Badge variant='outline' className='text-xs'>
                        Stock: {product.stock}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
