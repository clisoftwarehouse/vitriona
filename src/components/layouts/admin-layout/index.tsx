'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { AppSidebar } from './app-sidebar';
import { DashboardTopbar } from './dashboard-topbar';
import type { SidebarCatalog } from './catalog-selector';

interface ShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardShellProps {
  user: ShellUser;
  catalogs: SidebarCatalog[];
  activeCatalogId: string | null;
  children: React.ReactNode;
}

export function AdminLayout({ user, catalogs, activeCatalogId, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className='fixed inset-0 flex overflow-hidden'>
      {sidebarOpen && (
        <div className='fixed inset-0 z-40 bg-black/50 md:hidden' onClick={closeSidebar} aria-hidden='true' />
      )}

      <div className={cn('md:relative md:flex', sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden md:flex')}>
        <AppSidebar onClose={closeSidebar} catalogs={catalogs} activeCatalogId={activeCatalogId} />
      </div>

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <DashboardTopbar user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className='bg-muted/50 flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
      </div>
    </div>
  );
}
