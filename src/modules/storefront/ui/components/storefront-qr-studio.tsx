'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { useId, useRef, useState, useEffect, useTransition, type MutableRefObject } from 'react';
import { X, Copy, Store, QrCode, ImageUp, Download, RotateCcw, ExternalLink, WandSparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { updateStorefrontQrSettingsAction } from '@/modules/storefront/server/actions/update-storefront-qr-settings.action';
import {
  type StorefrontQrPreset,
  type StorefrontQrLogoMode,
  type StorefrontQrSettings,
  storefrontQrSettingsSchema,
  getDefaultStorefrontQrSettings,
} from '@/modules/storefront/lib/storefront-qr';

type DotStyle = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
type CornerDotStyle = 'dot' | 'square' | DotStyle;
type CornerSquareStyle = 'dot' | 'square' | 'extra-rounded' | DotStyle;
type QrShape = 'square' | 'circle';
type QrDownloadExtension = 'png' | 'svg';

type QrOptions = {
  type?: 'canvas' | 'svg';
  shape?: QrShape;
  width?: number;
  height?: number;
  margin?: number;
  data?: string;
  image?: string;
  qrOptions?: {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  };
  imageOptions?: {
    saveAsBlob?: boolean;
    hideBackgroundDots?: boolean;
    imageSize?: number;
    crossOrigin?: string;
    margin?: number;
  };
  dotsOptions?: {
    type?: DotStyle;
    color?: string;
    roundSize?: boolean;
  };
  cornersSquareOptions?: {
    type?: CornerSquareStyle;
    color?: string;
  };
  cornersDotOptions?: {
    type?: CornerDotStyle;
    color?: string;
  };
  backgroundOptions?: {
    color?: string;
  };
};

interface QrCodeStylingInstance {
  append(container: HTMLElement): void;
  update(options: QrOptions): void;
  download(options?: { name?: string; extension?: QrDownloadExtension | 'jpeg' | 'webp' }): void;
}

type QrCodeStylingConstructor = new (options: QrOptions) => QrCodeStylingInstance;

interface StorefrontQrStudioProps {
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessLogoUrl: string | null;
  initialSettings: StorefrontQrSettings;
  hasPersistedSettings: boolean;
}

const PRESET_OPTIONS: Record<
  StorefrontQrPreset,
  {
    label: string;
    description: string;
    shape: QrShape;
    dots: DotStyle;
    cornersSquare: CornerSquareStyle;
    cornersDot: CornerDotStyle;
  }
> = {
  classic: {
    label: 'Clásico',
    description: 'Líneas limpias y estructura cuadrada.',
    shape: 'square',
    dots: 'square',
    cornersSquare: 'square',
    cornersDot: 'square',
  },
  rounded: {
    label: 'Rounded',
    description: 'Más suave y amigable para marcas modernas.',
    shape: 'square',
    dots: 'rounded',
    cornersSquare: 'extra-rounded',
    cornersDot: 'dot',
  },
  classy: {
    label: 'Classy',
    description: 'Patrón con más personalidad visual.',
    shape: 'square',
    dots: 'classy-rounded',
    cornersSquare: 'extra-rounded',
    cornersDot: 'dot',
  },
  orbit: {
    label: 'Orbit',
    description: 'Un look más distintivo para campañas y posters.',
    shape: 'circle',
    dots: 'dots',
    cornersSquare: 'dot',
    cornersDot: 'dot',
  },
};

export function StorefrontQrStudio({
  businessId,
  businessName,
  businessSlug,
  businessLogoUrl,
  initialSettings,
  hasPersistedSettings,
}: StorefrontQrStudioProps) {
  const customLogoInputId = useId();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<QrCodeStylingInstance | null>(null);
  const lastSavedPayloadRef = useRef(JSON.stringify(initialSettings));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [storefrontUrl, setStorefrontUrl] = useState(initialSettings.url);
  const [preset, setPreset] = useState<StorefrontQrPreset>(initialSettings.preset);
  const [bodyColor, setBodyColor] = useState(initialSettings.bodyColor);
  const [cornerColor, setCornerColor] = useState(initialSettings.cornerColor);
  const [backgroundColor, setBackgroundColor] = useState(initialSettings.backgroundColor);
  const [includeLogo, setIncludeLogo] = useState(initialSettings.includeLogo);
  const [logoMode, setLogoMode] = useState<StorefrontQrLogoMode>(initialSettings.logoMode);
  const [customLogoUrl, setCustomLogoUrl] = useState(initialSettings.customLogoUrl);
  const [logoScale, setLogoScale] = useState(initialSettings.logoScale);
  const [isReadingLogo, setIsReadingLogo] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    hasPersistedSettings ? 'saved' : 'idle'
  );
  const [isOriginReady, setIsOriginReady] = useState(hasPersistedSettings);

  const activePreset = PRESET_OPTIONS[preset];
  const effectiveLogo = includeLogo ? (logoMode === 'business' ? businessLogoUrl : customLogoUrl || null) : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasPersistedSettings) {
      setStorefrontUrl(`${window.location.origin}/${businessSlug}`);
    }

    setIsOriginReady(true);
  }, [businessSlug, hasPersistedSettings]);

  useEffect(() => {
    const options = buildQrOptions({
      activePreset,
      backgroundColor,
      bodyColor,
      cornerColor,
      data: storefrontUrl,
      logoScale,
      logoUrl: effectiveLogo,
    });

    ensureQrCode(previewRef.current, qrCodeRef, options).catch(() => {
      toast.error('No se pudo preparar el generador de QR');
    });
  }, [activePreset, backgroundColor, bodyColor, cornerColor, effectiveLogo, logoScale, storefrontUrl]);

  useEffect(() => {
    if (!isOriginReady) return;

    const payload = buildSettingsPayload({
      backgroundColor,
      bodyColor,
      cornerColor,
      customLogoUrl,
      includeLogo,
      logoMode,
      logoScale,
      preset,
      storefrontUrl,
    });

    const parsed = storefrontQrSettingsSchema.safeParse(payload);
    if (!parsed.success) {
      setSaveState('idle');
      return;
    }

    const serializedPayload = JSON.stringify(parsed.data);
    if (serializedPayload === lastSavedPayloadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState('saving');

    saveTimeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateStorefrontQrSettingsAction(businessId, parsed.data);

        if (result?.error) {
          setSaveState('error');
          toast.error(result.error);
          return;
        }

        lastSavedPayloadRef.current = serializedPayload;
        setSaveState('saved');
      });
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    backgroundColor,
    bodyColor,
    businessId,
    cornerColor,
    customLogoUrl,
    includeLogo,
    isOriginReady,
    logoMode,
    logoScale,
    preset,
    storefrontUrl,
  ]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleDownload = async (extension: QrDownloadExtension) => {
    const parsed = storefrontQrSettingsSchema.safeParse(
      buildSettingsPayload({
        backgroundColor,
        bodyColor,
        cornerColor,
        customLogoUrl,
        includeLogo,
        logoMode,
        logoScale,
        preset,
        storefrontUrl,
      })
    );

    if (!parsed.success) {
      toast.error('La URL del QR no es válida todavía');
      return;
    }

    const instance = await ensureQrCode(
      previewRef.current,
      qrCodeRef,
      buildQrOptions({
        activePreset,
        backgroundColor,
        bodyColor,
        cornerColor,
        data: storefrontUrl,
        logoScale,
        logoUrl: effectiveLogo,
      })
    );

    if (!instance) {
      toast.error('El QR todavía no está listo');
      return;
    }

    instance.download({
      extension,
      name: `storefront-${sanitizeFileName(businessSlug)}`,
    });
  };

  const handleOpenStorefront = () => {
    if (typeof window === 'undefined') return;
    window.open(storefrontUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCustomLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo puedes usar imágenes como logo');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('El logo no debe exceder 3MB');
      return;
    }

    setIsReadingLogo(true);

    try {
      const uploadedLogoUrl = await uploadQrLogo(file);
      setCustomLogoUrl(uploadedLogoUrl);
      setLogoMode('custom');
      setIncludeLogo(true);
      toast.success('Logo cargado al generador');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el logo');
    } finally {
      setIsReadingLogo(false);
      event.target.value = '';
    }
  };

  const handleReset = () => {
    const defaults = getDefaultStorefrontQrSettings({
      businessSlug,
      businessLogoUrl,
      origin: typeof window === 'undefined' ? undefined : window.location.origin,
    });

    setStorefrontUrl(defaults.url);
    setPreset(defaults.preset);
    setBodyColor(defaults.bodyColor);
    setCornerColor(defaults.cornerColor);
    setBackgroundColor(defaults.backgroundColor);
    setIncludeLogo(defaults.includeLogo);
    setLogoMode(defaults.logoMode);
    setCustomLogoUrl(defaults.customLogoUrl);
    setLogoScale(defaults.logoScale);
    toast.success('Ajustes del QR restablecidos');
  };

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]'>
      <Card className='overflow-hidden'>
        <CardHeader className='border-b pb-6'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl'>
              <QrCode className='size-5' />
            </div>
            <div>
              <CardTitle>Preview del QR</CardTitle>
              <CardDescription>Apunta al storefront actual usando la ruta /{businessSlug}.</CardDescription>
            </div>
            <Badge className='ml-auto'>/{businessSlug}</Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-6 pt-6'>
          <div className='from-muted/30 via-background to-muted/10 relative overflow-hidden rounded-3xl border bg-linear-to-br p-6 sm:p-8'>
            <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <Store className='text-primary size-4' />
                  {businessName}
                </div>
                <div>
                  <p className='text-2xl font-semibold tracking-tight'>Listo para imprimir o compartir</p>
                  <p className='text-muted-foreground mt-2 max-w-xl text-sm leading-6'>
                    Ajusta estilo, color y logo para usar este QR en mesas, empaques, flyers o redes.
                  </p>
                </div>
                <div className='bg-muted/50 rounded-2xl border px-4 py-3'>
                  <p className='text-muted-foreground text-xs tracking-[0.22em] uppercase'>Enlace del storefront</p>
                  <p className='mt-1 text-sm font-medium break-all'>{storefrontUrl}</p>
                </div>
              </div>

              <div className='bg-background mx-auto flex w-full max-w-65 items-center justify-center rounded-4xl border p-5 shadow-sm'>
                <div ref={previewRef} className='flex min-h-55 min-w-55 items-center justify-center' />
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Button onClick={handleCopyLink} variant='outline'>
              <Copy className='size-4' />
              Copiar enlace
            </Button>
            <Button onClick={() => void handleDownload('png')}>
              <Download className='size-4' />
              Descargar PNG
            </Button>
            <Button onClick={() => void handleDownload('svg')} variant='outline'>
              <Download className='size-4' />
              Descargar SVG
            </Button>
            <Button onClick={handleOpenStorefront} variant='ghost'>
              <ExternalLink className='size-4' />
              Abrir storefront
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <WandSparkles className='size-4' />
              Estilo y destino
            </CardTitle>
            <CardDescription>Personaliza el QR que llevará a tu storefront actual.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='storefront-url'>URL de destino</Label>
              <Input
                id='storefront-url'
                value={storefrontUrl}
                onChange={(event) => setStorefrontUrl(event.target.value)}
              />
              <p className='text-muted-foreground text-xs'>
                Mientras no haya subdominios, el QR usa la ruta de tu tienda en formato /{businessSlug}.
              </p>
            </div>

            <div className='space-y-3'>
              <Label>Preset visual</Label>
              <div className='grid gap-3 sm:grid-cols-2'>
                {(
                  Object.entries(PRESET_OPTIONS) as Array<
                    [StorefrontQrPreset, (typeof PRESET_OPTIONS)[StorefrontQrPreset]]
                  >
                ).map(([key, option]) => (
                  <button
                    key={key}
                    type='button'
                    onClick={() => setPreset(key)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-colors',
                      preset === key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <p className='text-sm font-semibold'>{option.label}</p>
                    <p className='text-muted-foreground mt-1 text-xs leading-5'>{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <ColorField label='Color principal' value={bodyColor} onChange={setBodyColor} />
              <ColorField label='Ojos del QR' value={cornerColor} onChange={setCornerColor} />
              <ColorField label='Fondo' value={backgroundColor} onChange={setBackgroundColor} />
            </div>

            <Button onClick={handleReset} variant='ghost' className='w-full justify-center'>
              <RotateCcw className='size-4' />
              Restablecer ajustes
            </Button>

            <p className='text-muted-foreground text-center text-xs'>
              {isPending || saveState === 'saving'
                ? 'Guardando cambios...'
                : saveState === 'saved'
                  ? 'Cambios guardados en la base de datos.'
                  : saveState === 'error'
                    ? 'Hubo un problema guardando los cambios.'
                    : 'Los cambios se guardan automáticamente.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ImageUp className='size-4' />
              Logo en el centro
            </CardTitle>
            <CardDescription>Usa el logo actual del negocio o carga uno alterno para este QR.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='flex items-center justify-between gap-4 rounded-2xl border px-4 py-3'>
              <div>
                <p className='text-sm font-medium'>Incluir logo</p>
                <p className='text-muted-foreground text-xs'>Mejor para material impreso y packaging.</p>
              </div>
              <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} />
            </div>

            <div className='space-y-2'>
              <Label>Fuente del logo</Label>
              <Select
                value={logoMode}
                onValueChange={(value) => setLogoMode(value as StorefrontQrLogoMode)}
                disabled={!includeLogo}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecciona una fuente' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='business' disabled={!businessLogoUrl}>
                    Logo actual del negocio
                  </SelectItem>
                  <SelectItem value='custom'>Logo alterno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {includeLogo && logoMode === 'custom' ? (
              <div className='space-y-3'>
                <label
                  htmlFor={customLogoInputId}
                  className='hover:bg-accent/50 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-sm transition-colors'
                >
                  <ImageUp className='size-4' />
                  {isReadingLogo ? 'Subiendo logo...' : 'Subir logo alterno'}
                </label>
                <input
                  id={customLogoInputId}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleCustomLogoUpload}
                />
                <p className='text-muted-foreground text-xs'>Recomendado: PNG cuadrado con fondo transparente.</p>
              </div>
            ) : null}

            {includeLogo && effectiveLogo ? (
              <div className='rounded-2xl border p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium'>Vista previa del logo</p>
                    <p className='text-muted-foreground text-xs'>Se incrustará en el centro del QR.</p>
                  </div>
                  {logoMode === 'custom' && customLogoUrl ? (
                    <Button type='button' variant='ghost' size='icon-sm' onClick={() => setCustomLogoUrl('')}>
                      <X className='size-4' />
                    </Button>
                  ) : null}
                </div>
                <div className='mt-4 flex items-center gap-4'>
                  <div className='bg-muted flex size-16 items-center justify-center overflow-hidden rounded-2xl border'>
                    <Image
                      src={effectiveLogo}
                      alt='Logo para QR'
                      width={64}
                      height={64}
                      className='h-full w-full object-contain'
                    />
                  </div>
                  <div className='min-w-0 flex-1 space-y-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <Label htmlFor='logo-scale'>Tamaño del logo</Label>
                      <span className='text-muted-foreground text-xs'>{Math.round(logoScale * 100)}%</span>
                    </div>
                    <input
                      id='logo-scale'
                      type='range'
                      min='0.16'
                      max='0.32'
                      step='0.01'
                      value={logoScale}
                      onChange={(event) => setLogoScale(Number(event.target.value))}
                      className='accent-primary w-full'
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {includeLogo && !effectiveLogo ? (
              <div className='text-muted-foreground rounded-2xl border border-dashed px-4 py-3 text-sm'>
                No hay logo disponible todavía. Puedes usar el logo del negocio o cargar uno alterno.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='bg-background flex items-center gap-3 rounded-2xl border px-3 py-2'>
        <input
          type='color'
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className='size-9 cursor-pointer rounded-md border p-1'
        />
        <span className='text-sm font-medium'>{value}</span>
      </div>
    </div>
  );
}

function buildQrOptions({
  activePreset,
  backgroundColor,
  bodyColor,
  cornerColor,
  data,
  logoScale,
  logoUrl,
}: {
  activePreset: (typeof PRESET_OPTIONS)[StorefrontQrPreset];
  backgroundColor: string;
  bodyColor: string;
  cornerColor: string;
  data: string;
  logoScale: number;
  logoUrl: string | null;
}): QrOptions {
  return {
    type: 'svg',
    width: 320,
    height: 320,
    shape: activePreset.shape,
    margin: 12,
    data,
    image: logoUrl ?? undefined,
    qrOptions: {
      errorCorrectionLevel: logoUrl ? 'H' : 'Q',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      hideBackgroundDots: true,
      imageSize: logoScale,
      margin: 8,
      saveAsBlob: true,
    },
    dotsOptions: {
      color: bodyColor,
      roundSize: true,
      type: activePreset.dots,
    },
    cornersSquareOptions: {
      color: cornerColor,
      type: activePreset.cornersSquare,
    },
    cornersDotOptions: {
      color: cornerColor,
      type: activePreset.cornersDot,
    },
    backgroundOptions: {
      color: backgroundColor,
    },
  };
}

function buildSettingsPayload({
  backgroundColor,
  bodyColor,
  cornerColor,
  customLogoUrl,
  includeLogo,
  logoMode,
  logoScale,
  preset,
  storefrontUrl,
}: {
  storefrontUrl: string;
  preset: StorefrontQrPreset;
  bodyColor: string;
  cornerColor: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoMode: StorefrontQrLogoMode;
  customLogoUrl: string;
  logoScale: number;
}): StorefrontQrSettings {
  return {
    url: storefrontUrl.trim(),
    preset,
    bodyColor,
    cornerColor,
    backgroundColor,
    includeLogo,
    logoMode,
    customLogoUrl,
    logoScale,
  };
}

async function ensureQrCode(
  container: HTMLDivElement | null,
  qrCodeRef: MutableRefObject<QrCodeStylingInstance | null>,
  options: QrOptions
) {
  if (!container) return null;

  const qrModule = await import('qr-code-styling');
  const QRCodeStyling = (qrModule.default ?? qrModule) as unknown as QrCodeStylingConstructor;

  if (!qrCodeRef.current) {
    qrCodeRef.current = new QRCodeStyling(options);
    container.innerHTML = '';
    qrCodeRef.current.append(container);
    return qrCodeRef.current;
  }

  qrCodeRef.current.update(options);
  return qrCodeRef.current;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
}

async function uploadQrLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await response.json();

  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Error al subir logo');
  }

  return data.url as string;
}
