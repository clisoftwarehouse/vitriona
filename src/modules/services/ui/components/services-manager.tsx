'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Plus, Clock, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from '@/modules/services/server/actions/service.actions';
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

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  durationMinutes: number | null;
  categoryId: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface ServicesManagerProps {
  catalogId: string;
  initialServices: Service[];
  categories: Category[];
}

// ── Component ──

export function ServicesManager({ catalogId, initialServices, categories }: ServicesManagerProps) {
  const [servicesList, setServicesList] = useState<Service[]>(initialServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [duration, setDuration] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('0');
    setDuration('');
    setCategoryId('');
    setIsActive(true);
    setEditingService(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setName(svc.name);
    setDescription(svc.description ?? '');
    setPrice(svc.price);
    setDuration(svc.durationMinutes?.toString() ?? '');
    setCategoryId(svc.categoryId ?? '');
    setIsActive(svc.isActive);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const values = {
      name: name.trim(),
      description,
      price,
      durationMinutes: duration ? parseInt(duration) : undefined,
      categoryId,
      isActive,
    };

    startTransition(async () => {
      if (editingService) {
        const result = await updateServiceAction(editingService.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setServicesList((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? {
                  ...s,
                  name: values.name,
                  description: values.description || null,
                  price: values.price,
                  durationMinutes: values.durationMinutes ?? null,
                  categoryId: values.categoryId || null,
                  isActive: values.isActive,
                }
              : s
          )
        );
        toast.success('Servicio actualizado');
      } else {
        const result = await createServiceAction(catalogId, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.serviceId) {
          setServicesList((prev) => [
            ...prev,
            {
              id: result.serviceId!,
              name: values.name,
              slug: '',
              description: values.description || null,
              price: values.price,
              durationMinutes: values.durationMinutes ?? null,
              categoryId: values.categoryId || null,
              isActive: values.isActive,
            },
          ]);
        }
        toast.success('Servicio creado');
      }
      setDialogOpen(false);
      resetForm();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteServiceAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setServicesList((prev) => prev.filter((s) => s.id !== id));
      setDeleteId(null);
      toast.success('Servicio eliminado');
    });
  };

  const formatPrice = (p: string) =>
    new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(parseFloat(p));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>Servicios</h2>
          <p className='text-muted-foreground text-sm'>Gestiona los servicios ofrecidos en este catálogo.</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button size='sm' onClick={openCreate}>
              <Plus className='mr-1.5 size-4' />
              Nuevo servicio
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
              <DialogDescription>
                {editingService ? 'Modifica la información del servicio.' : 'Agrega un nuevo servicio al catálogo.'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ej: Corte de cabello'
                  disabled={isPending}
                />
              </div>

              <div className='space-y-2'>
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Describe el servicio...'
                  className='resize-none'
                  rows={2}
                  disabled={isPending}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Precio</Label>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Duración (min)</Label>
                  <Input
                    type='number'
                    min='0'
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder='Ej: 60'
                    disabled={isPending}
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div className='space-y-2'>
                  <Label>Categoría</Label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder='Sin categoría' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Sin categoría</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className='flex items-center gap-2'>
                <Checkbox
                  id='svc-active'
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(v === true)}
                  disabled={isPending}
                />
                <Label htmlFor='svc-active' className='text-sm font-normal'>
                  Servicio activo
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
                {isPending ? 'Guardando...' : editingService ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {servicesList.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12'>
          <Clock className='text-muted-foreground/40 mb-3 size-10' />
          <p className='text-muted-foreground text-sm'>No hay servicios definidos aún.</p>
          <Button variant='link' size='sm' onClick={openCreate} className='mt-1'>
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className='divide-y rounded-lg border'>
          {servicesList.map((svc) => (
            <div key={svc.id} className='flex items-center justify-between gap-4 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium'>{svc.name}</span>
                  <Badge variant={svc.isActive ? 'default' : 'secondary'} className='text-[10px]'>
                    {svc.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className='text-muted-foreground mt-0.5 flex items-center gap-3 text-xs'>
                  <span>{formatPrice(svc.price)}</span>
                  {svc.durationMinutes && (
                    <span className='flex items-center gap-1'>
                      <Clock className='size-3' />
                      {svc.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button variant='ghost' size='icon' className='size-8' onClick={() => openEdit(svc)}>
                  <Pencil className='size-3.5' />
                </Button>
                <Dialog open={deleteId === svc.id} onOpenChange={(open) => setDeleteId(open ? svc.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant='ghost' size='icon' className='size-8 text-red-500 hover:text-red-600'>
                      <Trash2 className='size-3.5' />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>¿Eliminar servicio?</DialogTitle>
                      <DialogDescription>
                        Eliminar <strong>{svc.name}</strong> es una acción irreversible.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant='outline' disabled={isPending}>
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button variant='destructive' onClick={() => handleDelete(svc.id)} disabled={isPending}>
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
