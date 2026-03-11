'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { Sun, Moon, User, LogOut } from 'lucide-react';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='flex cursor-pointer items-center gap-2 outline-none'>
          <Avatar className='size-7'>
            <AvatarImage src={image ?? undefined} alt={name ?? 'Usuario'} />
            <AvatarFallback className='text-[10px]'>{initials}</AvatarFallback>
          </Avatar>
          <span className='hidden text-sm font-medium sm:inline'>{name ?? 'Usuario'}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-sm leading-none font-medium'>{name ?? 'Usuario'}</p>
            {email && <p className='text-muted-foreground text-xs leading-none'>{email}</p>}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href='/dashboard/settings'>
            <User className='size-4' />
            Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          {resolvedTheme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
          {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          <LogOut className='size-4' />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
