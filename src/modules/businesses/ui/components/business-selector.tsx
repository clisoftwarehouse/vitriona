'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Store, Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBusinesses } from '@/modules/businesses/ui/hooks/use-businesses';
import { setActiveBusinessAction } from '@/modules/businesses/server/actions/set-active-business.action';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface SidebarBusiness {
  id: string;
  name: string;
  slug: string;
}

interface BusinessSelectorProps {
  initialBusinesses: SidebarBusiness[];
  activeBusinessId: string | null;
}

export function BusinessSelector({ initialBusinesses, activeBusinessId }: BusinessSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [currentId, setCurrentId] = useState(activeBusinessId);

  const { data: queryBusinesses } = useBusinesses();
  const businesses: SidebarBusiness[] = (queryBusinesses ?? initialBusinesses).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));

  const activeBusiness = businesses.find((b) => b.id === currentId) ?? businesses[0];

  const handleSelect = (businessId: string) => {
    if (businessId === currentId) return;
    setCurrentId(businessId);
    startTransition(async () => {
      await setActiveBusinessAction(businessId);

      // If user is on a business-scoped page, navigate to the equivalent page in the new business
      const businessPattern = /\/dashboard\/businesses\/[^/]+(\/.*)?/;
      const match = pathname.match(businessPattern);
      if (match) {
        const suffix = match[1] ?? '';
        // Strip catalog-specific segments (catalogs/[id]/...) keeping only the top-level section
        const topSection = suffix.match(/^\/(catalogs|categories|products|orders|inventory)/)?.[0] ?? '';
        router.push(`/dashboard/businesses/${businessId}${topSection}`);
      } else {
        router.refresh();
      }
    });
  };

  if (businesses.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            'border-sidebar-border w-full justify-between gap-2 border px-3 py-2 text-left',
            isPending && 'opacity-70'
          )}
          disabled={isPending}
        >
          <span className='flex items-center gap-2 truncate'>
            <Store className='text-muted-foreground size-4 shrink-0' />
            <span className='truncate text-sm font-medium'>{activeBusiness?.name ?? 'Seleccionar'}</span>
          </span>
          <ChevronsUpDown className='text-muted-foreground size-3.5 shrink-0' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='start' className='w-(--radix-dropdown-menu-trigger-width)'>
        <DropdownMenuLabel className='text-xs'>Mis negocios</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map((business) => (
          <DropdownMenuItem key={business.id} onClick={() => handleSelect(business.id)} className='gap-2'>
            <Check className={cn('size-3.5', currentId === business.id ? 'opacity-100' : 'opacity-0')} />
            <span className='truncate'>{business.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
