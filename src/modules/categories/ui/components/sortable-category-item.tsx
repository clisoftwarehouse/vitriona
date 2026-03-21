'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Pencil, Trash2, GripVertical } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
}

interface SortableCategoryItemProps {
  category: Category;
  parentName?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableCategoryItem({ category, parentName, onEdit, onDelete }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-card border-border flex items-center gap-3 rounded-lg border px-4 py-3'
    >
      <button
        {...attributes}
        {...listeners}
        className='text-muted-foreground hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing'
        aria-label='Reordenar'
      >
        <GripVertical className='size-4' />
      </button>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          {parentName && <span className='text-muted-foreground text-xs'>{parentName} /</span>}
          <p className='truncate text-sm font-medium'>{category.name}</p>
        </div>
        {category.description && <p className='text-muted-foreground truncate text-xs'>{category.description}</p>}
      </div>

      <Badge variant={category.isActive ? 'default' : 'secondary'} className='shrink-0 text-[10px]'>
        {category.isActive ? 'Activa' : 'Inactiva'}
      </Badge>

      <div className='flex shrink-0 gap-1'>
        <Button variant='ghost' size='icon-sm' onClick={() => onEdit(category.id)}>
          <Pencil className='size-3.5' />
        </Button>
        <Button variant='ghost' size='icon-sm' onClick={() => onDelete(category.id)}>
          <Trash2 className='text-destructive size-3.5' />
        </Button>
      </div>
    </div>
  );
}
