'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Globe, Upload, Trash2, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { updateUserProfileAction } from '@/modules/users/server/actions/update-user-profile.action';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { updateProfileSchema, type UpdateProfileFormValues } from '@/modules/users/ui/schemas/user.schemas';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  providers: string[];
}

const LOCALE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

export function ProfileForm({ user, providers }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name ?? '',
      phone: user.phone ?? '',
      timezone: user.timezone ?? 'America/Santo_Domingo',
      locale: (user.locale as 'es' | 'en' | 'pt') ?? 'es',
      avatarUrl: user.avatarUrl ?? '',
    },
  });

  const onSubmit = (values: UpdateProfileFormValues) => {
    startTransition(async () => {
      const result = await updateUserProfileAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Perfil actualizado correctamente');
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <h3 className='text-lg font-semibold'>Información personal</h3>
        <p className='text-muted-foreground text-sm'>Actualiza tu información de perfil.</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Avatar */}
            <FormField
              control={form.control}
              name='avatarUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto de perfil</FormLabel>
                  <FormControl>
                    <AvatarUpload
                      value={field.value ?? ''}
                      fallbackImage={user.image}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <User className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='Tu nombre' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (readonly) */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Email</label>
              <Input value={user.email} disabled className='bg-muted' />
              <div className='flex items-center gap-2'>
                {providers.map((p) => (
                  <Badge key={p} variant='secondary' className='text-xs capitalize'>
                    {p}
                  </Badge>
                ))}
                <Badge variant='outline' className='text-xs'>
                  Verificado
                </Badge>
              </div>
            </div>

            {/* Phone */}
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Phone className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='+1 809 000 0000' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              {/* Timezone */}
              <FormField
                control={form.control}
                name='timezone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona horaria</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Globe className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          className='border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border py-1 pr-8 pl-10 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          {Intl.supportedValuesOf('timeZone').map((tz) => (
                            <option key={tz} value={tz}>
                              {tz.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormControl>
                    <FormDescription>Tu zona horaria local.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Locale */}
              <FormField
                control={form.control}
                name='locale'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCALE_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>El idioma de la interfaz del dashboard.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end pt-2'>
              <Button type='submit' disabled={isPending}>
                {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/* ─── Avatar Upload ─── */

function AvatarUpload({
  value,
  fallbackImage,
  onChange,
  disabled,
}: {
  value: string;
  fallbackImage: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const displayUrl = value || fallbackImage;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='flex items-center gap-4'>
      {displayUrl ? (
        <div className='relative size-16 overflow-hidden rounded-full border'>
          <Image src={displayUrl} alt='Avatar' fill className='object-cover' />
        </div>
      ) : (
        <div className='bg-muted flex size-16 items-center justify-center rounded-full border'>
          <User className='text-muted-foreground size-6' />
        </div>
      )}
      <div className='flex gap-2'>
        <label className='hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm transition-colors'>
          {uploading ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
          {uploading ? 'Subiendo...' : 'Cambiar foto'}
          <input
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleUpload}
            disabled={disabled || uploading}
          />
        </label>
        {value && (
          <Button type='button' variant='outline' size='sm' onClick={() => onChange('')} disabled={disabled}>
            <Trash2 className='size-3.5' />
          </Button>
        )}
      </div>
    </div>
  );
}
