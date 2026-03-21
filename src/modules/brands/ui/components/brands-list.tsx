'use client';

import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

import { BrandForm } from './brand-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CreateBrandFormValues } from '@/modules/brands/ui/schemas/brand.schemas';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/modules/brands/ui/hooks/use-brands';
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sortOrder: number;
}

interface BrandsListProps {
  businessId: string;
}

export function BrandsList({ businessId }: BrandsListProps) {
  const { data: brands = [], isLoading } = useBrands(businessId);
  const createBrand = useCreateBrand(businessId);
  const updateBrand = useUpdateBrand(businessId);
  const deleteBrand = useDeleteBrand(businessId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = async (values: CreateBrandFormValues) => {
    const result = await createBrand.mutateAsync(values);
    return result;
  };

  const handleEdit = async (values: CreateBrandFormValues) => {
    if (!editingId) return { error: 'No hay marca seleccionada' };
    const result = await updateBrand.mutateAsync({ brandId: editingId, values });
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteBrand.mutateAsync(deleteTarget.id);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
  };

  const editingBrand = editingId ? brands.find((b) => b.id === editingId) : null;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='text-muted-foreground size-5 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {brands.length === 0 ? 'No hay marcas aún.' : `${brands.length} marca(s)`}
        </p>
        <Button size='sm' onClick={() => setShowCreateForm(true)}>
          Nueva marca
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva marca</DialogTitle>
            <DialogDescription>Agrega una marca para organizar tus productos.</DialogDescription>
          </DialogHeader>
          <BrandForm mode='create' onSubmitAction={handleCreate} onSuccess={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar marca</DialogTitle>
            <DialogDescription>Modifica los datos de la marca.</DialogDescription>
          </DialogHeader>
          {editingBrand && (
            <BrandForm
              mode='edit'
              defaultValues={{ name: editingBrand.name, logoUrl: editingBrand.logoUrl ?? '' }}
              onSubmitAction={handleEdit}
              onSuccess={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar marca?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar <strong>{deleteTarget?.name}</strong>. Los productos con esta marca quedarán sin
              marca asignada.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant='destructive'>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' disabled={deleteBrand.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteBrand.isPending}>
              {deleteBrand.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand list */}
      {brands.length > 0 && (
        <div className='space-y-2'>
          {brands.map((brand) => (
            <div key={brand.id} className='flex items-center justify-between rounded-lg border px-4 py-3'>
              <span className='text-sm font-medium'>{brand.name}</span>
              <div className='flex items-center gap-1'>
                <Button variant='ghost' size='icon' className='size-8' onClick={() => setEditingId(brand.id)}>
                  <Pencil className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 text-red-500 hover:text-red-600'
                  onClick={() => setDeleteTarget(brand)}
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
