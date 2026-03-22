'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { X, Eye, Copy, Plus, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';

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
  getPaymentMethodsAction,
  createPaymentMethodAction,
  deletePaymentMethodAction,
  togglePaymentMethodAction,
  updatePaymentMethodAction,
} from '@/modules/payment-methods/server/actions/payment-method-actions';

interface PaymentMethod {
  id: string;
  name: string;
  instructions: string | null;
  fields: { label: string; value: string }[];
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  businessId: string;
}

export function PaymentMethodsDashboard({ businessId }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formFields, setFormFields] = useState<{ label: string; value: string }[]>([]);

  const loadMethods = async () => {
    const data = await getPaymentMethodsAction(businessId);
    setMethods(data as PaymentMethod[]);
    setLoading(false);
  };

  useEffect(() => {
    loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const openCreate = () => {
    setEditingMethod(null);
    setFormName('');
    setFormInstructions('');
    setFormFields([{ label: '', value: '' }]);
    setDialogOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormName(method.name);
    setFormInstructions(method.instructions ?? '');
    setFormFields(method.fields.length > 0 ? [...method.fields] : [{ label: '', value: '' }]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    const fields = formFields.filter((f) => f.label.trim() && f.value.trim());
    if (fields.length === 0) {
      toast.error('Agrega al menos un campo con etiqueta y valor');
      return;
    }
    setSaving(true);
    if (editingMethod) {
      const res = await updatePaymentMethodAction({
        id: editingMethod.id,
        name: formName,
        instructions: formInstructions,
        fields,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Método actualizado');
        setDialogOpen(false);
        loadMethods();
      }
    } else {
      const res = await createPaymentMethodAction({
        businessId,
        name: formName,
        instructions: formInstructions,
        fields,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Método creado');
        setDialogOpen(false);
        loadMethods();
      }
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await togglePaymentMethodAction(id, !isActive);
    if (res.error) toast.error(res.error);
    else loadMethods();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await deletePaymentMethodAction(deletingId);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Método eliminado');
      loadMethods();
    }
    setDeleteOpen(false);
    setDeletingId(null);
  };

  const addField = () => setFormFields([...formFields, { label: '', value: '' }]);
  const removeField = (idx: number) => setFormFields(formFields.filter((_, i) => i !== idx));
  const updateField = (idx: number, key: 'label' | 'value', val: string) => {
    const copy = [...formFields];
    copy[idx] = { ...copy[idx], [key]: val };
    setFormFields(copy);
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
          <h2 className='text-xl font-semibold tracking-tight'>Métodos de pago</h2>
          <p className='text-muted-foreground text-sm'>
            Configura los métodos de pago que tus clientes verán en el checkout.
          </p>
        </div>
        <Button size='sm' onClick={openCreate}>
          <Plus className='mr-1 size-4' /> Agregar
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground text-sm'>
              No tienes métodos de pago configurados. Agrega uno para que tus clientes puedan pagar.
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
                    <h3 className='font-semibold'>{method.name}</h3>
                    {!method.isActive && <Badge variant='secondary'>Inactivo</Badge>}
                  </div>
                  {method.instructions && <p className='text-muted-foreground mt-1 text-sm'>{method.instructions}</p>}
                  <div className='mt-2 space-y-1'>
                    {method.fields.map((field, i) => (
                      <div key={i} className='flex items-center gap-2 text-sm'>
                        <span className='text-muted-foreground font-medium'>{field.label}:</span>
                        <span className='font-mono text-xs'>{field.value}</span>
                        <button
                          type='button'
                          onClick={() => {
                            navigator.clipboard.writeText(field.value);
                            toast.success(`${field.label} copiado`);
                          }}
                          className='text-muted-foreground hover:text-foreground'
                        >
                          <Copy className='size-3' />
                        </button>
                      </div>
                    ))}
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
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}</DialogTitle>
            <DialogDescription>Define el nombre, instrucciones y los datos que verá el cliente.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Nombre del método *</Label>
              <Input
                placeholder='Ej: Pago Móvil, Zelle, Transferencia...'
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <Label>Instrucciones (opcional)</Label>
              <Textarea
                placeholder='Ej: Enviar comprobante al WhatsApp después de pagar...'
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Datos de la cuenta</Label>
              <p className='text-muted-foreground mb-2 text-xs'>
                Agrega los campos que el cliente necesita para realizar el pago.
              </p>
              <div className='space-y-2'>
                {formFields.map((field, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <Input
                      placeholder='Etiqueta (ej: Cédula)'
                      value={field.label}
                      onChange={(e) => updateField(i, 'label', e.target.value)}
                      className='flex-1'
                    />
                    <Input
                      placeholder='Valor (ej: V-12345678)'
                      value={field.value}
                      onChange={(e) => updateField(i, 'value', e.target.value)}
                      className='flex-1'
                    />
                    {formFields.length > 1 && (
                      <Button variant='ghost' size='icon-sm' onClick={() => removeField(i)}>
                        <X className='size-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant='outline' size='sm' className='mt-2' onClick={addField}>
                <Plus className='mr-1 size-3' /> Agregar campo
              </Button>
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
            <DialogTitle>Eliminar método de pago</DialogTitle>
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
