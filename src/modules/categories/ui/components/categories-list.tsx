'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CategoryForm } from './category-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SortableCategoryItem } from './sortable-category-item';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/modules/categories/ui/hooks/use-categories';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface CategoriesListProps {
  businessId: string;
}

export function CategoriesList({ businessId }: CategoriesListProps) {
  const { data: categories = [], isLoading } = useCategories(businessId);
  const createCategory = useCreateCategory(businessId);
  const updateCategory = useUpdateCategory(businessId);
  const deleteCategory = useDeleteCategory(businessId);
  const reorderCategories = useReorderCategories(businessId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove([...categories], oldIndex, newIndex);

    reorderCategories.mutate(reordered.map((c) => c.id));
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreate = async (values: CreateCategoryFormValues) => {
    const result = await createCategory.mutateAsync(values);
    return result;
  };

  const handleEditSuccess = () => {
    setEditingId(null);
  };

  const handleEdit = async (values: CreateCategoryFormValues) => {
    if (!editingId) return { error: 'No hay categoría seleccionada' };
    const result = await updateCategory.mutateAsync({ categoryId: editingId, values });
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteCategory.mutateAsync(deleteTarget.id);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
  };

  const editingCategory = editingId ? categories.find((c) => c.id === editingId) : null;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='text-muted-foreground size-5 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {categories.length === 0 ? 'No hay categorías aún.' : `${categories.length} categoría(s)`}
        </p>
        <Button size='sm' onClick={() => setShowCreateForm(true)}>
          Nueva categoría
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>Agrega una categoría para organizar tus productos.</DialogDescription>
          </DialogHeader>
          <CategoryForm
            mode='create'
            parentOptions={categories.map((c) => ({ id: c.id, name: c.name }))}
            onSubmitAction={handleCreate}
            onSuccess={handleCreateSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>Modifica los datos de la categoría.</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              mode='edit'
              defaultValues={{
                name: editingCategory.name,
                description: editingCategory.description ?? '',
                parentId: editingCategory.parentId ?? '',
              }}
              parentOptions={categories.map((c) => ({ id: c.id, name: c.name }))}
              currentCategoryId={editingCategory.id}
              onSubmitAction={handleEdit}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar categoría?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar <strong>{deleteTarget?.name}</strong>. Los productos en esta categoría quedarán
              sin categorizar.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant='destructive'>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' disabled={deleteCategory.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sortable list */}
      {categories.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className='space-y-2'>
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  parentName={category.parentId ? categories.find((c) => c.id === category.parentId)?.name : undefined}
                  onEdit={setEditingId}
                  onDelete={(id) => setDeleteTarget(categories.find((c) => c.id === id) ?? null)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
