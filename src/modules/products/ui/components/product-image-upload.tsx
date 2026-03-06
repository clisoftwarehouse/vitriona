'use client';

import Image from 'next/image';
import { CSS } from '@dnd-kit/utilities';
import { upload } from '@vercel/blob/client';
import { useState, useCallback, useTransition } from 'react';
import { X, Upload, Loader2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  addProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
} from '@/modules/products/server/actions/product-images.action';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductImageUploadProps {
  productId: string;
  initialImages: ProductImage[];
}

function SortableImageItem({
  image,
  onRemove,
  isRemoving,
}: {
  image: ProductImage;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className='group relative aspect-square overflow-hidden rounded-lg border'>
      <Image src={image.url} alt={image.alt || 'Imagen del producto'} fill className='object-cover' sizes='150px' />
      <div className='absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30' />
      <button
        type='button'
        className='absolute top-1 left-1 cursor-grab rounded-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='size-3.5 text-white' />
      </button>
      <button
        type='button'
        onClick={() => onRemove(image.id)}
        disabled={isRemoving}
        className='absolute top-1 right-1 rounded-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600'
      >
        {isRemoving ? <Loader2 className='size-3.5 animate-spin text-white' /> : <X className='size-3.5 text-white' />}
      </button>
    </div>
  );
}

export function ProductImageUpload({ productId, initialImages }: ProductImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError(null);
      setIsUploading(true);

      try {
        for (const file of Array.from(files)) {
          if (file.size > 5 * 1024 * 1024) {
            setError(`"${file.name}" excede el límite de 5MB.`);
            continue;
          }

          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          });

          const result = await addProductImageAction(productId, blob.url, file.name);
          if (result.error) {
            setError(result.error);
          } else if (result.image) {
            setImages((prev) => [...prev, result.image!]);
          }
        }
      } catch {
        setError('Error al subir la imagen.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [productId]
  );

  const handleRemove = (imageId: string) => {
    setError(null);
    setRemovingId(imageId);
    startTransition(async () => {
      const result = await deleteProductImageAction(imageId);
      if (result.error) {
        setError(result.error);
      } else {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      }
      setRemovingId(null);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    const newOrder = arrayMove(images, oldIndex, newIndex);

    setImages(newOrder);
    startTransition(async () => {
      const result = await reorderProductImagesAction(newOrder.map((img) => img.id));
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className='space-y-3'>
      <label className='text-sm font-medium'>Imágenes del producto</label>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5'>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            {images.map((image) => (
              <SortableImageItem
                key={image.id}
                image={image}
                onRemove={handleRemove}
                isRemoving={removingId === image.id || isPending}
              />
            ))}
          </SortableContext>
        </DndContext>

        <label
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors ${
            isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'
          }`}
        >
          {isUploading ? (
            <Loader2 className='text-muted-foreground size-6 animate-spin' />
          ) : (
            <Upload className='text-muted-foreground size-6' />
          )}
          <span className='text-muted-foreground text-xs'>{isUploading ? 'Subiendo...' : 'Subir'}</span>
          <input
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif,image/avif'
            multiple
            onChange={handleUpload}
            disabled={isUploading}
            className='hidden'
          />
        </label>
      </div>

      <p className='text-muted-foreground text-xs'>
        JPG, PNG, WebP, GIF o AVIF. Máximo 5MB por imagen. Arrastra para reordenar.
      </p>
    </div>
  );
}
