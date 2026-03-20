'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Star, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/modules/products/ui/hooks/use-products';

const ITEMS_PER_PAGE = 12;

interface ProductsGridProps {
  businessId: string;
  catalogId: string;
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

export function ProductsGrid({ businessId, catalogId }: ProductsGridProps) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const filters = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
  };

  const { data: products = [], isLoading } = useProducts(businessId, filters);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(
    () => products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [products, page]
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (products.length === 0) {
    return (
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
            <Link href={`/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/new`}>
              <Plus className='size-4' />
              Crear producto
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {paginatedProducts.map((product) => (
          <Link
            key={product.id}
            href={`/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/${product.id}`}
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

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 pt-2'>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className='size-4' />
          </Button>
          <span className='text-muted-foreground text-sm'>
            Página {page} de {totalPages}
          </span>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
