'use client';

import { useMemo, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

function getIsMac() {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform?.toUpperCase().includes('MAC') || navigator.userAgent?.includes('Mac');
}

export function useIsMac() {
  return useSyncExternalStore(emptySubscribe, getIsMac, () => false);
}

export function useModifierKey() {
  const isMac = useIsMac();
  return useMemo(() => (isMac ? '⌘' : 'Ctrl'), [isMac]);
}
