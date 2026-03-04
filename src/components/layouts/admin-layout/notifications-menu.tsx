'use client';

import { useState } from 'react';
import { Bell, Star, TrendingUp, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    icon: ShoppingCart,
    title: 'Nueva orden recibida',
    description: 'Alex Morgan realizó un pedido por $129.00',
    time: 'hace 5 min',
    unread: true,
  },
  {
    id: 2,
    icon: TrendingUp,
    title: 'Meta de ventas alcanzada',
    description: 'Alcanzaste el 80% de la meta mensual',
    time: 'hace 1 h',
    unread: true,
  },
  {
    id: 3,
    icon: Star,
    title: 'Nueva reseña de producto',
    description: 'Un cliente dejó 5 estrellas en "Lámpara Minimalista"',
    time: 'hace 3 h',
    unread: false,
  },
];

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon-sm' className='text-muted-foreground relative'>
          <Bell className='size-4' />
          {unreadCount > 0 && (
            <span className='bg-primary text-primary-foreground absolute top-1 right-1 flex size-3 items-center justify-center rounded-full text-[8px] font-bold'>
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80 max-w-[calc(100vw-1rem)]'>
        <DropdownMenuLabel className='flex items-center justify-between py-2'>
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className='text-primary text-xs font-normal hover:underline'>
              Marcar todas como leídas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.map(({ id, icon: Icon, title, description, time, unread }) => (
          <DropdownMenuItem key={id} className='flex cursor-pointer items-start gap-3 py-3'>
            <div
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-primary/10' : 'bg-muted'}`}
            >
              <Icon className={`size-4 ${unread ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className='flex-1 space-y-0.5'>
              <p className={`text-sm leading-snug ${unread ? 'font-medium' : 'text-muted-foreground font-normal'}`}>
                {title}
              </p>
              <p className='text-muted-foreground text-xs'>{description}</p>
              <p className='text-muted-foreground text-xs'>{time}</p>
            </div>
            {unread && <span className='bg-primary mt-2 size-2 shrink-0 rounded-full' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
