'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'envios', label: 'Envíos' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'productos', label: 'Productos' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'politicas', label: 'Políticas' },
  { value: 'otro', label: 'Otro' },
] as const;

export type KnowledgeCategory = (typeof CATEGORIES)[number]['value'];

export interface KnowledgeEntry {
  id: string;
  key: string;
  value: string;
  category: KnowledgeCategory;
}

interface KnowledgeEntriesEditorProps {
  entries: KnowledgeEntry[];
  onChange: (entries: KnowledgeEntry[]) => void;
}

export function KnowledgeEntriesEditor({ entries, onChange }: KnowledgeEntriesEditorProps) {
  const addEntry = () => {
    onChange([...entries, { id: crypto.randomUUID(), key: '', value: '', category: 'general' }]);
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof KnowledgeEntry, val: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  return (
    <div className='space-y-3'>
      {entries.map((entry) => (
        <div key={entry.id} className='bg-muted/50 space-y-2 rounded-lg border p-3'>
          <div className='flex items-start gap-2'>
            <div className='grid flex-1 gap-2 sm:grid-cols-[1fr_140px]'>
              <Input
                value={entry.key}
                onChange={(e) => updateEntry(entry.id, 'key', e.target.value)}
                placeholder='Clave (ej: Horario de atención)'
                className='bg-background text-sm'
              />
              <Select value={entry.category} onValueChange={(v) => updateEntry(entry.id, 'category', v)}>
                <SelectTrigger className='bg-background text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type='button' variant='ghost' size='icon-sm' onClick={() => removeEntry(entry.id)}>
              <Trash2 className='size-4 text-red-500' />
            </Button>
          </div>
          <Textarea
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
            placeholder='Valor (ej: Lunes a Viernes de 9am a 6pm)'
            rows={2}
            className='bg-background text-sm'
          />
        </div>
      ))}
      <Button type='button' variant='outline' size='sm' onClick={addEntry} className='w-full'>
        <Plus className='mr-1.5 size-4' />
        Agregar entrada
      </Button>
    </div>
  );
}
