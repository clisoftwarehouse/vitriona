'use client';

import Image from 'next/image';
import { CSS } from '@dnd-kit/utilities';
import imageCompression from 'browser-image-compression';
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

const MAX_PRODUCT_IMAGES = 5;

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
};

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

      const remaining = MAX_PRODUCT_IMAGES - images.length;
      if (remaining <= 0) {
        setError(`Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto.`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      if (filesToUpload.length < files.length) {
        setError(
          `Solo se subirán ${filesToUpload.length} de ${files.length} imágenes (límite: ${MAX_PRODUCT_IMAGES}).`
        );
      }

      setIsUploading(true);

      try {
        for (const file of filesToUpload) {
          if (file.size > 5 * 1024 * 1024) {
            setError(`"${file.name}" excede el límite de 5MB.`);
            continue;
          }

          // Compress image before uploading
          let compressedFile: File;
          try {
            compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
          } catch {
            setError(`Error al comprimir "${file.name}".`);
            continue;
          }

          const formData = new FormData();
          formData.append('file', compressedFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || 'Error al subir archivo');
            continue;
          }

          const blob = await response.json();

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
    [productId, images.length]
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

        {images.length < MAX_PRODUCT_IMAGES && (
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
        )}
      </div>

      <p className='text-muted-foreground text-xs'>
        {images.length}/{MAX_PRODUCT_IMAGES} imágenes. JPG, PNG, WebP, GIF o AVIF. Las imágenes se comprimen
        automáticamente. Arrastra para reordenar.
      </p>
    </div>
  );
}
