'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { X, Smile, Upload, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LinkBrandIcon } from './link-brand-icon';
import type { LinkType } from '../schemas/link-bio.schemas';
import { LINK_TYPE_DEFAULT_ICONS } from '../schemas/link-bio.schemas';

interface IconPickerProps {
  linkType: LinkType;
  emoji: string;
  imageUrl: string;
  onEmojiChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  disabled?: boolean;
}

type Mode = 'emoji' | 'image';

export function IconPicker({ linkType, emoji, imageUrl, onEmojiChange, onImageUrlChange, disabled }: IconPickerProps) {
  const initialMode: Mode = imageUrl ? 'image' : 'emoji';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultEmoji = LINK_TYPE_DEFAULT_ICONS[linkType];

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? 'No se pudo subir la imagen');
        return;
      }
      onImageUrlChange(data.url);
      onEmojiChange('');
      setMode('image');
    } catch {
      setError('No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleClearImage() {
    onImageUrlChange('');
    setMode('emoji');
  }

  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-xs'>Icono</Label>

      <div className='bg-muted inline-flex w-fit gap-1 rounded-md p-0.5'>
        <button
          type='button'
          onClick={() => setMode('emoji')}
          disabled={disabled}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            mode === 'emoji' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smile className='size-3' />
          Emoji
        </button>
        <button
          type='button'
          onClick={() => setMode('image')}
          disabled={disabled}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            mode === 'image' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className='size-3' />
          Imagen
        </button>
      </div>

      <div className='flex items-center gap-3'>
        {/* Preview */}
        <div className='bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border'>
          {imageUrl ? (
            <Image src={imageUrl} alt='' width={40} height={40} className='size-full object-cover' />
          ) : emoji ? (
            <span className='text-lg leading-none'>{emoji}</span>
          ) : (
            <LinkBrandIcon linkType={linkType} className='size-5' />
          )}
        </div>

        {/* Controls */}
        <div className='min-w-0 flex-1'>
          {mode === 'emoji' ? (
            <Input
              value={emoji}
              onChange={(e) => onEmojiChange(e.target.value)}
              placeholder={defaultEmoji}
              className='h-8 text-xs'
              maxLength={4}
              disabled={disabled}
            />
          ) : (
            <div className='flex items-center gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/png,image/jpeg,image/webp,image/gif,image/avif'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className='hidden'
              />
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className='h-8 text-xs'
              >
                {uploading ? (
                  <>
                    <Loader2 className='mr-1.5 size-3 animate-spin' />
                    Subiendo…
                  </>
                ) : (
                  <>
                    <Upload className='mr-1.5 size-3' />
                    {imageUrl ? 'Reemplazar' : 'Subir imagen'}
                  </>
                )}
              </Button>
              {imageUrl && (
                <Button
                  type='button'
                  size='icon-sm'
                  variant='ghost'
                  onClick={handleClearImage}
                  disabled={disabled || uploading}
                  aria-label='Quitar imagen'
                >
                  <X className='size-3.5' />
                </Button>
              )}
            </div>
          )}
          {error && <p className='text-destructive mt-1 text-[11px]'>{error}</p>}
        </div>
      </div>
    </div>
  );
}
