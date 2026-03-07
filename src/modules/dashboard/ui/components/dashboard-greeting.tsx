'use client';

import { useSyncExternalStore } from 'react';

interface DashboardGreetingProps {
  firstName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

const emptySubscribe = () => () => {};

export function DashboardGreeting({ firstName }: DashboardGreetingProps) {
  const greeting = useSyncExternalStore(emptySubscribe, getGreeting, () => 'Hola');

  return (
    <div>
      <h2 className='text-xl font-semibold tracking-tight'>
        {greeting}, {firstName}
      </h2>
      <p className='text-muted-foreground mt-0.5 text-sm'>Esto es lo que está pasando con tu tienda hoy.</p>
    </div>
  );
}
