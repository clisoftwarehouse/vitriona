'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import {
  X,
  Eye,
  Plus,
  Check,
  Store,
  Pencil,
  Trash2,
  EyeOff,
  Palette,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';

import { IconPicker } from './icon-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LinkBrandIcon } from './link-brand-icon';
import { Separator } from '@/components/ui/separator';
import type { linkPages, linkPageLinks } from '@/db/schema';
import type { LinkType } from '../schemas/link-bio.schemas';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  addLinkAction,
  deleteLinkAction,
  updateLinkAction,
  reorderLinksAction,
  seedSocialLinksAction,
  toggleLinkActiveAction,
  updateLinkPageSettingsAction,
} from '../../server/actions/link-bio.actions';
import {
  FONTS,
  LINK_TYPES,
  FONT_LABELS,
  BUTTON_STYLES,
  linkItemSchema,
  LINK_TYPE_LABELS,
  displayUrlForType,
  BUTTON_STYLE_LABELS,
  normalizeUrlForType,
  getUrlInputPropsForType,
} from '../schemas/link-bio.schemas';

type LinkPage = typeof linkPages.$inferSelect;
type LinkItem = typeof linkPageLinks.$inferSelect;

type FontValue = 'inter' | 'playfair' | 'dm-sans' | 'poppins' | 'roboto' | 'space-grotesk' | 'outfit';
type ButtonStyleValue =
  | 'pill-filled'
  | 'pill-outlined'
  | 'filled'
  | 'outlined'
  | 'soft'
  | 'glass'
  | 'gradient'
  | 'link';
type BgType = 'color' | 'gradient' | 'image';

interface LinkBioManagerProps {
  businessId: string;
  businessSlug: string;
  page: LinkPage;
  links: LinkItem[];
}

// ── Colour swatch input ──────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className='flex items-center gap-3'>
      <input
        type='color'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-8 w-8 shrink-0 cursor-pointer rounded border'
      />
      <div className='min-w-0'>
        <Label className='text-xs'>{label}</Label>
        <p className='text-muted-foreground truncate text-xs'>{value}</p>
      </div>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className='text-muted-foreground text-[10px] font-semibold tracking-widest uppercase'>{children}</Label>
  );
}

