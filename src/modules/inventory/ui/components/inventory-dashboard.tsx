'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import {
  Search,
  ArrowUp,
  Loader2,
  Package,
  ArrowDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BulkImportDialog } from '@/modules/inventory/ui/components/bulk-import-dialog';
import { useAdjustStock, useInventoryOverview } from '@/modules/inventory/ui/hooks/use-inventory';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';

interface InventoryDashboardProps {
  businessId: string;
}

type AdjustType = 'in' | 'out' | 'adjustment';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof ArrowUp }> = {
  in: { label: 'Entrada', color: 'text-green-600', icon: ArrowUp },
  out: { label: 'Salida', color: 'text-red-600', icon: ArrowDown },
  adjustment: { label: 'Ajuste', color: 'text-blue-600', icon: RefreshCw },
  order: { label: 'Pedido', color: 'text-orange-600', icon: Package },
};

const REASON_PRESETS: Record<AdjustType, string[]> = {
  in: ['Compra a proveedor', 'Devolución de cliente', 'Producción', 'Transferencia entrante', 'Corrección de conteo'],
  out: ['Venta directa', 'Daño / Merma', 'Robo / Pérdida', 'Transferencia saliente', 'Muestra / Regalo'],
  adjustment: ['Conteo físico', 'Corrección de sistema', 'Auditoría'],
};

