'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { adjustStockAction } from '@/modules/inventory/server/actions/inventory.actions';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';

// ── Types ──

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  previousStock: number;
  newStock: number;
  createdAt: Date;
}

interface InventoryPanelProps {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  movements: Movement[];
}

type AdjustType = 'in' | 'out' | 'adjustment';

const TYPE_CONFIG: Record<AdjustType, { label: string; color: string; icon: typeof ArrowUp }> = {
  in: { label: 'Entrada', color: 'text-green-600', icon: ArrowUp },
  out: { label: 'Salida', color: 'text-red-600', icon: ArrowDown },
  adjustment: { label: 'Ajuste', color: 'text-blue-600', icon: RefreshCw },
};

// ── Component ──

export function InventoryPanel({
  productId,
  productName,
  currentStock,
  minStock,
  movements: initialMovements,
}: InventoryPanelProps) {
  const [stock, setStock] = useState(currentStock);
  const [movementsList, setMovementsList] = useState<Movement[]>(initialMovements);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [adjustType, setAdjustType] = useState<AdjustType>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const isLowStock = stock <= minStock;

  const handleAdjust = () => {
    const qty = parseInt(quantity);
    if (!qty || qty < 0) return;

    startTransition(async () => {
      const result = await adjustStockAction(productId, {
        type: adjustType,
        quantity: qty,
        reason: reason || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.newStock !== undefined) {
        const prevStock = stock;
        setStock(result.newStock);
        setMovementsList((prev) => [
          {
            id: crypto.randomUUID(),
            type: adjustType,
            quantity: adjustType === 'adjustment' ? result.newStock! - prevStock : qty,
            reason: reason || null,
            previousStock: prevStock,
            newStock: result.newStock!,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }

      setQuantity('');
      setReason('');
      toast.success('Stock actualizado');
    });
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));

  return (
    <div className='space-y-6'>
      {/* Current Stock */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold'>Stock actual — {productName}</h3>
          <div className='mt-1 flex items-center gap-2'>
            <span className='text-3xl font-bold'>{stock}</span>
            {isLowStock && (
              <Badge variant='destructive' className='text-xs'>
                Stock bajo
              </Badge>
            )}
          </div>
          <p className='text-muted-foreground text-xs'>Mínimo: {minStock}</p>
        </div>
      </div>

      <Separator />

      {/* Adjust Form */}
      <div className='space-y-3'>
        <h4 className='text-sm font-semibold'>Ajustar inventario</h4>
        <div className='grid grid-cols-3 gap-3'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Tipo</Label>
            <Select value={adjustType} onValueChange={(v) => setAdjustType(v as AdjustType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='in'>Entrada</SelectItem>
                <SelectItem value='out'>Salida</SelectItem>
                <SelectItem value='adjustment'>Ajuste directo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>{adjustType === 'adjustment' ? 'Nuevo stock' : 'Cantidad'}</Label>
            <Input
              type='number'
              min='0'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder='0'
              disabled={isPending}
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Razón (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Compra, devolución...'
              disabled={isPending}
            />
          </div>
        </div>
        <Button size='sm' onClick={handleAdjust} disabled={isPending || !quantity}>
          {isPending ? 'Guardando...' : 'Aplicar ajuste'}
        </Button>
      </div>

      <Separator />

      {/* Movement History */}
      <div className='space-y-3'>
        <h4 className='text-sm font-semibold'>Historial de movimientos</h4>
        {movementsList.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Sin movimientos registrados.</p>
        ) : (
          <div className='max-h-80 space-y-2 overflow-y-auto'>
            {movementsList.map((mv) => {
              const config = TYPE_CONFIG[mv.type as AdjustType] ?? TYPE_CONFIG.adjustment;
              const Icon = config.icon;
              return (
                <div key={mv.id} className='flex items-center gap-3 rounded-md border px-3 py-2 text-sm'>
                  <Icon className={`size-4 shrink-0 ${config.color}`} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{config.label}</span>
                      <span className='text-muted-foreground text-xs'>
                        {mv.previousStock} → {mv.newStock}
                      </span>
                    </div>
                    {mv.reason && <p className='text-muted-foreground truncate text-xs'>{mv.reason}</p>}
                  </div>
                  <span className='text-muted-foreground shrink-0 text-xs'>{formatDate(mv.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
