'use client';

import { toast } from 'sonner';
import { Search, Loader2, GiftIcon } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  redeemGiftCardManuallyAction,
  getGiftCardForRedemptionAction,
} from '@/modules/gift-cards/server/actions/gift-card-actions';
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface GiftCardLookup {
  id: string;
  businessId: string;
  code: string;
  type: 'fixed' | 'percentage' | 'product';
  initialValue: string;
  currentBalance: string;
  maxDiscount: string | null;
  applicableProductIds: string[] | null;
  recipientName: string | null;
  senderName: string | null;
  message: string | null;
  expiresAt: Date | null;
  isActive: boolean;
}

interface GiftCardRedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
  restrictToBusinessId?: string;
  onRedeemed?: () => void;
}

export function GiftCardRedeemDialog({
  open,
  onOpenChange,
  initialCode,
  restrictToBusinessId,
  onRedeemed,
}: GiftCardRedeemDialogProps) {
  const [code, setCode] = useState(initialCode ?? '');
  const [card, setCard] = useState<GiftCardLookup | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupPending, startLookup] = useTransition();
  const [redeemPending, startRedeem] = useTransition();

  const reset = () => {
    setCode(initialCode ?? '');
    setCard(null);
    setAmount('');
    setNotes('');
    setLookupError(null);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (initialCode) {
      setCode(initialCode);
      handleLookup(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCode]);

  const handleLookup = (codeToLookup?: string) => {
    const target = (codeToLookup ?? code).trim().toUpperCase();
    if (!target) {
      setLookupError('Ingresa un código');
      return;
    }
    setLookupError(null);
    setCard(null);
    startLookup(async () => {
      const result = await getGiftCardForRedemptionAction(target);
      if (result.error || !result.data) {
        setLookupError(result.error ?? 'No encontrada');
        return;
      }
      const found = result.data as GiftCardLookup;
      if (restrictToBusinessId && found.businessId !== restrictToBusinessId) {
        setLookupError('Esta gift card pertenece a otro negocio.');
        return;
      }
      setCard(found);
    });
  };

  const handleRedeem = () => {
    if (!card) return;

    const isPercentage = card.type === 'percentage';
    let amountNum: number | undefined;

    if (!isPercentage) {
      amountNum = parseFloat(amount);
      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        toast.error('Ingresa el monto a canjear');
        return;
      }
      const balance = parseFloat(card.currentBalance);
      if (amountNum > balance) {
        toast.error(`El monto supera el saldo disponible ($${balance.toFixed(2)})`);
        return;
      }
    }

    startRedeem(async () => {
      const result = await redeemGiftCardManuallyAction({
        giftCardId: card.id,
        amount: amountNum,
        notes: notes.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.deactivated) {
        toast.success('Gift card canjeada (single-use desactivada)');
      } else {
        toast.success(`Canje registrado. Saldo restante: $${(result.balanceAfter ?? 0).toFixed(2)}`);
      }
      onRedeemed?.();
      onOpenChange(false);
    });
  };

  const balance = card ? parseFloat(card.currentBalance) : 0;
  const initial = card ? parseFloat(card.initialValue) : 0;
  const maxDiscount = card?.maxDiscount ? parseFloat(card.maxDiscount) : null;
  const isExpired = card?.expiresAt ? new Date(card.expiresAt) < new Date() : false;
  const applicableProducts = card?.applicableProductIds ?? null;
  const canRedeem = card != null && card.isActive && !isExpired && (card.type === 'percentage' || balance > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Canjear gift card</DialogTitle>
          <DialogDescription>
            Ingresa el código o escanéalo desde el correo. Confirma el monto a entregar al cliente.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <Label>Código</Label>
            <div className='mt-1 flex gap-2'>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder='XXXX-XXXX-XXXX-XXXX'
                className='font-mono tracking-wider uppercase'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookup();
                }}
              />
              <Button variant='outline' onClick={() => handleLookup()} disabled={lookupPending}>
                {lookupPending ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
              </Button>
            </div>
            {lookupError && <p className='mt-1 text-xs text-red-600'>{lookupError}</p>}
          </div>

          {card && (
            <div className='bg-muted/30 space-y-3 rounded-lg border p-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg'>
                  <GiftIcon className='text-primary size-5' />
                </div>
                <div className='flex-1'>
                  <p className='font-mono text-sm font-bold tracking-wider'>{card.code}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {card.type === 'fixed' && `Monto fijo · Saldo: $${balance.toFixed(2)} de $${initial.toFixed(2)}`}
                    {card.type === 'percentage' &&
                      `Porcentaje · ${initial}%${maxDiscount ? ` (tope $${maxDiscount.toFixed(2)})` : ''}`}
                    {card.type === 'product' && `Producto específico · Saldo: $${balance.toFixed(2)}`}
                  </p>
                  {card.recipientName && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>Para: {card.recipientName}</p>
                  )}
                  {card.senderName && <p className='text-muted-foreground mt-0.5 text-xs'>De: {card.senderName}</p>}
                </div>
              </div>

              {applicableProducts && applicableProducts.length > 0 && (
                <div className='rounded-md bg-amber-50 p-2 text-xs text-amber-900'>
                  Solo aplica a {applicableProducts.length} producto
                  {applicableProducts.length !== 1 ? 's' : ''} específico{applicableProducts.length !== 1 ? 's' : ''}.
                  Verifica antes de entregar.
                </div>
              )}

              {!card.isActive && (
                <p className='rounded-md bg-gray-100 p-2 text-xs text-gray-600'>Esta gift card está inactiva.</p>
              )}
              {isExpired && (
                <p className='rounded-md bg-red-50 p-2 text-xs text-red-700'>Esta gift card está expirada.</p>
              )}
              {card.type === 'fixed' && balance <= 0 && card.isActive && !isExpired && (
                <p className='rounded-md bg-amber-50 p-2 text-xs text-amber-700'>
                  Esta gift card no tiene saldo disponible.
                </p>
              )}

              {canRedeem && card.type !== 'percentage' && (
                <div>
                  <Label>Monto a canjear *</Label>
                  <Input
                    type='number'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={balance.toFixed(2)}
                    className='mt-1'
                    min='0'
                    max={balance}
                    step='0.01'
                  />
                  <p className='text-muted-foreground mt-1 text-xs'>Saldo disponible: ${balance.toFixed(2)}</p>
                </div>
              )}

              {canRedeem && card.type === 'percentage' && (
                <div className='rounded-md bg-blue-50 p-2 text-xs text-blue-900'>
                  Las gift cards de porcentaje son de un solo uso. Se desactivará al canjear.
                </div>
              )}

              {canRedeem && (
                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Ej: canje presencial en local'
                    className='mt-1'
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' disabled={redeemPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleRedeem} disabled={!canRedeem || redeemPending}>
            {redeemPending ? <Loader2 className='size-4 animate-spin' /> : null}
            Canjear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
