'use client';

import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useState, useTransition } from 'react';
import { Sun, Moon, Save, Loader2, Monitor } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { updateUserPreferencesAction } from '@/modules/users/server/actions/update-user-preferences.action';

interface Business {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface PreferencesFormProps {
  preferences: {
    theme: string;
    sidebarCollapsed: boolean;
    defaultBusinessId: string | null;
  } | null;
  businesses: Business[];
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

export function PreferencesForm({ preferences, businesses }: PreferencesFormProps) {
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [theme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(
    (preferences?.theme as 'light' | 'dark' | 'system') ?? 'system'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(preferences?.sidebarCollapsed ?? false);
  const [defaultBusinessId, setDefaultBusinessId] = useState<string | null>(preferences?.defaultBusinessId ?? null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateUserPreferencesAction({
        theme,
        sidebarCollapsed,
        defaultBusinessId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setTheme(theme);
      toast.success('Preferencias guardadas correctamente');
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Theme */}
      <Card>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Apariencia</h3>
          <p className='text-muted-foreground text-sm'>Elige cómo se ve la interfaz.</p>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-3'>
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type='button'
                onClick={() => setLocalTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                  theme === value ? 'border-primary bg-primary/5' : 'bg-muted/50 hover:bg-muted border-transparent'
                )}
              >
                <Icon className={cn('size-6', theme === value ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', theme === value ? 'text-primary' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <Card>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Sidebar</h3>
          <p className='text-muted-foreground text-sm'>Configura el comportamiento del menú lateral.</p>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium'>Sidebar colapsado por defecto</p>
              <p className='text-muted-foreground text-xs'>Inicia con el sidebar minimizado al entrar al dashboard.</p>
            </div>
            <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </div>
        </CardContent>
      </Card>

      {/* Default business */}
      {businesses.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className='text-lg font-semibold'>Negocio por defecto</h3>
            <p className='text-muted-foreground text-sm'>
              Selecciona el negocio que se cargará automáticamente al iniciar sesión.
            </p>
          </CardHeader>
          <CardContent>
            <Select
              value={defaultBusinessId ?? 'none'}
              onValueChange={(v) => setDefaultBusinessId(v === 'none' ? null : v)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Ninguno' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Ninguno (seleccionar manualmente)</SelectItem>
                {businesses.map((biz) => (
                  <SelectItem key={biz.id} value={biz.id}>
                    {biz.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className='flex justify-end'>
        <Button type='submit' disabled={isPending}>
          {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Save className='mr-2 size-4' />}
          Guardar preferencias
        </Button>
      </div>
    </form>
  );
}
