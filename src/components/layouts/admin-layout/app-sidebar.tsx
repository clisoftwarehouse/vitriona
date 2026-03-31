'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Tags,
  Stamp,
  Store,
  Truck,
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
  PanelLeftClose,
  LayoutDashboard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BusinessSelector, type SidebarBusiness } from '@/modules/businesses/ui/components/business-selector';

interface AppSidebarProps {
  onClose?: () => void;
  businesses: SidebarBusiness[];
  activeBusinessId: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({
  onClose,
  businesses,
  activeBusinessId,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
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
          label: 'Métodos de entrega',
          href: `/dashboard/businesses/${activeBusiness.id}/delivery-methods`,
          icon: Truck,
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

    const linkContent = (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center rounded-lg transition-colors',
          collapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2',
          isActive
            ? 'bg-primary/10 text-primary shadow-xs'
            : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
        )}
      >
        <span className={cn('flex items-center', collapsed ? '' : 'gap-2.5')}>
          <Icon className='size-4 shrink-0' />
          {!collapsed && <span className='text-sm font-medium'>{label}</span>}
        </span>
        {isActive && !collapsed && <ChevronRight className='size-3.5 opacity-50' />}
      </Link>
    );

    if (collapsed) {
      return (
        <li key={href}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side='right' sideOffset={8}>
                {label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>
      );
    }

    return <li key={href}>{linkContent}</li>;
  };

  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border flex h-full shrink-0 flex-col border-r transition-all duration-200',
        collapsed ? 'w-15' : 'w-72 md:w-56'
      )}
    >
      <div className='border-sidebar-border flex items-center justify-between border-b px-4 py-3.5'>
        {collapsed ? (
          <Link href='/' className='bg-primary mx-auto flex size-7 items-center justify-center rounded-md'>
            <span className='text-sm font-bold text-white'>V</span>
          </Link>
        ) : (
          <Link href='/' className='flex w-full items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/images/vitriona-logo-dark.png' className='hidden h-9 w-auto dark:block' alt='Vitriona' />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/images/vitriona-logo-light.png' className='block h-9 w-auto dark:hidden' alt='Vitriona' />
          </Link>
        )}
        <button
          onClick={onClose}
          className='text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors md:hidden'
          aria-label='Cerrar menú'
        >
          <X className='size-4' />
        </button>
      </div>

      {businesses.length > 0 && !collapsed && (
        <div className='border-sidebar-border border-b px-3 py-3'>
          <BusinessSelector initialBusinesses={businesses} activeBusinessId={activeBusinessId} />
        </div>
      )}

      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-1.5' : 'px-3')}>
        {!collapsed && (
          <p className='text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>General</p>
        )}
        <ul className='space-y-0.5'>{mainNavItems.map(renderNavItem)}</ul>

        {businessNavItems.length > 0 && (
          <>
            {!collapsed && (
              <p className='text-muted-foreground mt-5 mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>
                {activeBusiness?.name ?? 'Negocio'}
              </p>
            )}
            {collapsed && <Separator className='my-3' />}
            <ul className='space-y-0.5'>{businessNavItems.map(renderNavItem)}</ul>
          </>
        )}
      </nav>

      {activeBusiness && (
        <div className='border-sidebar-border border-t p-3'>
          {collapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant='default' size='icon' className='mx-auto flex size-8' asChild>
                    <Link href={`/${activeBusiness.slug}`} target='_blank' rel='noopener noreferrer'>
                      <ExternalLink className='size-3.5' />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='right'>Ver tienda</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button variant='default' size='sm' className='w-full gap-2' asChild>
              <Link href={`/${activeBusiness.slug}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='size-3.5' />
                Ver tienda
              </Link>
            </Button>
          )}
        </div>
      )}

      {onToggleCollapse && (
        <div className='border-sidebar-border hidden border-t p-2 md:block'>
          <button
            onClick={onToggleCollapse}
            className='text-muted-foreground hover:text-foreground hover:bg-muted flex w-full items-center justify-center rounded-md p-1.5 transition-colors'
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <PanelLeftClose className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
      )}
    </aside>
  );
}
