'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Info, Star, PackageCheck, ShoppingCart, AlertTriangle, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/modules/notifications/server/actions/notification.actions';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type NotificationType = 'new_order' | 'order_status' | 'low_stock' | 'new_review' | 'system';

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  new_order: ShoppingCart,
  order_status: PackageCheck,
  low_stock: AlertTriangle,
  new_review: Star,
  system: Info,
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

const POLL_INTERVAL = 30_000;

export function NotificationsMenu() {
  const [items, setItems] = useState<
    {
      id: string;
      type: NotificationType;
      title: string;
      description: string | null;
      read: boolean;
      createdAt: Date;
      href: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(20);
      setItems(data as typeof items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const handleClick = async (notification: (typeof items)[0]) => {
    if (!notification.read) {
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      await markNotificationRead(notification.id);
    }
    if (notification.href) {
      window.location.href = notification.href;
    }
  };

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
            <button onClick={handleMarkAllRead} className='text-primary text-xs font-normal hover:underline'>
              Marcar todas como leídas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading && <div className='text-muted-foreground py-6 text-center text-xs'>Cargando...</div>}

        {!loading && items.length === 0 && (
          <div className='text-muted-foreground py-6 text-center text-xs'>No tienes notificaciones</div>
        )}

        {items.map((n) => {
          const Icon = ICON_MAP[n.type] || Info;
          const unread = !n.read;
          return (
            <DropdownMenuItem
              key={n.id}
              className='flex cursor-pointer items-start gap-3 py-3'
              onClick={() => handleClick(n)}
            >
              <div
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-primary/10' : 'bg-muted'}`}
              >
                <Icon className={`size-4 ${unread ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className='flex-1 space-y-0.5'>
                <p className={`text-sm leading-snug ${unread ? 'font-medium' : 'text-muted-foreground font-normal'}`}>
                  {n.title}
                </p>
                {n.description && <p className='text-muted-foreground text-xs'>{n.description}</p>}
                <p className='text-muted-foreground text-xs'>{timeAgo(n.createdAt)}</p>
              </div>
              {unread && <span className='bg-primary mt-2 size-2 shrink-0 rounded-full' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
