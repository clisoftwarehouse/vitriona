'use client';

import { Menu } from 'lucide-react';

import { UserMenu } from './user-menu';
import { Button } from '@/components/ui/button';
import { SearchCommand } from './search-command';
import { NotificationsMenu } from './notifications-menu';

interface TopbarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardTopbarProps {
  user?: TopbarUser;
  onMenuClick?: () => void;
}

export function DashboardTopbar({ user, onMenuClick }: DashboardTopbarProps) {
  return (
    <header className='bg-background flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 py-8 md:px-6'>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon-sm'
          className='text-muted-foreground md:hidden'
          onClick={onMenuClick}
          aria-label='Abrir menú'
        >
          <Menu className='size-5' />
        </Button>
        <h1 className='text-sm font-semibold'>Dashboard</h1>
      </div>

      <div className='flex items-center gap-1.5'>
        <SearchCommand />
        <NotificationsMenu />
        <div className='border-border ml-1 flex items-center border-l pl-3'>
          <UserMenu name={user?.name} email={user?.email} image={user?.image} />
        </div>
      </div>
    </header>
  );
}
