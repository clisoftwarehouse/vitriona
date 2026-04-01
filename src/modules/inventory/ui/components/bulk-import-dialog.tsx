'use client';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Download, ImageIcon, FileSpreadsheet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bulkImportProductsAction } from '@/modules/inventory/server/actions/bulk-import.action';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';

// ── Target fields the system expects ──

interface TargetField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

const TARGET_FIELDS: TargetField[] = [
  {
    key: 'name',
    label: 'Nombre',
    required: true,
    aliases: ['nombre', 'producto', 'product', 'name', 'titulo', 'title', 'item', 'articulo', 'artículo', 'ítem'],
  },
  {
    key: 'description',
    label: 'Descripción',
    required: false,
    aliases: [
      'descripcion',
      'descripción',
      'description',
      'detalle',
      'detalles',
      'info',
      'informacion',
      'información',
      'notas',
    ],
  },
  {
    key: 'price',
    label: 'Precio',
    required: false,
    aliases: ['precio', 'price', 'valor', 'costo', 'cost', 'monto', 'amount', 'pvp', 'tarifa', 'rate'],
  },
  {
    key: 'sku',
    label: 'SKU',
    required: false,
    aliases: ['sku', 'codigo', 'código', 'code', 'ref', 'referencia', 'reference', 'barcode', 'cod'],
  },
  {
    key: 'stock',
    label: 'Stock',
    required: false,
    aliases: ['stock', 'cantidad', 'qty', 'quantity', 'inventario', 'existencia', 'existencias', 'unidades', 'units'],
  },
];

