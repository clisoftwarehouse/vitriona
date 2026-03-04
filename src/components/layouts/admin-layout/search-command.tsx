'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Paintbrush, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandDialog,
} from '@/components/ui/command';

const COMMANDS = [
  {
    group: 'Navegación',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
      { icon: Paintbrush, label: 'Configuración de tema', href: '/dashboard/theme' },
    ],
  },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Mobile: icon only */}
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={() => setOpen(true)}
        className='text-muted-foreground md:hidden'
        aria-label='Buscar'
      >
        <Search className='size-4' />
      </Button>

      {/* Desktop: full button */}
      <Button
        variant='outline'
        onClick={() => setOpen(true)}
        className='text-muted-foreground relative hidden h-8 w-44 justify-start gap-2 rounded-lg text-sm font-normal shadow-none md:flex'
      >
        <Search className='size-3.5 shrink-0' />
        <span>Buscar...</span>
        <kbd className='bg-muted border-border pointer-events-none ml-auto flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none'>
          <span>⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Buscar en el dashboard...' />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          {COMMANDS.map(({ group, items }) => (
            <CommandGroup key={group} heading={group}>
              {items.map(({ icon: Icon, label, href }) => (
                <CommandItem key={href} onSelect={() => runCommand(href)}>
                  <Icon className='mr-2 size-4' />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
