'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ArrowUp,
  Loader2,
  Package,
  ArrowDown,
  RefreshCw,
  ChevronDown,
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
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';
import {
  useAdjustStock,
  useInventoryOverview,
  useAdjustVariantStock,
} from '@/modules/inventory/ui/hooks/use-inventory';

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

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'stock_asc', label: 'Stock: menor a mayor' },
  { value: 'stock_desc', label: 'Stock: mayor a menor' },
];

function sortProducts<T extends { name: string; price: string; stock: number | null; createdAt: Date }>(
  items: T[],
  sort: SortOption
): T[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'az':
        return a.name.localeCompare(b.name);
      case 'za':
        return b.name.localeCompare(a.name);
      case 'price_asc':
        return Number(a.price) - Number(b.price);
      case 'price_desc':
        return Number(b.price) - Number(a.price);
      case 'stock_asc':
        return (a.stock ?? 0) - (b.stock ?? 0);
      case 'stock_desc':
        return (b.stock ?? 0) - (a.stock ?? 0);
      default:
        return 0;
    }
  });
}

export function InventoryDashboard({ businessId }: InventoryDashboardProps) {
  const { data, isLoading } = useInventoryOverview(businessId);
  const adjustStock = useAdjustStock(businessId);
  const adjustVariantStock = useAdjustVariantStock(businessId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [invSort, setInvSort] = useState<SortOption>('newest');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustVariantId, setAdjustVariantId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<AdjustType>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [invPage, setInvPage] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [showVariants, setShowVariants] = useState(true);

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const variants = useMemo(() => data?.variants ?? [], [data?.variants]);
  const movements = useMemo(() => data?.movements ?? [], [data?.movements]);

  const variantsByProduct = useMemo(() => {
    const map: Record<string, typeof variants> = {};
    for (const v of variants) {
      if (!map[v.productId]) map[v.productId] = [];
      map[v.productId].push(v);
    }
    return map;
  }, [variants]);

  const adjustProduct = products.find((p) => p.id === adjustProductId);
  const adjustVariant = adjustVariantId ? variants.find((v) => v.id === adjustVariantId) : null;

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
    return sortProducts(list, invSort);
  }, [products, search, filter, invSort]);

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

  const toggleExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const openAdjust = (productId: string, variantId?: string) => {
    setAdjustProductId(productId);
    setAdjustVariantId(variantId ?? null);
    setAdjustType('in');
    setAdjustQty('');
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleAdjust = () => {
    const qty = parseInt(adjustQty);
    if (!qty || qty < 0) return;

    if (adjustVariantId) {
      adjustVariantStock.mutate(
        { variantId: adjustVariantId, type: adjustType, quantity: qty, reason: adjustReason || undefined },
        {
          onSuccess: () => {
            toast.success('Stock de variante actualizado');
            setAdjustOpen(false);
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else if (adjustProductId) {
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
    }
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
      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={() => setImportOpen(true)}>
          <FileSpreadsheet className='size-4' />
          Importar productos
        </Button>
        <Button asChild>
          <Link href={`/dashboard/businesses/${businessId}/products/new`}>
            <Plus className='size-4' />
            Nuevo producto
          </Link>
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
              onClick={() => {
                setFilter(f);
                setInvPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'low' ? 'Stock bajo' : 'Sin stock'}
            </button>
          ))}
          <button
            onClick={() => setShowVariants((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              showVariants ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Variantes
          </button>
        </div>
        <Select
          value={invSort}
          onValueChange={(v) => {
            setInvSort(v as SortOption);
            setInvPage(1);
          }}
        >
          <SelectTrigger className='w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                const pVariants = variantsByProduct[product.id] ?? [];
                const hasVariants = pVariants.length > 0;
                const isExpanded = expandedProducts.has(product.id);

                return (
                  <div key={product.id}>
                    <div className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors'>
                      {showVariants && hasVariants ? (
                        <button
                          type='button'
                          onClick={() => toggleExpanded(product.id)}
                          className='text-muted-foreground hover:text-foreground shrink-0 transition-colors'
                        >
                          <ChevronDown className={`size-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                      ) : (
                        <div className='w-4 shrink-0' />
                      )}
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='truncate text-sm font-medium'>{product.name}</span>
                          {hasVariants && (
                            <Badge variant='secondary' className='text-[10px]'>
                              {pVariants.length} var.
                            </Badge>
                          )}
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
                        disabled={!product.trackInventory || hasVariants}
                        title={hasVariants ? 'Ajusta desde las variantes' : undefined}
                      >
                        Ajustar
                      </Button>
                    </div>
                    {/* Variant sub-rows */}
                    {showVariants && hasVariants && isExpanded && (
                      <div className='ml-8 space-y-0.5 border-l-2 pl-3'>
                        {pVariants.map((v) => (
                          <div
                            key={v.id}
                            className='hover:bg-muted/30 flex items-center gap-3 rounded-md px-3 py-1.5 transition-colors'
                          >
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center gap-1.5'>
                                <span className='text-muted-foreground text-xs font-medium'>{v.name}</span>
                                {v.sku && <span className='text-muted-foreground text-[10px]'>SKU: {v.sku}</span>}
                                {v.stock === 0 && (
                                  <Badge variant='destructive' className='px-1 py-0 text-[9px]'>
                                    Sin stock
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className='text-sm font-bold tabular-nums'>{v.stock}</span>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-7 text-xs'
                              onClick={() => openAdjust(v.productId, v.id)}
                            >
                              Ajustar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
            <DialogDescription>
              {adjustVariant ? `${adjustProduct?.name} — ${adjustVariant.name}` : adjustProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <p className='text-sm'>
              Stock actual:{' '}
              <span className='font-bold'>{adjustVariant ? adjustVariant.stock : (adjustProduct?.stock ?? 0)}</span>
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
              <Button
                size='sm'
                onClick={handleAdjust}
                disabled={adjustStock.isPending || adjustVariantStock.isPending || !adjustQty}
              >
                {adjustStock.isPending || adjustVariantStock.isPending ? 'Guardando...' : 'Aplicar'}
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