export function InventoryDashboard({ businessId }: InventoryDashboardProps) {
  const { data, isLoading } = useInventoryOverview(businessId);
  const adjustStock = useAdjustStock(businessId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<AdjustType>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [invPage, setInvPage] = useState(1);

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const movements = useMemo(() => data?.movements ?? [], [data?.movements]);

  const adjustProduct = products.find((p) => p.id === adjustProductId);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    if (filter === 'low') {
      list = list.filter((p) => p.trackInventory && (p.stock ?? 0) <= (p.minStock ?? 0) && (p.stock ?? 0) > 0);
    } else if (filter === 'out') {
      list = list.filter((p) => p.trackInventory && (p.stock ?? 0) === 0);
    }
    return list;
  }, [products, search, filter]);

  const INV_PER_PAGE = 15;
  const invTotalPages = Math.ceil(filteredProducts.length / INV_PER_PAGE);
  const paginatedInvProducts = useMemo(
    () => filteredProducts.slice((invPage - 1) * INV_PER_PAGE, invPage * INV_PER_PAGE),
    [filteredProducts, invPage]
  );

  const stats = useMemo(() => {
    const tracked = products.filter((p) => p.trackInventory);
    const totalStock = tracked.reduce((s, p) => s + (p.stock ?? 0), 0);
    const lowStock = tracked.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 0) && (p.stock ?? 0) > 0).length;
    const outOfStock = tracked.filter((p) => (p.stock ?? 0) === 0).length;
    return { total: products.length, totalStock, lowStock, outOfStock };
  }, [products]);

  const openAdjust = (productId: string) => {
    setAdjustProductId(productId);
    setAdjustType('in');
    setAdjustQty('');
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleAdjust = () => {
    if (!adjustProductId) return;
    const qty = parseInt(adjustQty);
    if (!qty || qty < 0) return;

    adjustStock.mutate(
      { productId: adjustProductId, type: adjustType, quantity: qty, reason: adjustReason || undefined },
      {
        onSuccess: () => {
          toast.success('Stock actualizado');
          setAdjustOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header actions */}
      <div className='flex justify-end'>
        <Button variant='outline' onClick={() => setImportOpen(true)}>
          <FileSpreadsheet className='size-4' />
          Importar productos
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 sm:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground text-xs font-medium'>Productos</p>
            <p className='text-2xl font-bold'>{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground text-xs font-medium'>Unidades totales</p>
            <p className='text-2xl font-bold'>{stats.totalStock}</p>
          </CardContent>
        </Card>
        <Card className={stats.lowStock > 0 ? 'border-yellow-500/50' : ''}>
          <CardContent className='pt-6'>
            <p className='text-xs font-medium text-yellow-600'>Stock bajo</p>
            <p className='text-2xl font-bold text-yellow-600'>{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card className={stats.outOfStock > 0 ? 'border-red-500/50' : ''}>
          <CardContent className='pt-6'>
            <p className='text-xs font-medium text-red-600'>Sin stock</p>
            <p className='text-2xl font-bold text-red-600'>{stats.outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder='Buscar por nombre o SKU...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        <div className='flex gap-1'>
          {(['all', 'low', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'low' ? 'Stock bajo' : 'Sin stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Productos ({filteredProducts.length})</h3>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>No hay productos que coincidan.</p>
          ) : (
            <div className='space-y-1'>
              {paginatedInvProducts.map((product) => {
                const stock = product.stock ?? 0;
                const minStock = product.minStock ?? 0;
                const isLow = product.trackInventory && stock <= minStock && stock > 0;
                const isOut = product.trackInventory && stock === 0;

                return (
                  <div
                    key={product.id}
                    className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate text-sm font-medium'>{product.name}</span>
                        {isLow && (
                          <Badge variant='outline' className='gap-1 border-yellow-500 text-[10px] text-yellow-600'>
                            <AlertTriangle className='size-3' />
                            Bajo
                          </Badge>
                        )}
                        {isOut && (
                          <Badge variant='destructive' className='text-[10px]'>
                            Sin stock
                          </Badge>
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {product.sku && `SKU: ${product.sku} · `}
                        {product.trackInventory ? `Mín: ${minStock}` : 'Sin seguimiento'}
                      </p>
                    </div>
                    <div className='text-right'>
                      <span className='text-lg font-bold tabular-nums'>{product.trackInventory ? stock : '—'}</span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openAdjust(product.id)}
                      disabled={!product.trackInventory}
                    >
                      Ajustar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {invTotalPages > 1 && (
            <div className='flex items-center justify-center gap-2 pt-4'>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                disabled={invPage === 1}
              >
                <ChevronLeft className='size-4' />
              </Button>
              <span className='text-muted-foreground text-sm'>
                Página {invPage} de {invTotalPages}
              </span>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))}
                disabled={invPage === invTotalPages}
              >
                <ChevronRight className='size-4' />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent movements */}
      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Movimientos recientes</h3>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className='text-muted-foreground py-4 text-center text-sm'>Sin movimientos registrados.</p>
          ) : (
            <div className='max-h-96 space-y-1.5 overflow-y-auto'>
              {movements.map((mv) => {
                const config = TYPE_CONFIG[mv.type] ?? TYPE_CONFIG.adjustment;
                const Icon = config.icon;
                return (
                  <div key={mv.id} className='flex items-center gap-3 rounded-md border px-3 py-2 text-sm'>
                    <Icon className={`size-4 shrink-0 ${config.color}`} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{config.label}</span>
                        <span className='text-muted-foreground truncate text-xs'>{mv.productName}</span>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {mv.previousStock} → {mv.newStock}
                        {mv.reason && ` · ${mv.reason}`}
                      </div>
                    </div>
                    <span className='text-muted-foreground shrink-0 text-xs'>{formatDate(mv.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar inventario</DialogTitle>
            <DialogDescription>{adjustProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <p className='text-sm'>
              Stock actual: <span className='font-bold'>{adjustProduct?.stock ?? 0}</span>
            </p>
            <div className='space-y-1.5'>
              <Label className='text-xs'>Tipo de movimiento</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as AdjustType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='in'>📦 Entrada (compra, devolución...)</SelectItem>
                  <SelectItem value='out'>📤 Salida (daño, pérdida...)</SelectItem>
                  <SelectItem value='adjustment'>🔄 Ajuste directo (conteo físico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs'>{adjustType === 'adjustment' ? 'Nuevo stock' : 'Cantidad'}</Label>
              <Input
                type='number'
                min='0'
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder='0'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs'>Razón</Label>
              <div className='mb-1.5 flex flex-wrap gap-1.5'>
                {REASON_PRESETS[adjustType].map((preset) => (
                  <button
                    key={preset}
                    type='button'
                    onClick={() => setAdjustReason(preset)}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                      adjustReason === preset
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder='Razón personalizada...'
              />
            </div>
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='outline' size='sm' onClick={() => setAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button size='sm' onClick={handleAdjust} disabled={adjustStock.isPending || !adjustQty}>
                {adjustStock.isPending ? 'Guardando...' : 'Aplicar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Bulk import dialog */}
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} businessId={businessId} />
    </div>
  );
}
