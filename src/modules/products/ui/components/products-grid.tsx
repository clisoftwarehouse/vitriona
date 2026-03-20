'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Star, Search, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/modules/products/ui/hooks/use-products';
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

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

function sortProducts<T extends { name: string; price: string; createdAt: Date }>(items: T[], sort: SortOption): T[] {
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
      default:
        return 0;
    }
  });
}

export function ProductsGrid({ businessId, catalogId, categories = [] }: ProductsGridProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filters = {
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
  };

  const { data: products = [], isLoading } = useProducts(businessId, filters);
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(
    () => sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [sorted, page]
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
    );
  }

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

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {paginatedProducts.map((product) => (
          <Link
            key={product.id}
            href={
              catalogId
                ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/${product.id}`
                : `/dashboard/businesses/${businessId}/products/${product.id}`
            }
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