// ── Auto-mapping logic ──

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of TARGET_FIELDS) {
    const match = headers.find((h) => field.aliases.includes(h.toLowerCase().trim()));
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

// ── Props ──

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

type Step = 'upload' | 'map' | 'preview';

export function BulkImportDialog({ open, onOpenChange, businessId }: BulkImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setStep('upload');
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setImporting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  // ── File parsing ──

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length === 0) {
            toast.error('El archivo está vacío');
            return;
          }
          const rows = result.data as Record<string, string>[];
          const cols = Object.keys(rows[0] ?? {});
          setRawRows(rows);
          setHeaders(cols);
          setMapping(autoMapColumns(cols));
          setStep('map');
        },
        error: () => toast.error('Error al leer el CSV'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
          if (rows.length === 0) {
            toast.error('El archivo está vacío');
            return;
          }
          const cols = Object.keys(rows[0] ?? {});
          setRawRows(rows);
          setHeaders(cols);
          setMapping(autoMapColumns(cols));
          setStep('map');
        } catch {
          toast.error('Error al leer el Excel');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Formato no soportado. Usa CSV o Excel (.xlsx, .xls)');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  // ── Mapped preview rows ──

  const mappedRows = useMemo(() => {
    if (!mapping.name) return [];
    return rawRows
      .map((row) => ({
        name: String(row[mapping.name] ?? '').trim(),
        description: mapping.description ? String(row[mapping.description] ?? '').trim() : '',
        price: mapping.price
          ? String(row[mapping.price] ?? '0')
              .replace(/[^0-9.,]/g, '')
              .replace(',', '.')
          : '0',
        sku: mapping.sku ? String(row[mapping.sku] ?? '').trim() : '',
        stock: mapping.stock ? parseInt(String(row[mapping.stock] ?? '0')) || 0 : 0,
      }))
      .filter((r) => r.name.length > 0);
  }, [rawRows, mapping]);

  // ── Import ──

  const handleImport = async () => {
    if (mappedRows.length === 0) return;
    setImporting(true);
    const result = await bulkImportProductsAction(businessId, mappedRows);
    setImporting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const parts = [`${result.created} producto(s) importados`];
    if (result.skipped) parts.push(`${result.skipped} omitidos`);
    if (result.limited) parts.push(`${result.limited} no importados por límite de plan`);
    toast.success(parts.join('. ') + '.');
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Importar productos</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo CSV o Excel con tus productos.'}
            {step === 'map' && 'Mapea las columnas de tu archivo a los campos del sistema.'}
            {step === 'preview' && `Vista previa: ${mappedRows.length} producto(s) a importar.`}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className='space-y-4'>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className='hover:border-primary/50 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 transition-colors'
            >
              <FileSpreadsheet className='text-muted-foreground size-10' />
              <p className='text-sm font-medium'>Arrastra tu archivo aquí</p>
              <p className='text-muted-foreground text-xs'>CSV, XLS o XLSX</p>
              <label className='cursor-pointer'>
                <Button variant='outline' size='sm' asChild>
                  <span>
                    <Upload className='size-3.5' />
                    Seleccionar archivo
                  </span>
                </Button>
                <input type='file' accept='.csv,.xlsx,.xls,.txt' className='hidden' onChange={handleFileInput} />
              </label>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-2'>
                <Download className='text-muted-foreground size-4' />
                <div>
                  <p className='text-sm font-medium'>Plantilla de ejemplo</p>
                  <p className='text-muted-foreground text-xs'>
                    CSV con columnas: Nombre, Descripción, Precio, SKU, Stock
                  </p>
                </div>
              </div>
              <Button variant='outline' size='sm' asChild>
                <a href='/templates/plantilla-productos.csv' download>
                  Descargar
                </a>
              </Button>
            </div>

            <div className='flex items-start gap-2 rounded-lg border p-3'>
              <ImageIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div>
                <p className='text-sm font-medium'>Imágenes de productos</p>
                <p className='text-muted-foreground text-xs'>
                  Puedes agregar imágenes después de importar. Recomendamos: <strong>1200×1200px</strong>, máximo{' '}
                  <strong>5 MB</strong>, formatos JPG, PNG o WebP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Column mapping ── */}
        {step === 'map' && (
          <div className='space-y-4'>
            <div className='space-y-3'>
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className='flex items-center gap-3'>
                  <div className='w-28 shrink-0'>
                    <span className='text-sm font-medium'>
                      {field.label}
                      {field.required && <span className='text-red-500'> *</span>}
                    </span>
                  </div>
                  <Select
                    value={mapping[field.key] ?? '_none'}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [field.key]: v === '_none' ? '' : v }))}
                  >
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Sin asignar' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='_none'>— Sin asignar —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping[field.key] && mapping[field.key] !== '_none' && (
                    <Badge variant='outline' className='shrink-0 text-[10px]'>
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <p className='text-muted-foreground text-xs'>
              Detectamos {headers.length} columnas. Se mapearon automáticamente{' '}
              {Object.values(mapping).filter(Boolean).length}.
            </p>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' size='sm' onClick={reset}>
                Volver
              </Button>
              <Button size='sm' onClick={() => setStep('preview')} disabled={!mapping.name}>
                Vista previa
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview + confirm ── */}
        {step === 'preview' && (
          <div className='space-y-4'>
            <div className='max-h-64 overflow-auto rounded-lg border'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50 sticky top-0'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium'>Nombre</th>
                    <th className='px-3 py-2 text-left font-medium'>Precio</th>
                    <th className='px-3 py-2 text-left font-medium'>SKU</th>
                    <th className='px-3 py-2 text-left font-medium'>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className='border-t'>
                      <td className='max-w-50 truncate px-3 py-1.5'>{row.name}</td>
                      <td className='px-3 py-1.5'>${row.price}</td>
                      <td className='text-muted-foreground px-3 py-1.5'>{row.sku || '—'}</td>
                      <td className='px-3 py-1.5'>{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedRows.length > 50 && (
                <p className='text-muted-foreground px-3 py-2 text-center text-xs'>...y {mappedRows.length - 50} más</p>
              )}
            </div>

            <div className='flex justify-between'>
              <Button variant='outline' size='sm' onClick={() => setStep('map')}>
                Volver al mapeo
              </Button>
              <Button size='sm' onClick={handleImport} disabled={importing || mappedRows.length === 0}>
                {importing ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin' />
                    Importando...
                  </>
                ) : (
                  `Importar ${mappedRows.length} producto(s)`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
