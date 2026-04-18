'use client';

import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useState, useEffect, useTransition } from 'react';
import { X, Search, Camera, Loader2, GiftIcon } from 'lucide-react';

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

const QrScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.Scanner), {
  ssr: false,
  loading: () => (
    <div className='bg-muted/40 flex aspect-square w-full items-center justify-center rounded-lg'>
      <Loader2 className='text-muted-foreground size-6 animate-spin' />
    </div>
  ),
});

interface ApplicableProduct {
  id: string;
  name: string;
  price: string;
}

interface GiftCardLookup {
  id: string;
  businessId: string;
  code: string;
  type: 'fixed' | 'percentage' | 'product' | 'free_product';
  initialValue: string;
  currentBalance: string;
  maxDiscount: string | null;
  quantity: number | null;
  applicableProductIds: string[] | null;
  applicableProducts: ApplicableProduct[];
  recipientName: string | null;
  recipientEmail: string | null;
  senderName: string | null;
  message: string | null;
  expiresAt: Date | null;
  redeemedAt: Date | null;
  createdAt: Date;
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupPending, startLookup] = useTransition();
  const [redeemPending, startRedeem] = useTransition();

  const reset = () => {
    setCode(initialCode ?? '');
    setCard(null);
    setAmount('');
    setNotes('');
    setLookupError(null);
    setScannerOpen(false);
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

  const handleScanDetected = (raw: string) => {
    const scanned = raw.trim().toUpperCase();
    if (!scanned) return;
    setScannerOpen(false);
    setCode(scanned);
    handleLookup(scanned);
  };

  const handleRedeem = () => {
    if (!card) return;

    const isSingleUse = card.type === 'percentage' || card.type === 'free_product';
    let amountNum: number | undefined;

    if (!isSingleUse) {
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
  const applicableProducts = card?.applicableProducts ?? [];
  const isSingleUseType = card?.type === 'percentage' || card?.type === 'free_product';
  const canRedeem = card != null && card.isActive && !isExpired && (isSingleUseType || balance > 0);

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return null;
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('es-DO', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Canjear gift card</DialogTitle>
          <DialogDescription>
            Ingresa el código o escanea el QR del correo. Confirma el monto a entregar al cliente.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {scannerOpen ? (
            <div className='space-y-2'>
              <div className='relative overflow-hidden rounded-lg border bg-black'>
                <QrScanner
                  onScan={(results) => {
                    const raw = results?.[0]?.rawValue;
                    if (raw) handleScanDetected(raw);
                  }}
                  onError={(error) => {
                    console.error('[qr-scanner]', error);
                    toast.error('No se pudo acceder a la cámara');
                    setScannerOpen(false);
                  }}
                  constraints={{ facingMode: 'environment' }}
                  scanDelay={250}
                  components={{ finder: true, torch: true }}
                  styles={{ container: { width: '100%' }, video: { width: '100%' } }}
                />
              </div>
              <Button variant='outline' className='w-full' onClick={() => setScannerOpen(false)}>
                <X className='size-4' />
                Cancelar escaneo
              </Button>
            </div>
          ) : (
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
                <Button
                  variant='outline'
                  onClick={() => setScannerOpen(true)}
                  disabled={lookupPending}
                  title='Escanear QR'
                >
                  <Camera className='size-4' />
                </Button>
                <Button variant='outline' onClick={() => handleLookup()} disabled={lookupPending} title='Buscar'>
                  {lookupPending ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
                </Button>
              </div>
              {lookupError && <p className='mt-1 text-xs text-red-600'>{lookupError}</p>}
            </div>
          )}

          {!scannerOpen && card && (
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
                    {card.type === 'free_product' &&
                      `Producto gratis · ${card.quantity ?? 1} unidad${(card.quantity ?? 1) !== 1 ? 'es' : ''}`}
                  </p>
                </div>
              </div>

              <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs'>
                {card.recipientName && (
                  <>
                    <dt className='text-muted-foreground'>Para</dt>
                    <dd className='font-medium'>{card.recipientName}</dd>
                  </>
                )}
                {card.recipientEmail && (
                  <>
                    <dt className='text-muted-foreground'>Email</dt>
                    <dd className='truncate font-medium'>{card.recipientEmail}</dd>
                  </>
                )}
                {card.senderName && (
                  <>
                    <dt className='text-muted-foreground'>De</dt>
                    <dd className='font-medium'>{card.senderName}</dd>
                  </>
                )}
                {card.createdAt && (
                  <>
                    <dt className='text-muted-foreground'>Emitida</dt>
                    <dd className='font-medium'>{formatDate(card.createdAt)}</dd>
                  </>
                )}
                <dt className='text-muted-foreground'>Expira</dt>
                <dd className='font-medium'>{card.expiresAt ? formatDate(card.expiresAt) : 'Sin expiración'}</dd>
              </dl>

              {card.message && (
                <div className='rounded-md border border-violet-200 bg-violet-50 p-2 text-xs text-violet-900'>
                  <p className='mb-0.5 text-[10px] font-bold tracking-wider uppercase'>Mensaje</p>
                  <p className='whitespace-pre-wrap'>{card.message}</p>
                </div>
              )}

              {applicableProducts.length > 0 && (
                <div className='rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900'>
                  <p className='mb-1 text-[10px] font-bold tracking-wider uppercase'>
                    {card.type === 'free_product' ? 'Productos cubiertos' : 'Aplica solo a'}
                  </p>
                  <ul className='space-y-0.5'>
                    {applicableProducts.map((p) => (
                      <li key={p.id} className='flex items-center justify-between gap-2'>
                        <span className='truncate'>{p.name}</span>
                        <span className='text-muted-foreground shrink-0'>${parseFloat(p.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className='mt-1 text-[11px] opacity-80'>Verifica el carrito antes de entregar.</p>
                </div>
              )}

              {!card.isActive && (
                <p className='rounded-md bg-gray-100 p-2 text-xs text-gray-600'>
                  Esta gift card está inactiva
                  {card.redeemedAt ? ` · redimida el ${formatDate(card.redeemedAt)}` : ''}.
                </p>
              )}
              {isExpired && (
                <p className='rounded-md bg-red-50 p-2 text-xs text-red-700'>Esta gift card está expirada.</p>
              )}
              {card.type === 'fixed' && balance <= 0 && card.isActive && !isExpired && (
                <p className='rounded-md bg-amber-50 p-2 text-xs text-amber-700'>
                  Esta gift card no tiene saldo disponible.
                </p>
              )}

              {canRedeem && !isSingleUseType && (
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

              {canRedeem && card.type === 'free_product' && (
                <div className='rounded-md bg-blue-50 p-2 text-xs text-blue-900'>
                  Entrega {card.quantity ?? 1} unidad{(card.quantity ?? 1) !== 1 ? 'es' : ''} de los productos listados.
                  La gift card se desactivará al canjear.
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
          <Button onClick={handleRedeem} disabled={!canRedeem || redeemPending || scannerOpen}>
            {redeemPending ? <Loader2 className='size-4 animate-spin' /> : null}
            Canjear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
