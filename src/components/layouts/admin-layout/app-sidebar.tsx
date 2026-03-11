'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Tags,
  Store,
  Package,
  BookOpen,
  Settings,
  Paintbrush,
  ShoppingCart,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CatalogSelector, type SidebarCatalog } from './catalog-selector';

interface AppSidebarProps {
  onClose?: () => void;
  catalogs: SidebarCatalog[];
  activeCatalogId: string | null;
}

export function AppSidebar({ onClose, catalogs, activeCatalogId }: AppSidebarProps) {
  const pathname = usePathname();

  const activeCatalog = catalogs.find((c) => c.id === activeCatalogId) ?? catalogs[0] ?? null;

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Negocios', href: '/dashboard/businesses', icon: Store },
    { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  const catalogNavItems = activeCatalog
    ? [
        {
          label: 'Catálogo',
          href: `/dashboard/businesses/${activeCatalog.businessId}/catalogs/${activeCatalog.id}`,
          icon: BookOpen,
        },
        {
          label: 'Categorías',
          href: `/dashboard/businesses/${activeCatalog.businessId}/catalogs/${activeCatalog.id}/categories`,
          icon: Tags,
        },
        {
          label: 'Productos',
          href: `/dashboard/businesses/${activeCatalog.businessId}/catalogs/${activeCatalog.id}/products`,
          icon: Package,
        },
        {
          label: 'Pedidos',
          href: `/dashboard/businesses/${activeCatalog.businessId}/orders`,
          icon: ShoppingCart,
        },
        {
          label: 'Site Builder',
          href: `/dashboard/businesses/${activeCatalog.businessId}/catalogs/${activeCatalog.id}/builder`,
          icon: Paintbrush,
        },
      ]
    : [];

  const allItems = [...mainNavItems, ...catalogNavItems];
  const activeHref = allItems
    .filter(({ href }) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const renderNavItem = ({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) => {
    const isActive = href === activeHref;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onClose}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary/10 text-primary shadow-xs'
              : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
          )}
        >
          <span className='flex items-center gap-2.5'>
            <Icon className='size-4 shrink-0' />
            {label}
          </span>
          {isActive && <ChevronRight className='size-3.5 opacity-50' />}
        </Link>
      </li>
    );
  };

  return (
    <aside className='bg-sidebar border-sidebar-border flex h-full w-72 shrink-0 flex-col border-r md:w-56'>
      <div className='border-sidebar-border flex items-center justify-between border-b px-4 py-4'>
        <div className='flex items-center gap-2.5'>
          <div className='bg-primary flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <span className='text-primary-foreground text-sm font-bold'>V</span>
          </div>
          <span className='text-sidebar-foreground text-sm font-semibold'>Vitriona</span>
        </div>
        <button
          onClick={onClose}
          className='text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors md:hidden'
          aria-label='Cerrar menú'
        >
          <X className='size-4' />
        </button>
      </div>

      {catalogs.length > 0 && (
        <div className='border-sidebar-border border-b px-3 py-3'>
          <CatalogSelector catalogs={catalogs} activeCatalogId={activeCatalogId} />
        </div>
      )}

      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        <p className='text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>General</p>
        <ul className='space-y-0.5'>{mainNavItems.map(renderNavItem)}</ul>

        {catalogNavItems.length > 0 && (
          <>
            <p className='text-muted-foreground mt-5 mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>
              Catálogo
            </p>
            <ul className='space-y-0.5'>{catalogNavItems.map(renderNavItem)}</ul>
          </>
        )}
      </nav>

      {activeCatalog && (
        <div className='border-sidebar-border border-t p-3'>
          <Button variant='default' size='sm' className='w-full gap-2' asChild>
            <Link href={`/${activeCatalog.businessSlug}`} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='size-3.5' />
              Ver tienda
            </Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