export function LinkBioManager({ businessId, businessSlug, page, links: initialLinks }: LinkBioManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Settings state ────────────────────────────────────────────────────────
  const [title, setTitle] = useState(page.title ?? '');
  const [bio, setBio] = useState(page.bio ?? '');
  const [isActive, setIsActive] = useState(page.isActive ?? true);
  const [useStorefrontTheme, setUseStorefrontTheme] = useState(page.useStorefrontTheme ?? false);

  // Background
  const [bgType, setBgType] = useState<BgType>((page.backgroundType as BgType) ?? 'color');
  const [bgColor, setBgColor] = useState(page.backgroundColor ?? '#0f0f0f');
  const [bgGradient, setBgGradient] = useState(
    page.backgroundGradient ?? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)'
  );
  const [bgImageUrl, setBgImageUrl] = useState(page.backgroundImageUrl ?? '');
  const [bgOverlay, setBgOverlay] = useState(page.backgroundOverlay ?? false);
  const [bgOverlayColor, setBgOverlayColor] = useState(page.backgroundOverlayColor ?? '#000000');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(page.backgroundOverlayOpacity ?? 50);

  // Text
  const [textColor, setTextColor] = useState(page.textColor ?? '#ffffff');
  const [font, setFont] = useState<FontValue>((page.font as FontValue) ?? 'inter');

  // Button
  const [buttonStyle, setButtonStyle] = useState<ButtonStyleValue>(
    (page.buttonStyle as ButtonStyleValue) ?? 'pill-filled'
  );
  const [buttonColor, setButtonColor] = useState(page.buttonColor ?? '#8b1a1a');
  const [buttonTextColor, setButtonTextColor] = useState(page.buttonTextColor ?? '#ffffff');
  const [buttonRadius, setButtonRadius] = useState(page.buttonRadius ?? 999);
  const [gradientFrom, setGradientFrom] = useState(page.buttonGradientFrom ?? '#6366f1');
  const [gradientTo, setGradientTo] = useState(page.buttonGradientTo ?? '#a855f7');
  const [gradientAngle, setGradientAngle] = useState(page.buttonGradientAngle ?? 135);

  // Storefront link
  const [storefrontLinkTitle, setStorefrontLinkTitle] = useState(page.storefrontLinkTitle ?? 'Ver nuestra tienda');
  const [storefrontLinkEnabled, setStorefrontLinkEnabled] = useState(page.storefrontLinkEnabled ?? true);

  // ── New link form ─────────────────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<LinkType>('custom');
  const [newEmoji, setNewEmoji] = useState('');
  const [newIconImageUrl, setNewIconImageUrl] = useState('');

  // Validation errors
  const [addUrlError, setAddUrlError] = useState<string | null>(null);
  const [editUrlError, setEditUrlError] = useState<string | null>(null);

  // ── Inline edit state (per-link) ──────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<LinkType>('custom');
  const [editEmoji, setEditEmoji] = useState('');
  const [editIconImageUrl, setEditIconImageUrl] = useState('');

  function getZodUrlError(result: ReturnType<typeof linkItemSchema.safeParse>): string | null {
    if (result.success) return null;
    const urlIssue = result.error.issues.find((i) => i.path[0] === 'url');
    if (urlIssue) return urlIssue.message;
    return result.error.issues[0]?.message ?? 'Datos inválidos';
  }

  function resetNewLinkForm() {
    setNewTitle('');
    setNewUrl('');
    setNewType('custom');
    setNewEmoji('');
    setNewIconImageUrl('');
    setAddUrlError(null);
  }

  function startEdit(link: LinkItem) {
    const type = link.linkType as LinkType;
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(displayUrlForType(link.url, type));
    setEditType(type);
    setEditEmoji(link.iconEmoji ?? '');
    setEditIconImageUrl(link.iconImageUrl ?? '');
    setEditUrlError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditUrlError(null);
  }

  function handleSaveEdit(linkId: string) {
    if (!editTitle.trim() || !editUrl.trim()) return;
    const normalizedUrl = normalizeUrlForType(editUrl, editType);
    const payload = {
      title: editTitle.trim(),
      url: normalizedUrl,
      linkType: editType,
      iconEmoji: editEmoji || undefined,
      iconImageUrl: editIconImageUrl || undefined,
      isActive: true,
      sortOrder: 0,
    };
    const parsed = linkItemSchema.safeParse(payload);
    if (!parsed.success) {
      setEditUrlError(getZodUrlError(parsed));
      return;
    }
    setEditUrlError(null);
    startTransition(async () => {
      const result = await updateLinkAction(businessId, linkId, {
        title: editTitle.trim(),
        url: normalizedUrl,
        linkType: editType,
        iconEmoji: editEmoji || '',
        iconImageUrl: editIconImageUrl || '',
      });
      if (!result.success) {
        setEditUrlError(result.error);
        return;
      }
      setLinks((prev) =>
        prev.map((l) =>
          l.id === linkId
            ? {
                ...l,
                title: editTitle.trim(),
                url: normalizedUrl,
                linkType: editType,
                iconEmoji: editEmoji || null,
                iconImageUrl: editIconImageUrl || null,
              }
            : l
        )
      );
      setEditingId(null);
    });
  }

  const publicUrl = `/${businessSlug}/links`;
  const isGradientBtn = buttonStyle === 'gradient';

  const [settingsError, setSettingsError] = useState<string | null>(null);

  function handleSaveSettings() {
    setSettingsError(null);
    startTransition(async () => {
      const result = await updateLinkPageSettingsAction(businessId, {
        title,
        bio,
        isActive,
        useStorefrontTheme,
        backgroundType: bgType,
        backgroundColor: bgColor,
        backgroundGradient: bgGradient,
        backgroundImageUrl: bgImageUrl || undefined,
        backgroundOverlay: bgOverlay,
        backgroundOverlayColor: bgOverlayColor,
        backgroundOverlayOpacity: bgOverlayOpacity,
        textColor,
        font,
        buttonStyle,
        buttonColor,
        buttonTextColor,
        buttonRadius,
        buttonGradientFrom: gradientFrom,
        buttonGradientTo: gradientTo,
        buttonGradientAngle: gradientAngle,
        storefrontLinkTitle,
        storefrontLinkEnabled,
      });
      if (!result.success) setSettingsError(result.error);
    });
  }

  function handleAddLink() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const normalizedUrl = normalizeUrlForType(newUrl, newType);
    const payload = {
      title: newTitle.trim(),
      url: normalizedUrl,
      linkType: newType,
      iconEmoji: newEmoji || undefined,
      iconImageUrl: newIconImageUrl || undefined,
      isActive: true,
      sortOrder: links.length,
    };
    const parsed = linkItemSchema.safeParse(payload);
    if (!parsed.success) {
      setAddUrlError(getZodUrlError(parsed));
      return;
    }
    setAddUrlError(null);
    startTransition(async () => {
      const result = await addLinkAction(businessId, payload);
      if (!result.success) {
        setAddUrlError(result.error);
        return;
      }
      setLinks((prev) => [...prev, result.data]);
      resetNewLinkForm();
      setShowAddForm(false);
    });
  }

  function handleDelete(linkId: string) {
    startTransition(async () => {
      await deleteLinkAction(businessId, linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    });
  }

  function handleToggle(linkId: string, current: boolean) {
    startTransition(async () => {
      await toggleLinkActiveAction(businessId, linkId, !current);
      setLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, isActive: !current } : l)));
    });
  }

  function move(index: number, dir: -1 | 1) {
    const updated = [...links];
    const swap = index + dir;
    if (swap < 0 || swap >= updated.length) return;
    [updated[index], updated[swap]] = [updated[swap], updated[index]];
    setLinks(updated);
    startTransition(async () => {
      await reorderLinksAction(
        businessId,
        updated.map((l) => l.id)
      );
    });
  }

  function handleSeedSocials() {
    startTransition(async () => {
      const result = await seedSocialLinksAction(businessId);
      if (result.success && result.count > 0) window.location.reload();
    });
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Página de Links</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Tu link bio público en{' '}
            <a href={publicUrl} target='_blank' className='text-primary inline-flex items-center gap-1 hover:underline'>
              {businessSlug}/links <ExternalLink className='size-3' />
            </a>
          </p>
        </div>
        <Button variant='outline' size='sm' asChild>
          <a href={publicUrl} target='_blank'>
            <ExternalLink className='size-4' />
            Ver página
          </a>
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_340px]'>
        {/* ── Left: Links list ── */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' onClick={() => setShowAddForm((v) => !v)}>
              <Plus className='size-4' />
              Agregar link
            </Button>
            {links.length === 0 && (
              <Button size='sm' variant='outline' onClick={handleSeedSocials} disabled={isPending}>
                <Sparkles className='size-4' />
                Importar redes sociales
              </Button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className='bg-muted/40 rounded-lg border p-4'>
              <p className='mb-3 text-sm font-medium'>Nuevo link</p>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Tipo</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as LinkType)}>
                    <SelectTrigger className='h-8 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className='text-xs'>
                          <span className='inline-flex items-center gap-2'>
                            <LinkBrandIcon linkType={t} className='size-3.5' />
                            {LINK_TYPE_LABELS[t]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <IconPicker
                  linkType={newType}
                  emoji={newEmoji}
                  imageUrl={newIconImageUrl}
                  onEmojiChange={setNewEmoji}
                  onImageUrlChange={setNewIconImageUrl}
                  disabled={isPending}
                />
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Título</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={LINK_TYPE_LABELS[newType]}
                    className='h-8 text-xs'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  {(() => {
                    const props = getUrlInputPropsForType(newType);
                    return (
                      <>
                        <Label className='text-xs'>{props.label}</Label>
                        <Input
                          value={newUrl}
                          onChange={(e) => {
                            setNewUrl(e.target.value);
                            if (addUrlError) setAddUrlError(null);
                          }}
                          placeholder={props.placeholder}
                          className={`h-8 text-xs ${addUrlError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                          type={props.inputType}
                          aria-invalid={addUrlError ? true : undefined}
                          aria-describedby={addUrlError ? 'add-url-error' : undefined}
                        />
                      </>
                    );
                  })()}
                  {addUrlError && (
                    <p id='add-url-error' className='text-destructive text-[11px]'>
                      {addUrlError}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button size='sm' onClick={handleAddLink} disabled={isPending || !newTitle.trim() || !newUrl.trim()}>
                    Agregar
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => {
                      setShowAddForm(false);
                      resetNewLinkForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Links list */}
          {links.length === 0 ? (
            <div className='border-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center'>
              <LinkIcon className='text-muted-foreground/40 mb-3 size-10' />
              <p className='text-muted-foreground text-sm font-medium'>No hay links todavía</p>
              <p className='text-muted-foreground mt-1 text-xs'>Agrega links o importa tus redes sociales</p>
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              {links.map((link, index) => {
                const isEditing = editingId === link.id;
                return (
                  <div
                    key={link.id}
                    className={`bg-card flex flex-col gap-3 rounded-lg border p-3 transition-opacity ${!link.isActive && !isEditing ? 'opacity-50' : ''}`}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex flex-col gap-0.5'>
                        <button
                          onClick={() => move(index, -1)}
                          disabled={index === 0 || isPending || isEditing}
                          className='text-muted-foreground hover:text-foreground disabled:opacity-20'
                          aria-label='Mover arriba'
                        >
                          <ChevronUp className='size-3.5' />
                        </button>
                        <button
                          onClick={() => move(index, 1)}
                          disabled={index === links.length - 1 || isPending || isEditing}
                          className='text-muted-foreground hover:text-foreground disabled:opacity-20'
                          aria-label='Mover abajo'
                        >
                          <ChevronDown className='size-3.5' />
                        </button>
                      </div>
                      <div className='bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full'>
                        {link.iconImageUrl ? (
                          <Image
                            src={link.iconImageUrl}
                            alt=''
                            width={32}
                            height={32}
                            className='size-full object-cover'
                          />
                        ) : link.iconEmoji ? (
                          <span className='text-base leading-none'>{link.iconEmoji}</span>
                        ) : (
                          <LinkBrandIcon linkType={link.linkType as LinkType} className='size-4' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{link.title}</p>
                        <p className='text-muted-foreground truncate text-xs'>{link.url}</p>
                      </div>
                      <Badge variant='outline' className='hidden shrink-0 text-xs sm:flex'>
                        {LINK_TYPE_LABELS[link.linkType as LinkType] ?? link.linkType}
                      </Badge>
                      <div className='flex shrink-0 items-center gap-1'>
                        <button
                          onClick={() => (isEditing ? cancelEdit() : startEdit(link))}
                          disabled={isPending}
                          className={`${isEditing ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
                          aria-label={isEditing ? 'Cancelar edición' : 'Editar link'}
                        >
                          {isEditing ? <X className='size-4' /> : <Pencil className='size-4' />}
                        </button>
                        <button
                          onClick={() => handleToggle(link.id, link.isActive)}
                          disabled={isPending || isEditing}
                          className='text-muted-foreground hover:text-foreground'
                          aria-label={link.isActive ? 'Ocultar' : 'Mostrar'}
                        >
                          {link.isActive ? <Eye className='size-4' /> : <EyeOff className='size-4' />}
                        </button>
                        <a
                          href={link.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-muted-foreground hover:text-foreground'
                          aria-label='Abrir link'
                        >
                          <ExternalLink className='size-4' />
                        </a>
                        <button
                          onClick={() => handleDelete(link.id)}
                          disabled={isPending || isEditing}
                          className='text-muted-foreground hover:text-destructive'
                          aria-label='Eliminar link'
                        >
                          <Trash2 className='size-4' />
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className='bg-muted/40 mt-1 flex flex-col gap-3 rounded-md border p-3'>
                        <div className='flex flex-col gap-1.5'>
                          <Label className='text-xs'>Tipo</Label>
                          <Select value={editType} onValueChange={(v) => setEditType(v as LinkType)}>
                            <SelectTrigger className='h-8 text-xs'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LINK_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className='text-xs'>
                                  <span className='inline-flex items-center gap-2'>
                                    <LinkBrandIcon linkType={t} className='size-3.5' />
                                    {LINK_TYPE_LABELS[t]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <IconPicker
                          linkType={editType}
                          emoji={editEmoji}
                          imageUrl={editIconImageUrl}
                          onEmojiChange={setEditEmoji}
                          onImageUrlChange={setEditIconImageUrl}
                          disabled={isPending}
                        />
                        <div className='flex flex-col gap-1.5'>
                          <Label className='text-xs'>Título</Label>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                          {(() => {
                            const props = getUrlInputPropsForType(editType);
                            return (
                              <>
                                <Label className='text-xs'>{props.label}</Label>
                                <Input
                                  value={editUrl}
                                  onChange={(e) => {
                                    setEditUrl(e.target.value);
                                    if (editUrlError) setEditUrlError(null);
                                  }}
                                  placeholder={props.placeholder}
                                  className={`h-8 text-xs ${editUrlError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                                  type={props.inputType}
                                  aria-invalid={editUrlError ? true : undefined}
                                  aria-describedby={editUrlError ? `edit-url-error-${link.id}` : undefined}
                                />
                              </>
                            );
                          })()}
                          {editUrlError && (
                            <p id={`edit-url-error-${link.id}`} className='text-destructive text-[11px]'>
                              {editUrlError}
                            </p>
                          )}
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={() => handleSaveEdit(link.id)}
                            disabled={isPending || !editTitle.trim() || !editUrl.trim()}
                          >
                            <Check className='mr-1.5 size-3.5' />
                            Guardar
                          </Button>
                          <Button size='sm' variant='ghost' onClick={cancelEdit} disabled={isPending}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Storefront link preview */}
              {storefrontLinkEnabled && (
                <div className='bg-muted/30 flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-60'>
                  <Store className='text-muted-foreground size-4 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{storefrontLinkTitle}</p>
                    <p className='text-muted-foreground truncate text-xs'>/{businessSlug} — siempre visible</p>
                  </div>
                  <Badge variant='outline' className='shrink-0 text-xs'>
                    Fijo
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Settings ── */}
        <div className='flex flex-col gap-4'>
          {/* Toggle on mobile */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className='bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium lg:hidden'
          >
            <span className='flex items-center gap-2'>
              <Palette className='size-4' /> Personalización
            </span>
            {showSettings ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
          </button>

          <div className={`flex flex-col gap-4 ${!showSettings ? 'hidden lg:flex' : ''}`}>
            <div className='bg-card flex flex-col gap-4 rounded-lg border p-4'>
              <p className='flex items-center gap-2 text-sm font-semibold'>
                <Palette className='size-4' /> Personalización
              </p>

              {/* Active */}
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Página activa</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Separator />
              <SectionLabel>Perfil</SectionLabel>

              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={businessSlug}
                  className='h-8 text-xs'
                  maxLength={80}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Descripción</Label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='Una frase sobre tu negocio'
                  className='h-8 text-xs'
                  maxLength={200}
                />
              </div>

              <Separator />
              <SectionLabel>Link de tienda (fijo)</SectionLabel>

              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Mostrar link de tienda</Label>
                <Switch checked={storefrontLinkEnabled} onCheckedChange={setStorefrontLinkEnabled} />
              </div>
              {storefrontLinkEnabled && (
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Texto del botón</Label>
                  <Input
                    value={storefrontLinkTitle}
                    onChange={(e) => setStorefrontLinkTitle(e.target.value)}
                    placeholder='Ver nuestra tienda'
                    className='h-8 text-xs'
                    maxLength={60}
                  />
                </div>
              )}

              <Separator />
              <SectionLabel>Fondo</SectionLabel>

              <div className='flex items-center justify-between'>
                <Label className='text-xs'>Usar tema del storefront</Label>
                <Switch checked={useStorefrontTheme} onCheckedChange={setUseStorefrontTheme} />
              </div>

              {!useStorefrontTheme && (
                <>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs'>Tipo de fondo</Label>
                    <Select value={bgType} onValueChange={(v) => setBgType(v as BgType)}>
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='color' className='text-xs'>
                          Color sólido
                        </SelectItem>
                        <SelectItem value='gradient' className='text-xs'>
                          Degradado
                        </SelectItem>
                        <SelectItem value='image' className='text-xs'>
                          Imagen / foto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bgType === 'color' && <ColorRow label='Color de fondo' value={bgColor} onChange={setBgColor} />}

                  {bgType === 'gradient' && (
                    <div className='flex flex-col gap-1.5'>
                      <Label className='text-xs'>CSS del degradado</Label>
                      <Input
                        value={bgGradient}
                        onChange={(e) => setBgGradient(e.target.value)}
                        placeholder='linear-gradient(135deg, #000 0%, #1a1a2e 100%)'
                        className='h-8 font-mono text-xs'
                      />
                    </div>
                  )}

                  {bgType === 'image' && (
                    <>
                      <div className='flex flex-col gap-1.5'>
                        <Label className='text-xs'>URL de la imagen de fondo</Label>
                        <Input
                          value={bgImageUrl}
                          onChange={(e) => setBgImageUrl(e.target.value)}
                          placeholder='https://...'
                          className='h-8 text-xs'
                          type='url'
                        />
                      </div>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs'>Oscurecer imagen</Label>
                        <Switch checked={bgOverlay} onCheckedChange={setBgOverlay} />
                      </div>
                      {bgOverlay && (
                        <div className='flex flex-col gap-2'>
                          <ColorRow label='Color del overlay' value={bgOverlayColor} onChange={setBgOverlayColor} />
                          <div className='flex flex-col gap-1.5'>
                            <Label className='text-xs'>Opacidad: {bgOverlayOpacity}%</Label>
                            <input
                              type='range'
                              min={0}
                              max={100}
                              value={bgOverlayOpacity}
                              onChange={(e) => setBgOverlayOpacity(Number(e.target.value))}
                              className='accent-primary w-full'
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <Separator />
              <SectionLabel>Texto y tipografía</SectionLabel>

              <ColorRow label='Color del texto' value={textColor} onChange={setTextColor} />

              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Tipografía</Label>
                <Select value={font} onValueChange={(v) => setFont(v as FontValue)}>
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f} value={f} className='text-xs'>
                        {FONT_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <SectionLabel>Botones</SectionLabel>

              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Estilo</Label>
                <Select value={buttonStyle} onValueChange={(v) => setButtonStyle(v as ButtonStyleValue)}>
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_STYLES.map((s) => (
                      <SelectItem key={s} value={s} className='text-xs'>
                        {BUTTON_STYLE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isGradientBtn ? (
                <div className='flex flex-col gap-2'>
                  <ColorRow label='Color inicio' value={gradientFrom} onChange={setGradientFrom} />
                  <ColorRow label='Color fin' value={gradientTo} onChange={setGradientTo} />
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs'>Ángulo: {gradientAngle}°</Label>
                    <input
                      type='range'
                      min={0}
                      max={360}
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(Number(e.target.value))}
                      className='accent-primary w-full'
                    />
                  </div>
                </div>
              ) : (
                buttonStyle !== 'glass' &&
                buttonStyle !== 'link' && (
                  <ColorRow label='Color del botón' value={buttonColor} onChange={setButtonColor} />
                )
              )}

              {buttonStyle !== 'link' && (
                <ColorRow label='Color del texto' value={buttonTextColor} onChange={setButtonTextColor} />
              )}

              {buttonStyle !== 'pill-filled' && buttonStyle !== 'pill-outlined' && buttonStyle !== 'link' && (
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs'>Radio de esquinas: {buttonRadius}px</Label>
                  <input
                    type='range'
                    min={0}
                    max={999}
                    value={buttonRadius}
                    onChange={(e) => setButtonRadius(Number(e.target.value))}
                    className='accent-primary w-full'
                  />
                </div>
              )}

              <Button size='sm' onClick={handleSaveSettings} disabled={isPending} className='w-full'>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              {settingsError && <p className='text-destructive text-center text-xs'>{settingsError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
