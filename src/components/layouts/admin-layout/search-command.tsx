'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import {
  Tags,
  Stamp,
  Store,
  Search,
  Package,
  BookOpen,
  Settings,
  Warehouse,
  Paintbrush,
  CreditCard,
  ShoppingCart,
  ExternalLink,
  MessageSquare,
  TicketPercent,
  LayoutDashboard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useModifierKey } from '@/hooks/use-os';
import {
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandDialog,
} from '@/components/ui/command';

interface SearchCommandProps {
  activeBusinessId?: string | null;
  activeBusinessSlug?: string | null;
}

export function SearchCommand({ activeBusinessId, activeBusinessSlug }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const modKey = useModifierKey();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const commands = useMemo(() => {
    const groups: { group: string; items: { icon: React.ElementType; label: string; href: string }[] }[] = [
      {
        group: 'General',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
          { icon: Store, label: 'Negocios', href: '/dashboard/businesses' },
          { icon: Settings, label: 'Configuración', href: '/dashboard/settings' },
        ],
      },
    ];

    if (activeBusinessId) {
      const base = `/dashboard/businesses/${activeBusinessId}`;
      groups.push({
        group: 'Negocio activo',
        items: [
          { icon: BookOpen, label: 'Catálogos', href: `${base}/catalogs` },
          { icon: Tags, label: 'Categorías', href: `${base}/categories` },
          { icon: Stamp, label: 'Marcas', href: `${base}/brands` },
          { icon: Package, label: 'Productos', href: `${base}/products` },
          { icon: ShoppingCart, label: 'Pedidos', href: `${base}/orders` },
          { icon: Warehouse, label: 'Inventario', href: `${base}/inventory` },
          { icon: MessageSquare, label: 'Reseñas', href: `${base}/reviews` },
          { icon: TicketPercent, label: 'Cupones', href: `${base}/coupons` },
          { icon: CreditCard, label: 'Métodos de pago', href: `${base}/payment-methods` },
          { icon: Paintbrush, label: 'Site Builder', href: `${base}/builder` },
        ],
      });
    }

    if (activeBusinessSlug) {
      groups.push({
        group: 'Acciones',
        items: [{ icon: ExternalLink, label: 'Ver tienda', href: `/${activeBusinessSlug}` }],
      });
    }

    return groups;
  }, [activeBusinessId, activeBusinessSlug]);

  const runCommand = (href: string) => {
    setOpen(false);
    if (href.startsWith('/dashboard')) {
      router.push(href);
    } else {
      window.open(href, '_blank');
    }
  };

  return (
    <>
      {/* Mobile: icon only */}
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={() => setOpen(true)}
        className='text-muted-foreground md:hidden'
        aria-label='Buscar'
      >
        <Search className='size-4' />
      </Button>

      {/* Desktop: full button */}
      <Button
        variant='outline'
        onClick={() => setOpen(true)}
        className='text-muted-foreground relative hidden h-8 w-44 justify-start gap-2 rounded-lg text-sm font-normal shadow-none md:flex'
      >
        <Search className='size-3.5 shrink-0' />
        <span>Buscar...</span>
        <kbd className='bg-muted border-border pointer-events-none ml-auto flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none'>
          <span>{modKey}</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Buscar en el dashboard...' />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          {commands.map(({ group, items }) => (
            <CommandGroup key={group} heading={group}>
              {items.map(({ icon: Icon, label, href }) => (
                <CommandItem key={href} onSelect={() => runCommand(href)}>
                  <Icon className='mr-2 size-4' />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
