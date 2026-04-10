'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { AppSidebar } from './app-sidebar';
import { DashboardTour } from './dashboard-tour';
import { DashboardTopbar } from './dashboard-topbar';
import type { SidebarBusiness } from '@/modules/businesses/ui/components/business-selector';

interface ShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardShellProps {
  user: ShellUser;
  businesses: SidebarBusiness[];
  activeBusinessId: string | null;
  initialSidebarCollapsed?: boolean;
  exchangeRates?: { eur: number | null; usd: number | null };
  children: React.ReactNode;
}

export function AdminLayout({
  user,
  businesses,
  activeBusinessId,
  initialSidebarCollapsed = false,
  exchangeRates,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0] ?? null;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className='fixed inset-0 flex overflow-hidden'>
      <DashboardTour />
      {sidebarOpen && (
        <div className='fixed inset-0 z-40 bg-black/50 md:hidden' onClick={closeSidebar} aria-hidden='true' />
      )}

      <div className={cn('md:relative md:flex', sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden md:flex')}>
        <AppSidebar
          onClose={closeSidebar}
          businesses={businesses}
          activeBusinessId={activeBusinessId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <DashboardTopbar
          user={user}
          activeBusinessId={activeBusiness?.id ?? null}
          activeBusinessSlug={activeBusiness?.slug ?? null}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          exchangeRates={exchangeRates}
        />
        <main className='bg-muted/50 flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
      </div>
    </div>
  );
}
