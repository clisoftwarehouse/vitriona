'use client';

import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Trash2, Upload, Loader2, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { deleteKnowledgeFileAction } from '../../server/actions/knowledge-files.action';

interface KnowledgeFile {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'processing' | 'ready' | 'error';
}

interface KnowledgeFilesUploadProps {
  businessId: string;
  files: KnowledgeFile[];
  onFilesChange: (files: KnowledgeFile[]) => void;
}

export function KnowledgeFilesUpload({ businessId, files, onFilesChange }: KnowledgeFilesUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo excede 10MB');
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('businessId', businessId);

        const response = await fetch('/api/chatbot/upload-knowledge', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al subir archivo');
        }

        const data = await response.json();
        onFilesChange([
          ...files,
          { id: data.id, fileName: data.fileName, fileUrl: data.fileUrl, status: 'processing' },
        ]);
        toast.success('Archivo subido. Procesando texto...');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al subir archivo');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [businessId, files, onFilesChange]
  );

  const handleDelete = async (fileId: string) => {
    const result = await deleteKnowledgeFileAction(businessId, fileId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onFilesChange(files.filter((f) => f.id !== fileId));
    toast.success('Archivo eliminado');
  };

  const statusBadge = (status: KnowledgeFile['status']) => {
    switch (status) {
      case 'processing':
        return <span className='rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600'>Procesando</span>;
      case 'ready':
        return <span className='rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600'>Listo</span>;
      case 'error':
        return <span className='rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600'>Error</span>;
    }
  };

  return (
    <div className='space-y-3'>
      {files.length > 0 && (
        <div className='space-y-2'>
          {files.map((file) => (
            <div key={file.id} className='bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-2'>
              <FileText className='text-muted-foreground size-4 shrink-0' />
              <span className='flex-1 truncate text-sm'>{file.fileName}</span>
              {statusBadge(file.status)}
              <Button type='button' variant='ghost' size='icon-sm' onClick={() => handleDelete(file.id)}>
                <Trash2 className='size-4 text-red-500' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <label className='bg-muted/30 hover:bg-muted/60 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors'>
        {isUploading ? (
          <Loader2 className='text-muted-foreground size-6 animate-spin' />
        ) : (
          <Upload className='text-muted-foreground size-6' />
        )}
        <span className='text-muted-foreground text-sm'>
          {isUploading ? 'Subiendo...' : 'Arrastra un PDF o haz clic para seleccionar'}
        </span>
        <span className='text-muted-foreground text-xs'>Máximo 10MB por archivo</span>
        <input type='file' accept='.pdf' className='hidden' onChange={handleUpload} disabled={isUploading} />
      </label>
    </div>
  );
}
