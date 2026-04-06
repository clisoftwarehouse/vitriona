'use client';

import { toast } from 'sonner';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useMemo, useState, useTransition } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Search, Loader2, Package, ChevronLeft, GripVertical, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { useCatalogProducts, useSyncCatalogProducts } from '@/modules/catalogs/ui/hooks/use-catalog-products';
import { reorderCatalogProductsAction } from '@/modules/catalogs/server/actions/reorder-catalog-products.action';

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

interface ProductRow {
  id: string;
  name: string;
  price: string;
  sku: string | null;
  status: string;
}

function SortableProductRow({ product }: { product: ProductRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors'
    >
      <button
        {...attributes}
        {...listeners}
        className='text-muted-foreground hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing'
        aria-label='Reordenar'
      >
        <GripVertical className='size-4' />
      </button>
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
    </div>
  );
}

export function CatalogProductAssigner({ businessId, catalogId }: CatalogProductAssignerProps) {
  const { data: products, isLoading } = useCatalogProducts(businessId, catalogId);
  const sync = useSyncCatalogProducts(businessId, catalogId);
  const [startReorder] = useTransition();

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  // Initialize selected from server data once loaded
  const currentSelected = useMemo(() => {
    if (selected !== null) return selected;
    if (!products) return new Set<string>();
    return new Set(products.filter((p) => p.assigned).map((p) => p.id));
  }, [selected, products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (sort === 'storefront') {
      result = result.filter((p) => p.assigned);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    if (sort === 'storefront' && localOrder) {
      const orderMap = new Map(localOrder.map((id, i) => [id, i]));
      return [...result].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }
    return sortProducts(result, sort);
  }, [products, search, sort, localOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = filtered.map((p) => p.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reordered = arrayMove(ids, oldIndex, newIndex);
    setLocalOrder(reordered);
    startReorder(async () => {
      const res = await reorderCatalogProductsAction(businessId, catalogId, reordered);
      if (res.error) toast.error(res.error);
    });
  };

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

      {sort === 'storefront' ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className='max-h-96 space-y-1 overflow-y-auto'>
              {filtered.map((product) => (
                <SortableProductRow key={product.id} product={product} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className='max-h-96 space-y-1 overflow-y-auto'>
          {paginated.map((product) => (
            <div
              key={product.id}
              className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors'
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
            </div>
          ))}
        </div>
      )}

      {sort !== 'storefront' && totalPages > 1 && (
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
