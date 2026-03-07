'use client';

import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'react';

const ChatWidget = dynamic(() => import('./floating-chat'), { ssr: false });

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ChatWidgetLoader({ businessId }: { businessId: string }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!mounted) return null;
  return createPortal(<ChatWidget businessId={businessId} />, document.body);
}
