'use client';

import { toast } from 'sonner';
import { useState, useEffect, useTransition } from 'react';
import {
  X,
  Copy,
  Plus,
  Check,
  Trash2,
  QrCode,
  History,
  Loader2,
  Package,
  GiftIcon,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getProductsAction } from '@/modules/products/server/actions/get-products.action';
import { GiftCardRedeemDialog } from '@/modules/gift-cards/ui/components/gift-card-redeem-dialog';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getGiftCardsAction,
  createGiftCardAction,
  deleteGiftCardAction,
  toggleGiftCardAction,
  getGiftCardRedemptionsAction,
} from '@/modules/gift-cards/server/actions/gift-card-actions';

interface GiftCard {
  id: string;
  code: string;
  type: string;
  initialValue: string;
  currentBalance: string;
  maxDiscount: string | null;
  applicableProductIds: string[] | null;
  recipientName: string | null;
  recipientEmail: string | null;
  senderName: string | null;
  message: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  redeemedAt: Date | null;
  createdAt: Date;
}

interface GiftCardRedemption {
  id: string;
  orderId: string | null;
  redemptionType: 'order' | 'manual';
  notes: string | null;
  amount: string;
  balanceBefore: string | null;
  balanceAfter: string | null;
  redeemedAt: Date;
}

interface SimpleProduct {
  id: string;
  name: string;
}

interface GiftCardsDashboardProps {
  businessId: string;
  initialRedeemCode?: string;
}

