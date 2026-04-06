'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Plus, Minus, ImageOff, ShoppingBag, ChevronDown } from 'lucide-react';

import { useCartStore, type BundleSelection } from '@/modules/storefront/stores/cart-store';

interface BundleItemOption {
  id: string;
  productId: string;
  name: string;
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: string;
  defaultQuantity: number;
  maxQuantity: number | null;
  sortOrder: number;
  image: { url: string; alt: string | null } | null;
}

interface BundleSlot {
  id: string;
  name: string;
  description: string | null;
  minItems: number;
  maxItems: number | null;
  minAmount: string | null;
  isRequired: boolean;
  items: BundleItemOption[];
}

interface BundleConfigSlots {
  mode: 'slots';
  basePrice: string;
  pricingMode: string | null;
  minimumAmount: string | null;
  slots: BundleSlot[];
}

interface BundleConfigFlat {
  mode: 'flat';
  basePrice: string;
  pricingMode: string | null;
  minimumAmount: string | null;
  items: BundleItemOption[];
}

type BundleConfig = BundleConfigSlots | BundleConfigFlat;

interface SelectedItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  slotId: string | null;
  slotName: string | null;
}

interface BundleConfiguratorProps {
  product: { id: string; name: string; slug: string; price: string; images: { url: string }[] };
  config: BundleConfig;
  currency: string;
  businessSlug: string;
}

