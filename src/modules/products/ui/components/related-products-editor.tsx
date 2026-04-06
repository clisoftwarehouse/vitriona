'use client';

import { toast } from 'sonner';
import { X, Plus, Link2, Search } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getRelatedProductIds,
  syncRelatedProductsAction,
  getBusinessProductsForRelatedPicker,
} from '@/modules/products/server/actions/related-products.action';

interface PickerProduct {
  id: string;
  name: string;
  price: string;
  sku: string | null;
}

interface RelatedProductsEditorProps {
  productId: string;
  businessId: string;
}

export function RelatedProductsEditor({ productId, businessId }: RelatedProductsEditorProps) {
  const [allProducts, setAllProducts] = useState<PickerProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [relatedIds, productsResult] = await Promise.all([
        getRelatedProductIds(productId),
        getBusinessProductsForRelatedPicker(businessId, productId),
      ]);
      setSelectedIds(relatedIds);
      if ('products' in productsResult && productsResult.products) {
        setAllProducts(productsResult.products);
      }
      setLoaded(true);
    }
    load();
  }, [productId, businessId]);

  const selectedProducts = allProducts.filter((p) => selectedIds.includes(p.id));

  const filteredProducts = allProducts.filter((p) => {
    if (selectedIds.includes(p.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const handleAdd = (id: string) => {
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await syncRelatedProductsAction(productId, selectedIds);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Productos relacionados actualizados');
        setShowPicker(false);
      }
    });
  };

  if (!loaded) {
    return (
      <div className='flex items-center justify-center py-8'>
        <span className='text-muted-foreground text-sm'>Cargando productos relacionados...</span>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-muted-foreground text-xs'>
            {selectedProducts.length === 0
              ? 'Sin productos relacionados. Se mostrarán los más vendidos como sugerencia.'
              : `${selectedProducts.length} producto${selectedProducts.length !== 1 ? 's' : ''} seleccionado${selectedProducts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button type='button' variant='outline' size='sm' onClick={() => setShowPicker(!showPicker)}>
          <Plus className='mr-1 size-3.5' />
          {showPicker ? 'Cerrar' : 'Agregar'}
        </Button>
      </div>

      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <div className='space-y-2'>
          {selectedProducts.map((product) => (
            <div key={product.id} className='bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2'>
              <div className='flex items-center gap-2'>
                <Link2 className='text-muted-foreground size-3.5' />
                <span className='text-sm font-medium'>{product.name}</span>
                {product.sku && <span className='text-muted-foreground text-xs'>({product.sku})</span>}
              </div>
              <button
                type='button'
                onClick={() => handleRemove(product.id)}
                className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
              >
                <X className='size-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product picker dropdown */}
      {showPicker && (
        <div className='space-y-3 rounded-lg border p-3'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2' />
            <Input
              placeholder='Buscar producto por nombre o SKU...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 text-sm'
              autoFocus
            />
          </div>
          <div className='max-h-48 space-y-1 overflow-y-auto'>
            {filteredProducts.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-xs'>No hay productos disponibles</p>
            ) : (
              filteredProducts.slice(0, 20).map((product) => (
                <button
                  key={product.id}
                  type='button'
                  onClick={() => handleAdd(product.id)}
                  className='hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors'
                >
                  <div>
                    <span className='text-sm font-medium'>{product.name}</span>
                    {product.sku && <span className='text-muted-foreground ml-2 text-xs'>({product.sku})</span>}
                  </div>
                  <Plus className='text-muted-foreground size-3.5' />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className='flex justify-end'>
        <Button type='button' size='sm' onClick={handleSave} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar productos relacionados'}
        </Button>
      </div>
    </div>
  );
}
