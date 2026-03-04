'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Paintbrush, ChevronRight, ExternalLink, LayoutDashboard } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Configuración de tema', href: '/dashboard/theme', icon: Paintbrush },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const pathname = usePathname();

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

      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        <p className='text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase'>Manage</p>
        <ul className='space-y-0.5'>
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
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
          })}
        </ul>
      </nav>

      <div className='border-sidebar-border border-t p-3'>
        <Button variant='default' size='sm' className='w-full gap-2' asChild>
          <Link href='#' target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='size-3.5' />
            Ver tienda
          </Link>
        </Button>
      </div>
    </aside>
  );
}
