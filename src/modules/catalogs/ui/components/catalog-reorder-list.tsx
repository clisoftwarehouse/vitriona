'use client';

import { toast } from 'sonner';
import { CSS } from '@dnd-kit/utilities';
import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Star, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reorderCatalogsAction } from '@/modules/catalogs/server/actions/reorder-catalogs.action';

interface Catalog {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

interface CatalogReorderListProps {
  businessId: string;
  catalogs: Catalog[];
}

function SortableCatalogItem({ catalog, index }: { catalog: Catalog; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: catalog.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className='bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2.5'>
      <button
        {...attributes}
        {...listeners}
        className='text-muted-foreground hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing'
        aria-label='Reordenar'
      >
        <GripVertical className='size-4' />
      </button>
      <span className='text-muted-foreground mr-1 text-xs font-medium'>{index + 1}.</span>
      <span className='flex-1 text-sm font-medium'>{catalog.name}</span>
      {catalog.isDefault && <Star className='size-3.5 shrink-0 fill-amber-500 text-amber-500' />}
      <Badge variant={catalog.isActive ? 'default' : 'secondary'} className='shrink-0 text-[10px]'>
        {catalog.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    </div>
  );
}

export function CatalogReorderList({ businessId, catalogs: initialCatalogs }: CatalogReorderListProps) {
  const [catalogs, setCatalogs] = useState(initialCatalogs);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = catalogs.findIndex((c) => c.id === active.id);
    const newIndex = catalogs.findIndex((c) => c.id === over.id);
    setCatalogs(arrayMove([...catalogs], oldIndex, newIndex));
    setHasChanges(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await reorderCatalogsAction(
        businessId,
        catalogs.map((c) => c.id)
      );
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Orden de catálogos actualizado');
        setHasChanges(false);
      }
    });
  };

  if (catalogs.length <= 1) return null;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold'>Orden de catálogos</h3>
          <p className='text-muted-foreground text-xs'>
            Modifica el orden en que se muestran los catálogos en el Storefront.
          </p>
        </div>
        {hasChanges && (
          <Button size='sm' onClick={handleSave} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar orden'}
          </Button>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={catalogs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className='space-y-1'>
            {catalogs.map((catalog, index) => (
              <SortableCatalogItem key={catalog.id} catalog={catalog} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
