'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Search, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { useCatalogProducts, useSyncCatalogProducts } from '@/modules/catalogs/ui/hooks/use-catalog-products';

interface CatalogProductAssignerProps {
  businessId: string;
  catalogId: string;
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  out_of_stock: 'Sin stock',
};

const ITEMS_PER_PAGE = 15;

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

export function CatalogProductAssigner({ businessId, catalogId }: CatalogProductAssignerProps) {
  const { data: products, isLoading } = useCatalogProducts(businessId, catalogId);
  const sync = useSyncCatalogProducts(businessId, catalogId);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  // Initialize selected from server data once loaded
  const currentSelected = useMemo(() => {
    if (selected !== null) return selected;
    if (!products) return new Set<string>();
    return new Set(products.filter((p) => p.assigned).map((p) => p.id));
  }, [selected, products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    return sortProducts(result, sort);
  }, [products, search, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  const hasChanges = useMemo(() => {
    if (!products || selected === null) return false;
    const original = new Set(products.filter((p) => p.assigned).map((p) => p.id));
    if (original.size !== currentSelected.size) return true;
    for (const id of currentSelected) {
      if (!original.has(id)) return true;
    }
    return false;
  }, [products, selected, currentSelected]);

  const toggleProduct = (productId: string) => {
    const next = new Set(currentSelected);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelected(next);
  };

  const toggleAll = () => {
    if (!filtered) return;
    const allFilteredSelected = filtered.every((p) => currentSelected.has(p.id));
    const next = new Set(currentSelected);
    if (allFilteredSelected) {
      filtered.forEach((p) => next.delete(p.id));
    } else {
      filtered.forEach((p) => next.add(p.id));
    }
    setSelected(next);
  };

  const handleSave = () => {
    sync.mutate(Array.from(currentSelected), {
      onSuccess: () => {
        toast.success('Productos del catálogo actualizados');
        setSelected(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='text-muted-foreground size-5 animate-spin' />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className='py-8 text-center'>
        <Package className='text-muted-foreground mx-auto size-8' />
        <p className='text-muted-foreground mt-2 text-sm'>
          No hay productos en este negocio. Crea productos primero para asignarlos a este catálogo.
        </p>
      </div>
    );
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => currentSelected.has(p.id));
  const someFilteredSelected = filtered.some((p) => currentSelected.has(p.id));

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
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
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortOption);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-44'>
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
        <Badge variant='outline'>
          {currentSelected.size} / {products.length}
        </Badge>
      </div>

      <div className='flex items-center gap-2 border-b pb-2'>
        <Checkbox
          checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
          onCheckedChange={toggleAll}
        />
        <span className='text-muted-foreground text-xs font-medium'>
          {allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </span>
      </div>

      <div className='max-h-96 space-y-1 overflow-y-auto'>
        {paginated.map((product) => (
          <label
            key={product.id}
            className='hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors'
          >
            <Checkbox checked={currentSelected.has(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{product.name}</p>
              <p className='text-muted-foreground text-xs'>
                ${Number(product.price).toFixed(2)}
                {product.sku && ` · SKU: ${product.sku}`}
              </p>
            </div>
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className='shrink-0 text-[10px]'>
              {statusLabels[product.status] ?? product.status}
            </Badge>
          </label>
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

      {hasChanges && (
        <div className='flex items-center justify-between border-t pt-3'>
          <p className='text-muted-foreground text-xs'>Tienes cambios sin guardar</p>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => setSelected(null)} disabled={sync.isPending}>
              Descartar
            </Button>
            <Button size='sm' onClick={handleSave} disabled={sync.isPending}>
              {sync.isPending ? (
                <>
                  <Loader2 className='size-3.5 animate-spin' />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
