'use client';

import { type ReactNode, type SyntheticEvent, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

const DETAILS_STORAGE_EVENT = 'persisted-details-storage';

interface PersistedDetailsProps {
  storageKey: string;
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
}

export function PersistedDetails({
  storageKey,
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
}: PersistedDetailsProps) {
  const isOpen = useSyncExternalStore(
    (onStoreChange) => {
      function handleStoreChange(event: Event) {
        if (event instanceof StorageEvent) {
          if (event.key !== null && event.key !== storageKey) {
            return;
          }
        }

        if (event instanceof CustomEvent && event.detail?.key !== storageKey) {
          return;
        }

        onStoreChange();
      }

      window.addEventListener('storage', handleStoreChange);
      window.addEventListener(DETAILS_STORAGE_EVENT, handleStoreChange);

      return () => {
        window.removeEventListener('storage', handleStoreChange);
        window.removeEventListener(DETAILS_STORAGE_EVENT, handleStoreChange);
      };
    },
    () => {
      const storedValue = localStorage.getItem(storageKey);

      if (storedValue === 'true') {
        return true;
      }

      if (storedValue === 'false') {
        return false;
      }

      return defaultOpen;
    },
    () => defaultOpen
  );

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const nextOpen = event.currentTarget.open;

    localStorage.setItem(storageKey, String(nextOpen));
    window.dispatchEvent(new CustomEvent(DETAILS_STORAGE_EVENT, { detail: { key: storageKey } }));
  }

  return (
    <details open={isOpen} onToggle={handleToggle} className={cn('group', className)}>
      <summary className={summaryClassName}>{summary}</summary>
      <div className={contentClassName}>{children}</div>
    </details>
  );
}
