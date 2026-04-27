'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Undo2, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  cancelPlanSubscriptionAction,
  clearScheduledPlanChangeAction,
} from '@/modules/upgrade/server/actions/cancel-subscription.action';
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

interface SubscriptionActionsProps {
  businessId: string;
  scheduledPlan: string | null;
  billingCycleEndFormatted: string | null;
}

export function SubscriptionActions({ businessId, scheduledPlan, billingCycleEndFormatted }: SubscriptionActionsProps) {
  const [open, setOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelPlanSubscriptionAction(businessId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? 'Cancelación programada');
      setOpen(false);
    });
  };

  const handleRevert = () => {
    startTransition(async () => {
      const result = await clearScheduledPlanChangeAction(businessId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? 'Cambio revertido');
      setRevertOpen(false);
    });
  };

  // If a cancellation is scheduled, show only the revert button
  if (scheduledPlan === 'free') {
    return (
      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogTrigger asChild>
          <Button size='sm' variant='outline'>
            <Undo2 className='mr-2 size-3.5' />
            Revertir cancelación
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Revertir la cancelación?</DialogTitle>
            <DialogDescription>
              Tu plan volverá a renovarse normalmente al final del ciclo. Aún tendrás que pagar la próxima renovación
              cuando llegue la fecha.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='ghost'>Volver</Button>
            </DialogClose>
            <Button onClick={handleRevert} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Revirtiendo...
                </>
              ) : (
                'Sí, mantener mi plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // No scheduled cancellation: show the cancel button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className='border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950'
        >
          <XCircle className='mr-2 size-3.5' />
          Cancelar suscripción
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar tu suscripción?</DialogTitle>
          <DialogDescription>
            Seguirás disfrutando de tu plan actual hasta{' '}
            <strong>{billingCycleEndFormatted ?? 'el fin del ciclo actual'}</strong>. Después, tu negocio pasará al plan
            Gratis. Puedes revertir esta acción en cualquier momento antes de esa fecha.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='ghost'>Volver</Button>
          </DialogClose>
          <Button variant='destructive' onClick={handleCancel} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                Cancelando...
              </>
            ) : (
              'Sí, cancelar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
