'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { AppSidebar } from './app-sidebar';
import { DashboardTopbar } from './dashboard-topbar';

interface SidebarBusiness {
  id: string;
  name: string;
  slug: string;
}

interface ShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardShellProps {
  user: ShellUser;
  businesses: SidebarBusiness[];
  activeBusinessId: string | null;
  children: React.ReactNode;
}

export function AdminLayout({ user, businesses, activeBusinessId, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className='flex h-dvh overflow-hidden'>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className='fixed inset-0 z-40 bg-black/50 md:hidden' onClick={closeSidebar} aria-hidden='true' />
      )}

      {/* Sidebar wrapper — fixed drawer on mobile, relative on desktop */}
      <div className={cn('md:relative md:flex', sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden md:flex')}>
        <AppSidebar onClose={closeSidebar} businesses={businesses} activeBusinessId={activeBusinessId} />
      </div>

      {/* Main area */}
      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <DashboardTopbar user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className='bg-muted/50 flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
      </div>
    </div>
  );
}
