'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteProductAction } from '@/modules/products/server/actions/delete-product.action';
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
  businessId: string;
  catalogId?: string;
}

export function DeleteProductButton({ productId, productName, businessId, catalogId }: DeleteProductButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push(
        catalogId
          ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products`
          : `/dashboard/businesses/${businessId}/products`
      );
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='destructive' size='sm'>
          <Trash2 className='size-4' />
          Eliminar producto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar producto?</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar <strong>{productName}</strong>. Esta acción no se puede deshacer.
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
