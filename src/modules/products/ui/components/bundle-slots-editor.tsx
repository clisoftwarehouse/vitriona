'use client';

import { toast } from 'sonner';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useState, useEffect, useTransition } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { Plus, Pencil, Search, Trash2, ChevronDown, GripVertical } from 'lucide-react';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  type SlotWithItems,
  syncSlotItemsAction,
  createBundleSlotAction,
  deleteBundleSlotAction,
  updateBundleSlotAction,
  getBundleSlotsWithItems,
  reorderBundleSlotsAction,
} from '@/modules/products/server/actions/bundle-slots.action';

interface Product {
  id: string;
  name: string;
  price: string;
  type: string;
  stock: number | null;
  trackInventory: boolean;
}

interface BundleSlotsEditorProps {
  bundleProductId: string;
  businessProducts: Product[];
  currency?: string;
}

interface SlotFormState {
  name: string;
  description: string;
  minItems: number;
  maxItems: string;
  minAmount: string;
  isRequired: boolean;
}

const emptySlotForm: SlotFormState = {
  name: '',
  description: '',
  minItems: 0,
  maxItems: '',
  minAmount: '',
  isRequired: false,
};

function SortableSlotWrapper({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const dragHandle = (
    <button
      type='button'
      {...attributes}
      {...listeners}
      onClick={(e) => e.stopPropagation()}
      className='text-muted-foreground hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing'
      aria-label='Reordenar'
    >
      <GripVertical className='size-4' />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className='rounded-lg border'>
      {children(dragHandle)}
    </div>
  );
}

export function BundleSlotsEditor({ bundleProductId, businessProducts, currency = 'USD' }: BundleSlotsEditorProps) {
  const [slots, setSlots] = useState<SlotWithItems[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  const loadSlots = () => {
    startTransition(async () => {
      const data = await getBundleSlotsWithItems(bundleProductId);
      setSlots(data);
    });
  };

  const handleSlotDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slots.findIndex((s) => s.id === active.id);
    const newIndex = slots.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slots, oldIndex, newIndex);
    setSlots(reordered);
    startTransition(async () => {
      const res = await reorderBundleSlotsAction(
        bundleProductId,
        reordered.map((s) => s.id)
      );
      if ('error' in res) toast.error(res.error);
    });
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleProductId]);

  const handleCreateSlot = () => {
    if (!slotForm.name.trim()) {
      toast.error('El nombre del slot es requerido');
      return;
    }
    startTransition(async () => {
      const result = await createBundleSlotAction({
        bundleProductId,
        name: slotForm.name,
        description: slotForm.description || undefined,
        minItems: slotForm.minItems,
        maxItems: slotForm.maxItems ? parseInt(slotForm.maxItems) : null,
        minAmount: slotForm.minAmount || undefined,
        isRequired: slotForm.isRequired,
      });
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Slot creado');
        setSlotForm(emptySlotForm);
        setShowCreateForm(false);
        loadSlots();
      }
    });
  };

  const handleUpdateSlot = () => {
    if (!editingSlotId || !slotForm.name.trim()) return;
    startTransition(async () => {
      const result = await updateBundleSlotAction({
        slotId: editingSlotId,
        name: slotForm.name,
        description: slotForm.description || undefined,
        minItems: slotForm.minItems,
        maxItems: slotForm.maxItems ? parseInt(slotForm.maxItems) : null,
        minAmount: slotForm.minAmount || undefined,
        isRequired: slotForm.isRequired,
      });
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Slot actualizado');
        setEditingSlotId(null);
        setSlotForm(emptySlotForm);
        loadSlots();
      }
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    startTransition(async () => {
      const result = await deleteBundleSlotAction(slotId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Slot eliminado');
        loadSlots();
      }
    });
  };

  const handleToggleProduct = (slot: SlotWithItems, productId: string) => {
    const existing = slot.items.find((i) => i.itemProductId === productId);
    const newItems = existing
      ? slot.items.filter((i) => i.itemProductId !== productId)
      : [...slot.items, { itemProductId: productId, quantity: 1, maxQuantity: null as number | null }];
    startTransition(async () => {
      const mapped = newItems.map((i) => ({
        itemProductId: i.itemProductId,
        quantity: i.quantity ?? 1,
        maxQuantity: i.maxQuantity ?? null,
      }));
      const result = await syncSlotItemsAction(bundleProductId, slot.id, mapped);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        loadSlots();
      }
    });
  };

  const handleUpdateItemMaxQty = (slot: SlotWithItems, productId: string, maxQty: number | null) => {
    const newItems = slot.items.map((i) => (i.itemProductId === productId ? { ...i, maxQuantity: maxQty } : i));
    startTransition(async () => {
      const result = await syncSlotItemsAction(
        bundleProductId,
        slot.id,
        newItems.map((i) => ({
          itemProductId: i.itemProductId,
          quantity: i.quantity ?? 1,
          maxQuantity: i.maxQuantity ?? null,
        }))
      );
      if ('error' in result) {
        toast.error(result.error);
      } else {
        loadSlots();
      }
    });
  };

  const startEditing = (slot: SlotWithItems) => {
    setEditingSlotId(slot.id);
    setShowCreateForm(false);
    setSlotForm({
      name: slot.name,
      description: slot.description ?? '',
      minItems: slot.minItems,
      maxItems: slot.maxItems?.toString() ?? '',
      minAmount: slot.minAmount ?? '',
      isRequired: slot.isRequired,
    });
  };

  const eligibleProducts = businessProducts.filter((p) => p.type !== 'bundle');

  const getFilteredProducts = (_slot: SlotWithItems) => {
    const query = itemSearch.toLowerCase();
    return eligibleProducts.filter((p) => {
      if (!query) return true;
      return p.name.toLowerCase().includes(query);
    });
  };

  const renderSlotForm = (onSave: () => void, onCancel: () => void) => (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='space-y-1'>
          <Label className='text-xs'>Nombre *</Label>
          <Input
            value={slotForm.name}
            onChange={(e) => setSlotForm((f) => ({ ...f, name: e.target.value }))}
            placeholder='Ej: Toppings, Masa, Bebidas...'
            disabled={isPending}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Descripción</Label>
          <Input
            value={slotForm.description}
            onChange={(e) => setSlotForm((f) => ({ ...f, description: e.target.value }))}
            placeholder='Ej: Elige hasta 6 ingredientes'
            disabled={isPending}
          />
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='space-y-1'>
          <Label className='text-xs'>Mínimo de items</Label>
          <Input
            type='number'
            min='0'
            value={slotForm.minItems}
            onChange={(e) => setSlotForm((f) => ({ ...f, minItems: parseInt(e.target.value) || 0 }))}
            disabled={isPending}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Máximo de items</Label>
          <Input
            type='number'
            min='0'
            value={slotForm.maxItems}
            onChange={(e) => setSlotForm((f) => ({ ...f, maxItems: e.target.value }))}
            placeholder='Sin límite'
            disabled={isPending}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Monto mínimo</Label>
          <Input
            type='number'
            min='0'
            step='0.01'
            value={slotForm.minAmount}
            onChange={(e) => setSlotForm((f) => ({ ...f, minAmount: e.target.value }))}
            placeholder='Opcional'
            disabled={isPending}
          />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Checkbox
          id='slot-required'
          checked={slotForm.isRequired}
          onCheckedChange={(v) => setSlotForm((f) => ({ ...f, isRequired: !!v }))}
          disabled={isPending}
        />
        <Label htmlFor='slot-required' className='text-xs'>
          Obligatorio
        </Label>
      </div>
      <div className='flex items-center gap-2'>
        <Button size='sm' onClick={onSave} disabled={isPending}>
          {isPending ? 'Guardando...' : editingSlotId ? 'Actualizar' : 'Crear slot'}
        </Button>
        <Button size='sm' variant='ghost' onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold'>Slots de selección</h3>
          <p className='text-muted-foreground text-xs'>Define los grupos de productos que el cliente puede elegir.</p>
        </div>
        {!showCreateForm && !editingSlotId && (
          <Button
            size='sm'
            onClick={() => {
              setShowCreateForm(true);
              setSlotForm(emptySlotForm);
            }}
          >
            <Plus className='mr-1 size-3.5' />
            Nuevo slot
          </Button>
        )}
      </div>

      {showCreateForm &&
        renderSlotForm(handleCreateSlot, () => {
          setShowCreateForm(false);
          setSlotForm(emptySlotForm);
        })}

      {editingSlotId &&
        renderSlotForm(handleUpdateSlot, () => {
          setEditingSlotId(null);
          setSlotForm(emptySlotForm);
        })}

      {slots.length === 0 && !showCreateForm ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm'>
          No hay slots configurados. Crea uno para empezar.
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleSlotDragEnd}>
          <SortableContext items={slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className='space-y-2'>
              {slots.map((slot) => {
                const isExpanded = expandedSlot === slot.id;
                const filteredProducts = isExpanded ? getFilteredProducts(slot) : [];
                const selectedIds = new Set(slot.items.map((i) => i.itemProductId));

                return (
                  <SortableSlotWrapper key={slot.id} id={slot.id}>
                    {(dragHandle) => (
                      <>
                        <div
                          className='flex cursor-pointer items-center gap-2 px-4 py-3'
                          onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                        >
                          {dragHandle}
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-medium'>{slot.name}</span>
                              {slot.isRequired && (
                                <Badge variant='secondary' className='text-[10px]'>
                                  Obligatorio
                                </Badge>
                              )}
                              <Badge variant='outline' className='text-[10px]'>
                                {slot.items.length} producto{slot.items.length !== 1 ? 's' : ''}
                              </Badge>
                              {slot.minItems > 0 && (
                                <span className='text-muted-foreground text-[10px]'>Min: {slot.minItems}</span>
                              )}
                              {slot.maxItems && (
                                <span className='text-muted-foreground text-[10px]'>Max: {slot.maxItems}</span>
                              )}
                            </div>
                            {slot.description && <p className='text-muted-foreground text-xs'>{slot.description}</p>}
                          </div>
                          <div className='flex shrink-0 items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(slot);
                              }}
                            >
                              <Pencil className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id);
                              }}
                            >
                              <Trash2 className='text-destructive size-3.5' />
                            </Button>
                            <ChevronDown
                              className={`text-muted-foreground size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className='border-t px-4 py-3'>
                            <div className='mb-3'>
                              <div className='relative'>
                                <Search className='text-muted-foreground absolute top-2.5 left-2.5 size-3.5' />
                                <Input
                                  value={itemSearch}
                                  onChange={(e) => setItemSearch(e.target.value)}
                                  placeholder='Buscar productos...'
                                  className='pl-8'
                                  disabled={isPending}
                                />
                              </div>
                            </div>

                            <div className='max-h-60 space-y-1 overflow-y-auto'>
                              {filteredProducts.map((product) => {
                                const isSelected = selectedIds.has(product.id);
                                const slotItem = slot.items.find((i) => i.itemProductId === product.id);

                                return (
                                  <div
                                    key={product.id}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${isSelected ? 'bg-primary/5 border' : 'hover:bg-muted/50'}`}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleProduct(slot, product.id)}
                                      disabled={isPending}
                                    />
                                    <div className='min-w-0 flex-1'>
                                      <p className='truncate text-sm'>{product.name}</p>
                                      <span className='text-muted-foreground text-xs'>
                                        {formatPrice(product.price, currency)}
                                        {product.trackInventory &&
                                          product.stock !== null &&
                                          ` · Stock: ${product.stock}`}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <div className='flex items-center gap-2'>
                                        <Label className='text-muted-foreground text-[10px]'>Max qty:</Label>
                                        <Input
                                          type='number'
                                          min='1'
                                          value={slotItem?.maxQuantity ?? ''}
                                          onChange={(e) => {
                                            const val = e.target.value ? parseInt(e.target.value) : null;
                                            handleUpdateItemMaxQty(slot, product.id, val);
                                          }}
                                          className='h-7 w-16 text-xs'
                                          placeholder='∞'
                                          disabled={isPending}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableSlotWrapper>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
