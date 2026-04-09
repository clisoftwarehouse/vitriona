'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';
import {
  X,
  Plus,
  User,
  Minus,
  Truck,
  Phone,
  Trash2,
  Search,
  Package,
  ImageOff,
  CreditCard,
  StickyNote,
  ChevronLeft,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPosOrderAction } from '@/modules/pos/server/actions/create-pos-order.action';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';

/* ─── Types ─── */

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface PosProduct {
  id: string;
  name: string;
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: string;
  type: string;
  images: ProductImage[];
  categoryName?: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
}

interface DeliveryMethod {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  imageUrl: string | null;
  stock: number | null;
  trackInventory: boolean;
}

interface PosDashboardProps {
  businessId: string;
  currency: string;
  products: PosProduct[];
  paymentMethods: PaymentMethod[];
  deliveryMethods: DeliveryMethod[];
}

const PRODUCTS_PER_PAGE = 10;

export function PosDashboard({ businessId, currency, products, paymentMethods, deliveryMethods }: PosDashboardProps) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [page, setPage] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showCustomer, setShowCustomer] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  const fmt = useCallback((amount: string | number) => formatPrice(amount, currency), [currency]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter((p) => p.status === 'active' || p.status === 'out_of_stock');
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q));
  }, [products, search]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(
    () => filteredProducts.slice(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE),
    [filteredProducts, page]
  );

  // Reset page when search changes
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Cart helpers
  const addToCart = useCallback((product: PosProduct) => {
    if (product.trackInventory && (product.stock ?? 0) <= 0) {
      toast.error(`"${product.name}" está agotado`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (product.trackInventory && existing.quantity >= (product.stock ?? 0)) {
          toast.error(`Stock máximo alcanzado para "${product.name}"`);
          return prev;
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          imageUrl: product.images[0]?.url ?? null,
          stock: product.stock,
          trackInventory: product.trackInventory,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.productId !== productId) return item;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (item.trackInventory && newQty > (item.stock ?? 0)) {
              toast.error(`Stock máximo alcanzado`);
              return item;
            }
            return { ...item, quantity: newQty };
          })
          .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedPayment(null);
    setSelectedDelivery(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNotes('');
    setShowCustomer(false);
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + parseFloat(i.unitPrice) * i.quantity, 0), [cart]);
  const shippingCost = selectedDelivery ? parseFloat(selectedDelivery.price) : 0;
  const total = subtotal + shippingCost;
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Process payment
  const handleProcessPayment = () => {
    if (cart.length === 0) {
      toast.error('Agrega productos a la venta');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedPayment) {
      toast.error('Selecciona un método de pago');
      return;
    }

    setProcessing(true);
    try {
      const result = await createPosOrderAction({
        businessId,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerNotes: customerNotes || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        paymentMethodId: selectedPayment.id,
        paymentMethodName: selectedPayment.name,
        deliveryMethodId: selectedDelivery?.id,
        deliveryMethodName: selectedDelivery?.name,
        shippingCost,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Venta registrada: ${result.order?.orderNumber}`);
        clearCart();
        setPaymentModalOpen(false);
      }
    } catch {
      toast.error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  const activePaymentMethods = paymentMethods.filter((m) => m.isActive);
  const activeDeliveryMethods = deliveryMethods.filter((m) => m.isActive);

  return (
    <div className='grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 md:grid-cols-2'>
      {/* ── Left Panel: Products ── */}
      <div className='overflow-y-auto rounded-xl border'>
        <div className='space-y-3 p-4 pb-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold'>Productos</h2>
            <span className='text-muted-foreground text-xs'>{filteredProducts.length} productos</span>
          </div>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              placeholder='Buscar producto...'
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className='pl-9'
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
              >
                <X className='size-4' />
              </button>
            )}
          </div>
        </div>

        <div className='divide-y border-t'>
          {paginatedProducts.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-16 opacity-40'>
              <Package className='size-8' />
              <p className='text-sm'>No se encontraron productos</p>
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const isOutOfStock = product.trackInventory && (product.stock ?? 0) <= 0;
              const cartItem = cart.find((i) => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    isOutOfStock ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted/50 active:bg-muted'
                  )}
                >
                  <div className='bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg'>
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes='40px'
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-4 opacity-30' />
                      </div>
                    )}
                    {cartItem && (
                      <div className='bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold'>
                        {cartItem.quantity}
                      </div>
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{product.name}</p>
                    {product.categoryName && (
                      <p className='text-muted-foreground truncate text-xs'>{product.categoryName}</p>
                    )}
                  </div>
                  <div className='shrink-0 text-right'>
                    <p className='text-primary text-sm font-semibold'>{fmt(product.price)}</p>
                    {product.trackInventory && (
                      <p className={cn('text-xs', isOutOfStock ? 'text-destructive' : 'text-muted-foreground')}>
                        {isOutOfStock ? 'Agotado' : `Stock: ${product.stock}`}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between border-t px-4 py-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 gap-1 text-xs'
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className='size-3.5' />
              Anterior
            </Button>
            <span className='text-muted-foreground text-xs'>
              {page + 1} / {totalPages}
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 gap-1 text-xs'
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className='size-3.5' />
            </Button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Cart ── */}
      <div className='overflow-y-auto rounded-xl border'>
        {/* Cart header */}
        <div className='flex items-center justify-between p-4 pb-3'>
          <div className='flex items-center gap-2.5'>
            <ShoppingCart className='text-muted-foreground size-4' />
            <h2 className='text-base font-semibold'>Carrito de Venta</h2>
            {itemCount > 0 && (
              <Badge variant='secondary' className='text-xs'>
                {itemCount}
              </Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant='ghost' size='sm' className='text-destructive h-7 text-xs' onClick={clearCart}>
              Vaciar
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-20 opacity-25'>
            <ShoppingCart className='size-12' />
            <p className='text-sm'>Selecciona productos para vender</p>
          </div>
        ) : (
          <>
            {/* Cart table header */}
            <div className='text-muted-foreground border-y px-4 py-2.5 text-xs font-medium'>
              <div className='grid grid-cols-[1fr_auto_auto_28px] items-center gap-3'>
                <span>Producto</span>
                <span className='text-center'>Cant.</span>
                <span className='text-right'>Total</span>
                <span />
              </div>
            </div>

            {/* Cart items - THIS is the only part that scrolls */}
            <div className='divide-y'>
              {cart.map((item) => (
                <div key={item.productId} className='px-4 py-2.5'>
                  <div className='grid grid-cols-[1fr_auto_auto_28px] items-center gap-3'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{item.productName}</p>
                      <p className='text-muted-foreground text-xs'>{fmt(item.unitPrice)} c/u</p>
                    </div>
                    <div className='flex items-center justify-center gap-1.5'>
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className='hover:bg-muted flex size-7 items-center justify-center rounded-md border transition-colors'
                      >
                        <Minus className='size-3' />
                      </button>
                      <span className='min-w-7 text-center text-sm font-semibold'>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className='hover:bg-muted flex size-7 items-center justify-center rounded-md border transition-colors'
                      >
                        <Plus className='size-3' />
                      </button>
                    </div>
                    <p className='text-right text-sm font-semibold'>
                      {fmt(parseFloat(item.unitPrice) * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className='text-destructive/50 hover:text-destructive flex size-7 items-center justify-center transition-colors'
                    >
                      <Trash2 className='size-3.5' />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer info toggle */}
            <div className='border-t px-4 py-3'>
              <button
                onClick={() => setShowCustomer(!showCustomer)}
                className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors'
              >
                <User className='size-3.5' />
                {showCustomer ? 'Ocultar datos del cliente' : 'Agregar datos del cliente (opcional)'}
              </button>
              {showCustomer && (
                <div className='mt-3 grid gap-2'>
                  <div className='relative'>
                    <User className='text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
                    <Input
                      placeholder='Nombre'
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className='h-8 pl-8 text-xs'
                    />
                  </div>
                  <div className='relative'>
                    <Phone className='text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
                    <Input
                      placeholder='Teléfono'
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className='h-8 pl-8 text-xs'
                    />
                  </div>
                  <div className='relative'>
                    <StickyNote className='text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
                    <Input
                      placeholder='Notas'
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className='h-8 pl-8 text-xs'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery method selector */}
            {activeDeliveryMethods.length > 0 && (
              <div className='border-t px-4 py-3'>
                <p className='text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium'>
                  <Truck className='size-3.5' />
                  Método de entrega
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      !selectedDelivery ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    )}
                  >
                    Sin envío
                  </button>
                  {activeDeliveryMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedDelivery(method)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        selectedDelivery?.id === method.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      {method.name}
                      {parseFloat(method.price) > 0 && <span className='ml-1 opacity-70'>({fmt(method.price)})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart footer: totals + process button */}
            <div className='border-t px-4 py-4'>
              {shippingCost > 0 && (
                <div className='text-muted-foreground mb-1 flex items-center justify-between text-sm'>
                  <span>Envío</span>
                  <span>{fmt(shippingCost)}</span>
                </div>
              )}
              <div className='mb-3 flex items-center justify-between'>
                <span className='text-lg font-bold'>Total</span>
                <span className='text-primary text-xl font-bold'>{fmt(total)}</span>
              </div>
              <Button onClick={handleProcessPayment} className='w-full gap-2' size='lg'>
                Procesar Pago
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Payment Method Modal ── */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Seleccionar Método de Pago</DialogTitle>
            <DialogDescription>Elija el método de pago para completar la transacción</DialogDescription>
          </DialogHeader>

          {activePaymentMethods.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-8 opacity-50'>
              <CreditCard className='size-8' />
              <p className='text-center text-sm'>
                No hay métodos de pago configurados.
                <br />
                Configúralos en Métodos de pago.
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {activePaymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                    selectedPayment?.id === method.id
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      selectedPayment?.id === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <CreditCard className='size-4' />
                  </div>
                  <span className='flex-1 text-sm font-medium'>{method.name}</span>
                  {selectedPayment?.id === method.id && (
                    <Badge variant='default' className='text-xs'>
                      Seleccionado
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className='mt-2 space-y-1 border-t pt-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Subtotal:</span>
              <span className='text-sm font-medium'>{fmt(subtotal)}</span>
            </div>
            {shippingCost > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Envío:</span>
                <span className='text-sm font-medium'>{fmt(shippingCost)}</span>
              </div>
            )}
            <div className='flex items-center justify-between pt-1'>
              <span className='text-base font-bold'>Total a Pagar:</span>
              <span className='text-primary text-lg font-bold'>{fmt(total)}</span>
            </div>
          </div>

          <div className='flex gap-3 pt-2'>
            <Button variant='outline' className='flex-1' onClick={() => setPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button className='flex-1' onClick={handleConfirmOrder} disabled={!selectedPayment || processing}>
              {processing ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
