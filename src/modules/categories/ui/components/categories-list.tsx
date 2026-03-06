'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CategoryForm } from './category-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SortableCategoryItem } from './sortable-category-item';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';
import { createCategoryAction } from '@/modules/categories/server/actions/create-category.action';
import { updateCategoryAction } from '@/modules/categories/server/actions/update-category.action';
import { deleteCategoryAction } from '@/modules/categories/server/actions/delete-category.action';
import { reorderCategoriesAction } from '@/modules/categories/server/actions/reorder-categories.action';
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface CategoriesListProps {
  catalogId: string;
  initialCategories: Category[];
}

export function CategoriesList({ catalogId, initialCategories }: CategoriesListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    setCategories(reordered);
    await reorderCategoriesAction(
      catalogId,
      reordered.map((c) => c.id)
    );
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    router.refresh();
  };

  const handleCreate = async (values: CreateCategoryFormValues) => {
    return createCategoryAction(catalogId, values);
  };

  const handleEditSuccess = () => {
    setEditingId(null);
    router.refresh();
  };

  const handleEdit = async (values: CreateCategoryFormValues) => {
    if (!editingId) return { error: 'No hay categoría seleccionada' };
    return updateCategoryAction(editingId, values);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteCategoryAction(deleteTarget.id);
    setIsDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
    router.refresh();
  };

  const editingCategory = editingId ? categories.find((c) => c.id === editingId) : null;

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
          <CategoryForm mode='create' onSubmitAction={handleCreate} onSuccess={handleCreateSuccess} />
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
              defaultValues={{ name: editingCategory.name, description: editingCategory.description ?? '' }}
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
              <Button variant='outline' disabled={isDeleting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button variant='destructive' onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
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
