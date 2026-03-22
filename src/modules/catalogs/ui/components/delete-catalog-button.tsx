'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteCatalogAction } from '@/modules/catalogs/server/actions/delete-catalog.action';
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface DeleteCatalogButtonProps {
  catalogId: string;
  catalogName: string;
  businessId: string;
}

export function DeleteCatalogButton({ catalogId, catalogName, businessId }: DeleteCatalogButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCatalogAction(catalogId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/dashboard/businesses/${businessId}/catalogs`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='destructive' size='sm'>
          <Trash2 className='size-4' />
          Eliminar catálogo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar catálogo?</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar <strong>{catalogName}</strong>. Esta acción no se puede deshacer y se eliminarán
            todas las categorías y productos asociados.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant='destructive' onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
