'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Tags,
  Stamp,
  Store,
  Package,
  BookOpen,
  Settings,
  Warehouse,
  Paintbrush,
  CreditCard,
  ShoppingCart,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  TicketPercent,
  LayoutDashboard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BusinessSelector, type SidebarBusiness } from '@/modules/businesses/ui/components/business-selector';

interface AppSidebarProps {
  onClose?: () => void;
  businesses: SidebarBusiness[];
  activeBusinessId: string | null;
}

export function AppSidebar({ onClose, businesses, activeBusinessId }: AppSidebarProps) {
  const pathname = usePathname();

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0] ?? null;

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Negocios', href: '/dashboard/businesses', icon: Store },
    { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  const businessNavItems = activeBusiness
    ? [
        {
          label: 'Catálogos',
          href: `/dashboard/businesses/${activeBusiness.id}/catalogs`,
          icon: BookOpen,
        },
        {
          label: 'Categorías',
          href: `/dashboard/businesses/${activeBusiness.id}/categories`,
          icon: Tags,
        },
        {
          label: 'Marcas',
          href: `/dashboard/businesses/${activeBusiness.id}/brands`,
          icon: Stamp,
        },
        {
          label: 'Productos',
          href: `/dashboard/businesses/${activeBusiness.id}/products`,
          icon: Package,
        },
        {
          label: 'Pedidos',
          href: `/dashboard/businesses/${activeBusiness.id}/orders`,
          icon: ShoppingCart,
        },
        {
          label: 'Inventario',
          href: `/dashboard/businesses/${activeBusiness.id}/inventory`,
          icon: Warehouse,
        },
        {
          label: 'Reseñas',
          href: `/dashboard/businesses/${activeBusiness.id}/reviews`,
          icon: MessageSquare,
        },
        {
          label: 'Cupones',
          href: `/dashboard/businesses/${activeBusiness.id}/coupons`,
          icon: TicketPercent,
        },
        {
          label: 'Métodos de pago',
          href: `/dashboard/businesses/${activeBusiness.id}/payment-methods`,
          icon: CreditCard,
        },
        {
          label: 'Site Builder',
          href: `/dashboard/businesses/${activeBusiness.id}/builder`,
          icon: Paintbrush,
        },
      ]
    : [];

  const allItems = [...mainNavItems, ...businessNavItems];
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

      {businesses.length > 0 && (
        <div className='border-sidebar-border border-b px-3 py-3'>
          <BusinessSelector initialBusinesses={businesses} activeBusinessId={activeBusinessId} />
        </div>
      )}

      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        <p className='text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>General</p>
        <ul className='space-y-0.5'>{mainNavItems.map(renderNavItem)}</ul>

        {businessNavItems.length > 0 && (
          <>
            <p className='text-muted-foreground mt-5 mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>
              {activeBusiness?.name ?? 'Negocio'}
            </p>
            <ul className='space-y-0.5'>{businessNavItems.map(renderNavItem)}</ul>
          </>
        )}
      </nav>

      {activeBusiness && (
        <div className='border-sidebar-border border-t p-3'>
          <Button variant='default' size='sm' className='w-full gap-2' asChild>
            <Link href={`/${activeBusiness.slug}`} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='size-3.5' />
              Ver tienda
            </Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