export function GiftCardsDashboard({ businessId, initialRedeemCode }: GiftCardsDashboardProps) {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(!!initialRedeemCode);
  const [deleteTarget, setDeleteTarget] = useState<GiftCard | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'fixed' | 'percentage' | 'product'>('fixed');
  const [initialValue, setInitialValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // History state
  const [historyTarget, setHistoryTarget] = useState<GiftCard | null>(null);
  const [historyRows, setHistoryRows] = useState<GiftCardRedemption[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [cardsResult, productsResult] = await Promise.all([
      getGiftCardsAction(businessId),
      getProductsAction(businessId),
    ]);
    if (cardsResult.data) setGiftCards(cardsResult.data as GiftCard[]);
    setProducts(productsResult.map((p) => ({ id: p.id, name: p.name })));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const resetForm = () => {
    setCode('');
    setType('fixed');
    setInitialValue('');
    setMaxDiscount('');
    setSelectedProductIds([]);
    setProductSearchQuery('');
    setRecipientName('');
    setRecipientEmail('');
    setSenderName('');
    setMessage('');
    setExpiresAt('');
  };

  const handleCreate = () => {
    if (!initialValue || parseFloat(initialValue) <= 0) return toast.error('El valor es requerido');
    const maxDiscountNum = type === 'percentage' && maxDiscount ? parseFloat(maxDiscount) : undefined;
    if (maxDiscountNum !== undefined && (isNaN(maxDiscountNum) || maxDiscountNum <= 0)) {
      return toast.error('Tope de descuento inválido');
    }

    startTransition(async () => {
      const result = await createGiftCardAction({
        businessId,
        code: code.trim(),
        type,
        initialValue: parseFloat(initialValue),
        maxDiscount: maxDiscountNum,
        applicableProductIds: type === 'product' && selectedProductIds.length > 0 ? selectedProductIds : undefined,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        senderName: senderName.trim() || undefined,
        message: message.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        if (result.emailSent) {
          toast.success(`Gift card creada y enviada por correo: ${result.code}`);
        } else if (result.emailError) {
          toast.warning(`${result.emailError} Codigo: ${result.code}`);
        } else {
          toast.success(`Gift card creada: ${result.code}`);
        }
        setCreateOpen(false);
        resetForm();
        fetchData();
      }
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleGiftCardAction(id, !isActive);
      if (!result.error) {
        setGiftCards((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteGiftCardAction(deleteTarget.id);
      if (!result.error) {
        setGiftCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success('Gift card eliminada');
      } else {
        toast.error(result.error);
      }
    });
  };

  const copyCode = (gcCode: string) => {
    navigator.clipboard.writeText(gcCode);
    toast.success('Código copiado');
  };

  const openHistory = async (card: GiftCard) => {
    setHistoryTarget(card);
    setHistoryLoading(true);
    const result = await getGiftCardRedemptionsAction(card.id);
    setHistoryRows((result.data as GiftCardRedemption[]) ?? []);
    setHistoryLoading(false);
  };

  const formatDate = (d: Date | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const typeLabels: Record<string, string> = {
    fixed: 'Monto fijo',
    percentage: 'Porcentaje',
    product: 'Producto específico',
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={() => setRedeemOpen(true)}>
          <QrCode className='size-4' />
          Canjear
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='size-4' />
          Nueva gift card
        </Button>
      </div>

      {giftCards.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16'>
          <GiftIcon className='text-muted-foreground mb-3 size-10 opacity-30' />
          <p className='font-medium'>No hay gift cards aún</p>
          <p className='text-muted-foreground mt-1 text-sm'>Crea tu primera gift card.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {giftCards.map((card) => {
            const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
            const balance = parseFloat(card.currentBalance);
            const initial = parseFloat(card.initialValue);
            const isFullyRedeemed = card.type === 'fixed' && balance <= 0;

            return (
              <Card key={card.id} className={!card.isActive || isExpired || isFullyRedeemed ? 'opacity-60' : ''}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div className='flex items-center gap-4'>
                    <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                      <GiftIcon className='text-primary size-5' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => copyCode(card.code)}
                          className='flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider'
                          title='Copiar código'
                        >
                          {card.code}
                          <Copy className='text-muted-foreground size-3' />
                        </button>
                        {!card.isActive && (
                          <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500'>
                            Inactiva
                          </span>
                        )}
                        {isExpired && (
                          <span className='rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600'>
                            Expirada
                          </span>
                        )}
                        {isFullyRedeemed && (
                          <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600'>
                            Canjeada
                          </span>
                        )}
                      </div>
                      <p className='text-muted-foreground mt-0.5 text-xs'>
                        {typeLabels[card.type] ?? card.type}
                        {card.type === 'percentage' ? ` · ${initial}%` : ` · $${initial.toFixed(2)}`}
                        {card.type === 'fixed' && ` · Saldo: $${balance.toFixed(2)}`}
                        {card.type === 'percentage' &&
                          card.maxDiscount &&
                          ` · Tope: $${parseFloat(card.maxDiscount).toFixed(2)}`}
                        {card.applicableProductIds && card.applicableProductIds.length > 0 && (
                          <span className='ml-1 inline-flex items-center gap-0.5'>
                            · <Package className='inline size-3' />
                            {card.applicableProductIds.length} producto
                            {card.applicableProductIds.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                      <p className='text-muted-foreground mt-0.5 text-[11px]'>
                        {card.recipientName && `Para: ${card.recipientName}`}
                        {card.expiresAt && ` · Expira: ${formatDate(card.expiresAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => openHistory(card)}
                      disabled={isPending}
                      className='hover:bg-muted text-muted-foreground rounded-md p-2 transition-colors'
                      title='Ver historial de canjes'
                    >
                      <History className='size-4' />
                    </button>
                    <button
                      onClick={() => handleToggle(card.id, card.isActive)}
                      disabled={isPending}
                      className='hover:bg-muted rounded-md p-2 transition-colors'
                      title={card.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {card.isActive ? (
                        <ToggleRight className='size-5 text-green-600' />
                      ) : (
                        <ToggleLeft className='text-muted-foreground size-5' />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(card)}
                      disabled={isPending}
                      className='hover:bg-muted rounded-md p-2 text-red-500 transition-colors'
                      title='Eliminar'
                    >
                      <Trash2 className='size-4' />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Nueva gift card</DialogTitle>
            <DialogDescription>Crea una gift card para tus clientes.</DialogDescription>
          </DialogHeader>
          <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
            <div>
              <Label>Código (opcional, se genera automáticamente)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder='AUTO-GENERADO'
                className='mt-1 font-mono tracking-wider uppercase'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'fixed' | 'percentage' | 'product')}>
                  <SelectTrigger className='mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='fixed'>Monto fijo ($)</SelectItem>
                    <SelectItem value='percentage'>Porcentaje (%)</SelectItem>
                    <SelectItem value='product'>Producto específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor *</Label>
                <Input
                  type='number'
                  value={initialValue}
                  onChange={(e) => setInitialValue(e.target.value)}
                  placeholder={type === 'percentage' ? '15' : '50.00'}
                  className='mt-1'
                  min='0'
                  step={type === 'percentage' ? '1' : '0.01'}
                />
              </div>
            </div>

            {type === 'percentage' && (
              <div>
                <Label>Tope de descuento (opcional)</Label>
                <Input
                  type='number'
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder='Ej: 100.00'
                  className='mt-1'
                  min='0'
                  step='0.01'
                />
                <p className='text-muted-foreground mt-1 text-xs'>
                  Límite máximo al descuento aplicado sobre cualquier pedido.
                </p>
              </div>
            )}

            {/* Product selector for product type */}
            {type === 'product' && products.length > 0 && (
              <div>
                <Label>Productos aplicables</Label>
                {selectedProductIds.length > 0 && (
                  <div className='mt-1 mb-2 flex flex-wrap gap-1.5'>
                    {selectedProductIds.map((pid) => {
                      const p = products.find((pr) => pr.id === pid);
                      return (
                        <span
                          key={pid}
                          className='bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium'
                        >
                          {p?.name ?? 'Producto'}
                          <button
                            type='button'
                            onClick={() => setSelectedProductIds((prev) => prev.filter((id) => id !== pid))}
                            className='hover:text-primary/70 -mr-0.5'
                          >
                            <X className='size-3' />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className='rounded-lg border'>
                  <Input
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder='Buscar producto...'
                    className='border-0 border-b shadow-none focus-visible:ring-0'
                  />
                  <div className='max-h-32 overflow-y-auto'>
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type='button'
                            onClick={() =>
                              setSelectedProductIds((prev) =>
                                isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              )
                            }
                            className='hover:bg-muted flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors'
                          >
                            <div
                              className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                              }`}
                            >
                              {isSelected && <Check className='size-3' />}
                            </div>
                            <span className='truncate'>{p.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Destinatario</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder='Nombre'
                  className='mt-1'
                />
              </div>
              <div>
                <Label>Email destinatario</Label>
                <Input
                  type='email'
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder='email@ejemplo.com'
                  className='mt-1'
                />
              </div>
            </div>
            <div>
              <Label>De parte de</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder='Nombre del remitente'
                className='mt-1'
              />
            </div>
            <div>
              <Label>Mensaje (opcional)</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='¡Feliz cumpleaños!'
                className='mt-1'
              />
            </div>
            <div>
              <Label>Expira (opcional)</Label>
              <Input type='date' value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className='mt-1' />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? <Loader2 className='size-4 animate-spin' /> : null}
              Crear gift card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gift card?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar la gift card <strong>{deleteTarget?.code}</strong>. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
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

      {/* Redeem dialog */}
      <GiftCardRedeemDialog
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        initialCode={initialRedeemCode}
        restrictToBusinessId={businessId}
        onRedeemed={fetchData}
      />

      {/* History dialog */}
      <Dialog open={!!historyTarget} onOpenChange={(open) => !open && setHistoryTarget(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Historial de canjes</DialogTitle>
            <DialogDescription>
              Gift card <strong className='font-mono'>{historyTarget?.code}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[60vh] overflow-y-auto'>
            {historyLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='text-muted-foreground size-5 animate-spin' />
              </div>
            ) : historyRows.length === 0 ? (
              <p className='text-muted-foreground py-8 text-center text-sm'>Aún no se ha canjeado esta gift card.</p>
            ) : (
              <div className='space-y-2'>
                {historyRows.map((row) => (
                  <div key={row.id} className='flex items-center justify-between rounded-md border p-3 text-sm'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>${parseFloat(row.amount).toFixed(2)} canjeados</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            row.redemptionType === 'manual'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {row.redemptionType === 'manual' ? 'Manual' : 'Pedido'}
                        </span>
                      </div>
                      <p className='text-muted-foreground mt-0.5 text-xs'>
                        {formatDate(row.redeemedAt)}
                        {row.orderId && (
                          <>
                            {' · Pedido '}
                            <span className='font-mono'>{row.orderId.slice(0, 8)}</span>
                          </>
                        )}
                      </p>
                      {row.notes && <p className='text-muted-foreground mt-1 text-xs italic'>“{row.notes}”</p>}
                    </div>
                    {row.balanceAfter != null && (
                      <div className='text-muted-foreground text-right text-xs'>
                        <p>Antes: ${parseFloat(row.balanceBefore ?? '0').toFixed(2)}</p>
                        <p>Después: ${parseFloat(row.balanceAfter).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
