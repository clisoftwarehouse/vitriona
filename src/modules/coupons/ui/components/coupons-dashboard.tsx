'use client';

import { toast } from 'sonner';
import { useState, useEffect, useTransition } from 'react';
import {
  X,
  Tag,
  Copy,
  Plus,
  Check,
  Trash2,
  Loader2,
  Package,
  ToggleLeft,
  ToggleRight,
  TicketPercent,
} from 'lucide-react';

import { formatPrice } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getProductsAction } from '@/modules/products/server/actions/get-products.action';
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
  getCouponsAction,
  createCouponAction,
  deleteCouponAction,
  toggleCouponAction,
} from '@/modules/coupons/server/actions/coupon-actions';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  applicableProductIds: string[] | null;
  minOrderAmount: string | null;
  maxDiscount: string | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface SimpleProduct {
  id: string;
  name: string;
}

export function CouponsDashboard({ businessId, currency = 'USD' }: { businessId: string; currency?: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    const [couponsResult, productsResult] = await Promise.all([
      getCouponsAction(businessId),
      getProductsAction(businessId),
    ]);
    if (couponsResult.data) setCoupons(couponsResult.data as Coupon[]);
    setProducts(productsResult.map((p) => ({ id: p.id, name: p.name })));
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setSelectedProductIds([]);
    setProductSearchQuery('');
    setMinOrderAmount('');
    setMaxDiscount('');
    setUsageLimit('');
    setStartsAt('');
    setExpiresAt('');
  };

  const handleCreate = () => {
    if (!code.trim()) return toast.error('El código es requerido');
    if (!discountValue || parseFloat(discountValue) <= 0) return toast.error('El valor del descuento es requerido');

    startTransition(async () => {
      const result = await createCouponAction({
        businessId,
        code: code.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        applicableProductIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
        startsAt: startsAt || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Cupón creado');
        setCreateOpen(false);
        resetForm();
        fetchCoupons();
      }
    });
  };

  const handleToggle = (couponId: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleCouponAction(couponId, !isActive);
      if (!result.error) {
        setCoupons((prev) => prev.map((c) => (c.id === couponId ? { ...c, isActive: !isActive } : c)));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCouponAction(deleteTarget.id);
      if (!result.error) {
        setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success('Cupón eliminado');
      } else {
        toast.error(result.error);
      }
    });
  };

  const copyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    toast.success('Código copiado');
  };

  const formatDate = (d: Date | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
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
      <div className='flex justify-end'>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='size-4' />
          Nuevo cupón
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16'>
          <TicketPercent className='text-muted-foreground mb-3 size-10 opacity-30' />
          <p className='font-medium'>No hay cupones aún</p>
          <p className='text-muted-foreground mt-1 text-sm'>Crea tu primer cupón de descuento.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isExhausted = coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit;

            return (
              <Card key={coupon.id} className={!coupon.isActive || isExpired || isExhausted ? 'opacity-60' : ''}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div className='flex items-center gap-4'>
                    <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                      <Tag className='text-primary size-5' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className='flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider'
                          title='Copiar código'
                        >
                          {coupon.code}
                          <Copy className='text-muted-foreground size-3' />
                        </button>
                        {!coupon.isActive && (
                          <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500'>
                            Inactivo
                          </span>
                        )}
                        {isExpired && (
                          <span className='rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600'>
                            Expirado
                          </span>
                        )}
                        {isExhausted && (
                          <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600'>
                            Agotado
                          </span>
                        )}
                      </div>
                      <p className='text-muted-foreground mt-0.5 text-xs'>
                        {coupon.discountType === 'percentage'
                          ? `${parseFloat(coupon.discountValue)}% de descuento`
                          : `${formatPrice(coupon.discountValue, currency)} de descuento`}
                        {coupon.description && ` · ${coupon.description}`}
                        {coupon.applicableProductIds && coupon.applicableProductIds.length > 0 && (
                          <span className='ml-1 inline-flex items-center gap-0.5'>
                            · <Package className='inline size-3' />
                            {coupon.applicableProductIds.length} producto
                            {coupon.applicableProductIds.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                      <p className='text-muted-foreground mt-0.5 text-[11px]'>
                        Usos: {coupon.usageCount}
                        {coupon.usageLimit !== null ? `/${coupon.usageLimit}` : ''}
                        {coupon.expiresAt && ` · Expira: ${formatDate(coupon.expiresAt)}`}
                        {coupon.minOrderAmount && ` · Mín: ${formatPrice(coupon.minOrderAmount, currency)}`}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => handleToggle(coupon.id, coupon.isActive)}
                      disabled={isPending}
                      className='hover:bg-muted rounded-md p-2 transition-colors'
                      title={coupon.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {coupon.isActive ? (
                        <ToggleRight className='size-5 text-green-600' />
                      ) : (
                        <ToggleLeft className='text-muted-foreground size-5' />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(coupon)}
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
            <DialogTitle>Nuevo cupón</DialogTitle>
            <DialogDescription>Crea un cupón de descuento para tus clientes.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Código *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder='VERANO20'
                className='mt-1 font-mono tracking-wider uppercase'
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Descuento de verano'
                className='mt-1'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Tipo de descuento</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                  <SelectTrigger className='mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'>Porcentaje (%)</SelectItem>
                    <SelectItem value='fixed'>Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor *</Label>
                <Input
                  type='number'
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '20' : '10.00'}
                  className='mt-1'
                  min='0'
                  step={discountType === 'percentage' ? '1' : '0.01'}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Pedido mínimo ($)</Label>
                <Input
                  type='number'
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder='0.00'
                  className='mt-1'
                  min='0'
                  step='0.01'
                />
              </div>
              <div>
                <Label>{discountType === 'percentage' ? 'Descuento máximo ($)' : 'Límite de usos'}</Label>
                {discountType === 'percentage' ? (
                  <Input
                    type='number'
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder='Sin límite'
                    className='mt-1'
                    min='0'
                    step='0.01'
                  />
                ) : (
                  <Input
                    type='number'
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder='Ilimitado'
                    className='mt-1'
                    min='0'
                    step='1'
                  />
                )}
              </div>
            </div>
            {discountType === 'percentage' && (
              <div>
                <Label>Límite de usos</Label>
                <Input
                  type='number'
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder='Ilimitado'
                  className='mt-1'
                  min='0'
                  step='1'
                />
              </div>
            )}
            {/* Product selector */}
            <div>
              <Label>Productos aplicables (opcional)</Label>
              <p className='text-muted-foreground mb-2 text-xs'>Deja vacío para aplicar a todo el pedido.</p>
              {selectedProductIds.length > 0 && (
                <div className='mb-2 flex flex-wrap gap-1.5'>
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
              {products.length > 0 && (
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
              )}
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Inicia (opcional)</Label>
                <Input type='date' value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className='mt-1' />
              </div>
              <div>
                <Label>Expira (opcional)</Label>
                <Input type='date' value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className='mt-1' />
              </div>
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
              Crear cupón
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cupón?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el cupón <strong>{deleteTarget?.code}</strong>. Esta acción no se puede
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
    </div>
  );
}