export function BundleConfigurator({ product, config, currency, businessSlug }: BundleConfiguratorProps) {
  const [selections, setSelections] = useState<SelectedItem[]>([]);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  const toggleSlot = (slotId: string) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };
  const addBundleItem = useCartStore((s) => s.addBundleItem);

  const fmt = (price: string | number) =>
    new Intl.NumberFormat('es', { style: 'currency', currency }).format(
      typeof price === 'number' ? price : parseFloat(price)
    );

  const selectionsTotal = useMemo(
    () => selections.reduce((sum, s) => sum + parseFloat(s.unitPrice) * s.quantity, 0),
    [selections]
  );

  const totalItemsCount = useMemo(() => selections.reduce((sum, s) => sum + s.quantity, 0), [selections]);

  const minimumAmount = config.minimumAmount ? parseFloat(config.minimumAmount) : null;
  const meetsMinimum = minimumAmount === null || selectionsTotal >= minimumAmount;

  const getSlotSelections = (slotId: string) => selections.filter((s) => s.slotId === slotId);
  const getSlotItemCount = (slotId: string) => getSlotSelections(slotId).reduce((sum, s) => sum + s.quantity, 0);

  const validateSlots = (): string | null => {
    if (config.mode !== 'slots') return null;
    for (const slot of config.slots) {
      const count = getSlotItemCount(slot.id);
      if (slot.isRequired && count === 0) return `"${slot.name}" es obligatorio`;
      if (slot.minItems > 0 && count < slot.minItems)
        return `"${slot.name}" requiere al menos ${slot.minItems} item(s)`;
      if (slot.minAmount) {
        const slotTotal = getSlotSelections(slot.id).reduce((sum, s) => sum + parseFloat(s.unitPrice) * s.quantity, 0);
        if (slotTotal < parseFloat(slot.minAmount))
          return `"${slot.name}" requiere un monto mínimo de ${fmt(slot.minAmount)}`;
      }
    }
    return null;
  };

  const handleQuantityChange = (
    itemOption: BundleItemOption,
    slotId: string | null,
    slotName: string | null,
    delta: number,
    slotMaxItems?: number | null
  ) => {
    setSelections((prev) => {
      const idx = prev.findIndex((s) => s.productId === itemOption.productId && s.slotId === slotId);
      const current = idx >= 0 ? prev[idx].quantity : 0;
      let next = Math.max(0, current + delta);

      if (itemOption.maxQuantity !== null) next = Math.min(next, itemOption.maxQuantity);
      if (itemOption.trackInventory && itemOption.stock !== null) next = Math.min(next, itemOption.stock);

      if (slotMaxItems != null && next > 0) {
        const slotCount = prev.filter((s) => s.slotId === slotId).reduce((sum, s) => sum + s.quantity, 0);
        const available = slotMaxItems - slotCount + current;
        next = Math.min(next, available);
      }

      if (next <= 0) {
        return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      }

      if (idx >= 0) {
        return prev.map((s, i) => (i === idx ? { ...s, quantity: next } : s));
      }

      return [
        ...prev,
        {
          productId: itemOption.productId,
          productName: itemOption.name,
          quantity: next,
          unitPrice: itemOption.price,
          slotId,
          slotName,
        },
      ];
    });
  };

  const handleAddToCart = () => {
    if (selections.length === 0) {
      toast.error('Selecciona al menos un producto para tu paquete');
      return;
    }
    if (!meetsMinimum) {
      toast.error(`El monto mínimo es ${fmt(minimumAmount!)}`);
      return;
    }
    const slotError = validateSlots();
    if (slotError) {
      toast.error(slotError);
      return;
    }

    const bundleKey = Date.now().toString(36);
    const bundleSelections: BundleSelection[] = selections.map((s) => ({
      slotId: s.slotId,
      slotName: s.slotName,
      productId: s.productId,
      productName: s.productName,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
    }));

    const basePrice = parseFloat(config.basePrice);
    const effectivePrice =
      config.pricingMode === 'custom_price'
        ? config.basePrice
        : config.pricingMode === 'base_plus_items'
          ? (basePrice + selectionsTotal).toFixed(2)
          : selectionsTotal.toFixed(2);

    addBundleItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        imageUrl: product.images[0]?.url ?? null,
        bundleSelections,
        bundleKey,
      },
      businessSlug
    );

    toast.success(`${product.name} agregado al carrito`);
    setSelections([]);
  };

  const renderItem = (
    item: BundleItemOption,
    slotId: string | null,
    slotName: string | null,
    slotMaxItems?: number | null
  ) => {
    const sel = selections.find((s) => s.productId === item.productId && s.slotId === slotId);
    const qty = sel?.quantity ?? 0;
    const isAvailable = item.status === 'active' && (!item.trackInventory || item.stock === null || item.stock > 0);

    return (
      <div
        key={`${slotId}-${item.id}`}
        className='flex items-center gap-3 py-3 transition-colors'
        style={{
          opacity: isAvailable ? 1 : 0.4,
          borderBottom: '1px solid var(--sf-border, #e5e7eb)',
        }}
      >
        <div
          className='relative size-14 shrink-0 overflow-hidden'
          style={{ borderRadius: 'var(--sf-radius, 0.75rem)', backgroundColor: 'var(--sf-surface, #f9fafb)' }}
        >
          {item.image ? (
            <Image
              src={item.image.url}
              alt={item.image.alt || item.name}
              fill
              unoptimized
              className='object-cover'
              sizes='56px'
            />
          ) : (
            <div className='flex size-full items-center justify-center'>
              <ImageOff className='size-5 opacity-20' />
            </div>
          )}
          {qty > 0 && (
            <div
              className='absolute inset-0 flex items-center justify-center'
              style={{ backgroundColor: 'rgba(0,0,0, 0.15)' }}
            >
              <span className='text-xs font-bold text-white drop-shadow'>{qty}</span>
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{item.name}</p>
          <p className='text-xs opacity-60'>{fmt(item.price)}</p>
        </div>

        {isAvailable && (
          <div className='flex shrink-0 items-center gap-1'>
            {qty > 0 && (
              <button
                type='button'
                onClick={() => handleQuantityChange(item, slotId, slotName, -1, slotMaxItems)}
                className='flex size-8 items-center justify-center rounded-full transition-colors hover:opacity-70'
                style={{ backgroundColor: 'var(--sf-surface, #f3f4f6)' }}
              >
                <Minus className='size-3.5' />
              </button>
            )}
            {qty > 0 && <span className='min-w-6 text-center text-sm font-semibold'>{qty}</span>}
            <button
              type='button'
              onClick={() => handleQuantityChange(item, slotId, slotName, 1, slotMaxItems)}
              className='flex size-8 items-center justify-center rounded-full text-white transition-colors hover:opacity-90'
              style={{ backgroundColor: 'var(--sf-primary, #000)' }}
            >
              <Plus className='size-3.5' />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className='mt-6 overflow-hidden border'
      style={{
        borderRadius: 'var(--sf-radius-lg, 1rem)',
        borderColor: 'var(--sf-border, #e5e7eb)',
      }}
    >
      <div className='px-4 py-4 sm:px-5'>
        <p className='text-xs font-semibold tracking-[0.18em] uppercase opacity-45'>Arma tu paquete</p>
        {minimumAmount !== null && <p className='mt-1 text-sm opacity-70'>Consumo mínimo: {fmt(minimumAmount)}</p>}
      </div>

      {config.mode === 'slots' ? (
        <div>
          {config.slots.map((slot) => {
            const count = getSlotItemCount(slot.id);
            const isExpanded = expandedSlots.has(slot.id);
            return (
              <div key={slot.id} className='border-t' style={{ borderColor: 'var(--sf-border, #e5e7eb)' }}>
                <button
                  type='button'
                  onClick={() => toggleSlot(slot.id)}
                  className='w-full px-4 py-3 text-left sm:px-5'
                  style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold'>{slot.name}</p>
                      {slot.description && <p className='text-xs opacity-55'>{slot.description}</p>}
                    </div>
                    <div className='flex shrink-0 items-center gap-2 text-right text-xs opacity-60'>
                      {slot.isRequired && <span className='font-medium text-red-500'>Requerido</span>}
                      {slot.minItems > 0 && <span>Min: {slot.minItems}</span>}
                      {slot.maxItems && <span>Max: {slot.maxItems}</span>}
                      {count > 0 && (
                        <span className='font-medium opacity-100'>
                          {count} elegido{count !== 1 ? 's' : ''}
                        </span>
                      )}
                      <ChevronDown
                        className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className='px-4 sm:px-5'>
                    {slot.items.map((item) => renderItem(item, slot.id, slot.name, slot.maxItems))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className='border-t px-4 sm:px-5' style={{ borderColor: 'var(--sf-border, #e5e7eb)' }}>
          {config.items.map((item) => renderItem(item, null, null))}
        </div>
      )}

      {/* Summary bar */}
      <div
        className='sticky bottom-0 border-t px-4 py-4 sm:px-5'
        style={{
          borderColor: 'var(--sf-border, #e5e7eb)',
          backgroundColor: 'var(--sf-bg, #fff)',
        }}
      >
        <div className='mb-3 space-y-1 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='opacity-60'>
              {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} seleccionado{totalItemsCount !== 1 ? 's' : ''}
            </span>
            {config.pricingMode !== 'base_plus_items' && (
              <span className='font-semibold'>
                {config.pricingMode === 'custom_price' ? fmt(config.basePrice) : fmt(selectionsTotal)}
              </span>
            )}
          </div>
          {config.pricingMode === 'base_plus_items' && (
            <>
              <div className='flex items-center justify-between opacity-60'>
                <span>Precio base</span>
                <span>{fmt(config.basePrice)}</span>
              </div>
              {selectionsTotal > 0 && (
                <div className='flex items-center justify-between opacity-60'>
                  <span>Consumo</span>
                  <span>{fmt(selectionsTotal)}</span>
                </div>
              )}
              <div className='flex items-center justify-between font-semibold'>
                <span>Total</span>
                <span>{fmt(parseFloat(config.basePrice) + selectionsTotal)}</span>
              </div>
            </>
          )}
        </div>

        {minimumAmount !== null && !meetsMinimum && (
          <p className='mb-2 text-xs text-red-500'>
            Faltan {fmt(minimumAmount - selectionsTotal)} para alcanzar el mínimo.
          </p>
        )}

        <button
          type='button'
          onClick={handleAddToCart}
          disabled={selections.length === 0 || !meetsMinimum}
          className='inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
          style={{
            backgroundColor: 'var(--sf-primary, #000)',
            borderRadius: 'var(--sf-radius-full, 9999px)',
          }}
        >
          <ShoppingBag className='size-5' />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
