'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useTransition } from 'react';
import { Plus, Star, Search, Loader2, Package, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/modules/products/ui/hooks/use-products';
import { reorderProductsAction } from '@/modules/products/server/actions/reorder-products.action';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';

const ITEMS_PER_PAGE = 12;

interface Category {
  id: string;
  name: string;
}

interface ProductsGridProps {
  businessId: string;
  catalogId?: string;
  categories?: Category[];
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

const typeLabels: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  bundle: 'Paquete',
};

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'storefront';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'storefront', label: 'Orden en tienda' },
];

function sortProducts<T extends { name: string; price: string; createdAt: Date; sortOrder: number }>(
  items: T[],
  sort: SortOption
): T[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'az':
        return a.name.localeCompare(b.name);
      case 'za':
        return b.name.localeCompare(a.name);
      case 'price_asc':
        return Number(a.price) - Number(b.price);
      case 'price_desc':
        return Number(b.price) - Number(a.price);
      case 'storefront':
        return a.sortOrder - b.sortOrder;
      default:
        return 0;
    }
  });
}

export function ProductsGrid({ businessId, catalogId, categories = [] }: ProductsGridProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isReordering, startReorder] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const filters = {
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
  };

  const { data: products = [], isLoading, isFetching, refetch } = useProducts(businessId, filters);
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  const isStorefrontSort = sort === 'storefront';

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const globalIndex = (page - 1) * ITEMS_PER_PAGE + index;
    const swapIndex = direction === 'up' ? globalIndex - 1 : globalIndex + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const newOrder = sorted.map((p) => p.id);
    [newOrder[globalIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[globalIndex]];

    startReorder(async () => {
      const result = await reorderProductsAction(businessId, newOrder);
      if (result.error) {
        toast.error(result.error);
      } else {
        await refetch();
      }
    });
  };
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(
    () => sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [sorted, page]
  );

  const hasFilters = debouncedSearch || statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder='Buscar producto...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-40'>
            <SelectValue placeholder='Estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='active'>Activo</SelectItem>
            <SelectItem value='inactive'>Inactivo</SelectItem>
            <SelectItem value='out_of_stock'>Sin stock</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-full sm:w-44'>
              <SelectValue placeholder='Categoría' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortOption);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground size-6 animate-spin' />
        </div>
      ) : products.length === 0 && !hasFilters ? (
        <Card className='py-16'>
          <CardContent className='flex flex-col items-center justify-center text-center'>
            <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
              <Package className='text-muted-foreground size-6' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No hay productos</h3>
            <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
              Agrega tu primer producto, servicio o paquete para empezar a vender desde tu tienda.
            </p>
            <Button asChild className='mt-6'>
              <Link
                href={
                  catalogId
                    ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/new`
                    : `/dashboard/businesses/${businessId}/products/new`
                }
              >
                <Plus className='size-4' />
                Crear producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : products.length === 0 && hasFilters ? (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <Search className='text-muted-foreground mb-3 size-8' />
          <p className='text-muted-foreground text-sm'>No se encontraron productos con los filtros actuales.</p>
        </div>
      ) : (
        <>
          {isFetching && (
            <div className='flex items-center justify-center py-2'>
              <Loader2 className='text-muted-foreground size-4 animate-spin' />
            </div>
          )}

          <div className='grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
            {paginatedProducts.map((product, idx) => (
              <div key={product.id} className='group relative'>
                <Link
                  href={
                    catalogId
                      ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/${product.id}`
                      : `/dashboard/businesses/${businessId}/products/${product.id}`
                  }
                >
                  <Card className='h-full overflow-hidden transition-shadow group-hover:shadow-md'>
                    <CardContent className='flex h-full flex-col p-4 sm:p-5'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10'>
                          <Package className='text-primary size-4 sm:size-5' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <h3 className='min-w-0 flex-1 truncate text-sm font-semibold sm:text-base'>
                              {product.name}
                              {product.isFeatured && (
                                <Star className='ml-1 inline size-3 shrink-0 fill-amber-500 text-amber-500 sm:size-3.5' />
                              )}
                            </h3>
                            <Badge
                              variant={statusVariants[product.status] ?? 'secondary'}
                              className='shrink-0 text-[10px]'
                            >
                              {statusLabels[product.status] ?? product.status}
                            </Badge>
                          </div>
                          <div className='mt-0.5 flex items-center gap-2'>
                            <span className='text-muted-foreground text-sm font-medium'>
                              ${Number(product.price).toFixed(2)}
                              {product.compareAtPrice && (
                                <span className='ml-1.5 line-through'>
                                  ${Number(product.compareAtPrice).toFixed(2)}
                                </span>
                              )}
                            </span>
                            <Badge variant='outline' className='text-[10px]'>
                              {typeLabels[product.type] ?? product.type}
                            </Badge>
                            {product.sku && (
                              <span className='text-muted-foreground hidden text-xs sm:inline'>SKU: {product.sku}</span>
                            )}
                            {product.stock !== null && (
                              <Badge variant='outline' className='text-[10px]'>
                                Stock: {product.stock}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {isStorefrontSort && (
                  <div className='absolute top-2 right-2 z-10 flex flex-col gap-0.5'>
                    <button
                      type='button'
                      disabled={isReordering || (page - 1) * ITEMS_PER_PAGE + idx === 0}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMove(idx, 'up');
                      }}
                      className='bg-background hover:bg-muted rounded-md border p-1 shadow-sm transition-colors disabled:opacity-30'
                      title='Mover arriba'
                    >
                      <ArrowUp className='size-3.5' />
                    </button>
                    <button
                      type='button'
                      disabled={isReordering || (page - 1) * ITEMS_PER_PAGE + idx === sorted.length - 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMove(idx, 'down');
                      }}
                      className='bg-background hover:bg-muted rounded-md border p-1 shadow-sm transition-colors disabled:opacity-30'
                      title='Mover abajo'
                    >
                      <ArrowDown className='size-3.5' />
                    </button>
                  </div>
                )}
              </div>
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
        </>
      )}
    </div>
  );
}
