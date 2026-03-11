'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  createAttributeAction,
  deleteAttributeAction,
  updateAttributeAction,
} from '@/modules/attributes/server/actions/attribute.actions';
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

// ── Types ──

interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

interface AttributesManagerProps {
  businessId: string;
  initialAttributes: Attribute[];
}

type AttrType = 'text' | 'number' | 'select' | 'color' | 'boolean';

const TYPE_LABELS: Record<AttrType, string> = {
  text: 'Texto',
  number: 'Número',
  select: 'Selección',
  color: 'Color',
  boolean: 'Sí/No',
};

// ── Main Component ──

export function AttributesManager({ businessId, initialAttributes }: AttributesManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Form state ──
  const [name, setName] = useState('');
  const [type, setType] = useState<AttrType>('text');
  const [options, setOptions] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const resetForm = () => {
    setName('');
    setType('text');
    setOptions('');
    setIsRequired(false);
    setEditingAttr(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (attr: Attribute) => {
    setEditingAttr(attr);
    setName(attr.name);
    setType(attr.type as AttrType);
    setOptions(attr.options?.join(', ') ?? '');
    setIsRequired(attr.isRequired);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const parsedOptions =
      type === 'select' || type === 'color'
        ? options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

    startTransition(async () => {
      if (editingAttr) {
        const result = await updateAttributeAction(editingAttr.id, {
          name: name.trim(),
          type,
          options: parsedOptions,
          isRequired,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setAttributes((prev) =>
          prev.map((a) =>
            a.id === editingAttr.id ? { ...a, name: name.trim(), type, options: parsedOptions ?? null, isRequired } : a
          )
        );
        toast.success('Atributo actualizado');
      } else {
        const result = await createAttributeAction(businessId, {
          name: name.trim(),
          type,
          options: parsedOptions,
          isRequired,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.attribute) {
          setAttributes((prev) => [...prev, result.attribute!]);
        }
        toast.success('Atributo creado');
      }
      setDialogOpen(false);
      resetForm();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAttributeAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      setDeleteId(null);
      toast.success('Atributo eliminado');
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>Atributos de productos</h2>
          <p className='text-muted-foreground text-sm'>
            Define características como Talla, Color, Material, etc. Se aplicarán a todos los productos del negocio.
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button size='sm' onClick={openCreate}>
              <Plus className='mr-1.5 size-4' />
              Nuevo atributo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAttr ? 'Editar atributo' : 'Nuevo atributo'}</DialogTitle>
              <DialogDescription>
                {editingAttr
                  ? 'Modifica las propiedades del atributo.'
                  : 'Define un nuevo atributo para los productos de este negocio.'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ej: Talla, Material, Color'
                  disabled={isPending}
                />
              </div>

              <div className='space-y-2'>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as AttrType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_LABELS) as [AttrType, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(type === 'select' || type === 'color') && (
                <div className='space-y-2'>
                  <Label>
                    {type === 'color' ? 'Colores (hex separados por coma)' : 'Opciones (separadas por coma)'}
                  </Label>
                  <Input
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder={type === 'color' ? '#FF0000, #00FF00, #0000FF' : 'S, M, L, XL'}
                    disabled={isPending}
                  />
                </div>
              )}

              <div className='flex items-center gap-2'>
                <Checkbox
                  id='isRequired'
                  checked={isRequired}
                  onCheckedChange={(v) => setIsRequired(v === true)}
                  disabled={isPending}
                />
                <Label htmlFor='isRequired' className='text-sm font-normal'>
                  Campo obligatorio al crear producto
                </Label>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline' disabled={isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isPending || !name.trim()}>
                {isPending ? 'Guardando...' : editingAttr ? 'Guardar cambios' : 'Crear atributo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {attributes.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12'>
          <GripVertical className='text-muted-foreground/40 mb-3 size-10' />
          <p className='text-muted-foreground text-sm'>No hay atributos definidos aún.</p>
          <Button variant='link' size='sm' onClick={openCreate} className='mt-1'>
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className='divide-y rounded-lg border'>
          {attributes.map((attr) => (
            <div key={attr.id} className='flex items-center justify-between gap-4 px-4 py-3'>
              <div className='flex items-center gap-3'>
                <GripVertical className='text-muted-foreground/40 size-4 shrink-0' />
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>{attr.name}</span>
                    <Badge variant='secondary' className='text-[10px]'>
                      {TYPE_LABELS[attr.type as AttrType] ?? attr.type}
                    </Badge>
                    {attr.isRequired && (
                      <Badge variant='outline' className='text-[10px]'>
                        Obligatorio
                      </Badge>
                    )}
                  </div>
                  {attr.options && attr.options.length > 0 && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>{attr.options.join(', ')}</p>
                  )}
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button variant='ghost' size='icon' className='size-8' onClick={() => openEdit(attr)}>
                  <Pencil className='size-3.5' />
                </Button>
                <Dialog open={deleteId === attr.id} onOpenChange={(open) => setDeleteId(open ? attr.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant='ghost' size='icon' className='size-8 text-red-500 hover:text-red-600'>
                      <Trash2 className='size-3.5' />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>¿Eliminar atributo?</DialogTitle>
                      <DialogDescription>
                        Eliminar <strong>{attr.name}</strong> también eliminará todos los valores asignados a productos.
                        Esta acción no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant='outline' disabled={isPending}>
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button variant='destructive' onClick={() => handleDelete(attr.id)} disabled={isPending}>
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
