'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Eye, Plus, Clock, Truck, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getDeliveryMethodsAction,
  createDeliveryMethodAction,
  deleteDeliveryMethodAction,
  toggleDeliveryMethodAction,
  updateDeliveryMethodAction,
} from '@/modules/delivery-methods/server/actions/delivery-method-actions';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string | null;
  price: string;
  estimatedTime: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  businessId: string;
  currency: string;
}

export function DeliveryMethodsDashboard({ businessId, currency }: Props) {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formEstimatedTime, setFormEstimatedTime] = useState('');

  const formatPrice = (amount: string) =>
    new Intl.NumberFormat('es', { style: 'currency', currency }).format(parseFloat(amount));

  const loadMethods = async () => {
    const data = await getDeliveryMethodsAction(businessId);
    setMethods(data as DeliveryMethod[]);
    setLoading(false);
  };

  useEffect(() => {
    loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const openCreate = () => {
    setEditingMethod(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('0');
    setFormEstimatedTime('');
    setDialogOpen(true);
  };

  const openEdit = (method: DeliveryMethod) => {
    setEditingMethod(method);
    setFormName(method.name);
    setFormDescription(method.description ?? '');
    setFormPrice(method.price);
    setFormEstimatedTime(method.estimatedTime ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    const price = parseFloat(formPrice) || 0;
    if (price < 0) {
      toast.error('El precio no puede ser negativo');
      return;
    }
    setSaving(true);
    if (editingMethod) {
      const res = await updateDeliveryMethodAction({
        id: editingMethod.id,
        name: formName,
        description: formDescription,
        price,
        estimatedTime: formEstimatedTime,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Método actualizado');
        setDialogOpen(false);
        loadMethods();
      }
    } else {
      const res = await createDeliveryMethodAction({
        businessId,
        name: formName,
        description: formDescription,
        price,
        estimatedTime: formEstimatedTime,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Método creado');
        setDialogOpen(false);
        loadMethods();
      }
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await toggleDeliveryMethodAction(id, !isActive);
    if (res.error) toast.error(res.error);
    else loadMethods();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await deleteDeliveryMethodAction(deletingId);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Método eliminado');
      loadMethods();
    }
    setDeleteOpen(false);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='size-5 animate-spin opacity-50' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Métodos de entrega</h2>
          <p className='text-muted-foreground text-sm'>Configura las opciones de envío y entrega para tus clientes.</p>
        </div>
        <Button size='sm' onClick={openCreate}>
          <Plus className='mr-1 size-4' /> Agregar
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <Truck className='text-muted-foreground mx-auto mb-3 size-8 opacity-30' />
            <p className='text-muted-foreground text-sm'>
              No tienes métodos de entrega configurados. Agrega uno para que tus clientes elijan cómo recibir su pedido.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {methods.map((method) => (
            <Card key={method.id}>
              <CardContent className='flex items-start justify-between gap-4 py-4'>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <Truck className='text-muted-foreground size-4' />
                    <h3 className='font-semibold'>{method.name}</h3>
                    {!method.isActive && <Badge variant='secondary'>Inactivo</Badge>}
                  </div>
                  {method.description && (
                    <p className='text-muted-foreground mt-1 pl-6 text-sm'>{method.description}</p>
                  )}
                  <div className='mt-2 flex items-center gap-4 pl-6 text-sm'>
                    <span className='font-semibold'>
                      {parseFloat(method.price) === 0 ? 'Gratis' : formatPrice(method.price)}
                    </span>
                    {method.estimatedTime && (
                      <span className='text-muted-foreground flex items-center gap-1'>
                        <Clock className='size-3' />
                        {method.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => handleToggle(method.id, method.isActive)}
                    title={method.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {method.isActive ? <Eye className='size-4' /> : <EyeOff className='size-4' />}
                  </Button>
                  <Button variant='ghost' size='icon-sm' onClick={() => openEdit(method)}>
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => {
                      setDeletingId(method.id);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className='text-destructive size-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Editar método de entrega' : 'Nuevo método de entrega'}</DialogTitle>
            <DialogDescription>Define el nombre, costo y tiempo estimado de entrega.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex flex-col gap-2'>
              <Label>Nombre *</Label>
              <Input
                placeholder='Ej: Delivery, Retiro en tienda, Envío nacional...'
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder='Ej: Entregamos en la zona metropolitana de Lunes a Viernes...'
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label>Precio ({currency})</Label>
              <Input
                type='number'
                min='0'
                step='0.01'
                placeholder='0.00'
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
              <p className='text-muted-foreground mt-1 text-xs'>Deja en 0 para ofrecer envío gratis.</p>
            </div>
            <div className='flex flex-col gap-2'>
              <Label>Tiempo estimado (opcional)</Label>
              <Input
                placeholder='Ej: 1-3 días hábiles, 30-60 min, Mismo día...'
                value={formEstimatedTime}
                onChange={(e) => setFormEstimatedTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className='mr-1 size-4 animate-spin' />}
              {editingMethod ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar método de entrega</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
