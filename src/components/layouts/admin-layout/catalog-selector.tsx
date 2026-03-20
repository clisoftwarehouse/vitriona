'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Check, BookOpen, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { setActiveCatalogAction } from '@/modules/catalogs/server/actions/set-active-catalog.action';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface SidebarCatalog {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
}

interface CatalogSelectorProps {
  catalogs: SidebarCatalog[];
  activeCatalogId: string | null;
}

export function CatalogSelector({ catalogs, activeCatalogId }: CatalogSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [currentId, setCurrentId] = useState(activeCatalogId);

  const activeCatalog = catalogs.find((c) => c.id === currentId) ?? catalogs[0];

  const handleSelect = (catalogId: string) => {
    if (catalogId === currentId) return;
    const newCatalog = catalogs.find((c) => c.id === catalogId);
    if (!newCatalog) return;

    setCurrentId(catalogId);
    startTransition(async () => {
      await setActiveCatalogAction(catalogId);

      // If user is on a catalog-scoped page, navigate to the equivalent page in the new catalog
      const catalogPattern = /\/dashboard\/businesses\/[^/]+\/catalogs\/[^/]+/;
      const match = pathname.match(catalogPattern);
      if (match) {
        const suffix = pathname.slice(match[0].length);
        const newPath = `/dashboard/businesses/${newCatalog.businessId}/catalogs/${catalogId}${suffix}`;
        router.push(newPath);
      } else {
        router.refresh();
      }
    });
  };

  if (catalogs.length === 0) return null;

  // Group catalogs by business
  const grouped = catalogs.reduce<Record<string, SidebarCatalog[]>>((acc, catalog) => {
    if (!acc[catalog.businessName]) acc[catalog.businessName] = [];
    acc[catalog.businessName].push(catalog);
    return acc;
  }, {});

  const businessNames = Object.keys(grouped);

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
          <span className='flex min-w-0 flex-col'>
            <span className='truncate text-sm font-medium'>{activeCatalog?.name ?? 'Seleccionar'}</span>
            {activeCatalog && (
              <span className='text-muted-foreground truncate text-[11px]'>{activeCatalog.businessName}</span>
            )}
          </span>
          <ChevronsUpDown className='text-muted-foreground size-3.5 shrink-0' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='start' className='w-(--radix-dropdown-menu-trigger-width)'>
        {businessNames.map((businessName, idx) => (
          <div key={businessName}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className='text-xs'>{businessName}</DropdownMenuLabel>
            <DropdownMenuGroup>
              {grouped[businessName].map((catalog) => (
                <DropdownMenuItem key={catalog.id} onClick={() => handleSelect(catalog.id)} className='gap-2'>
                  <Check className={cn('size-3.5', currentId === catalog.id ? 'opacity-100' : 'opacity-0')} />
                  <BookOpen className='text-muted-foreground size-3.5' />
                  <span className='truncate'>{catalog.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
