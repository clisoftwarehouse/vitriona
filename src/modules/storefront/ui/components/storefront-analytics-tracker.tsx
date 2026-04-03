'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import {
  trackStorefrontEventSchema,
  STOREFRONT_ANALYTICS_SESSION_KEY,
  type StorefrontAnalyticsEventType,
  STOREFRONT_ANALYTICS_DEDUPE_TTL_MS,
} from '@/modules/storefront/lib/storefront-analytics';

interface StorefrontAnalyticsTrackerProps {
  businessId: string;
  eventType: StorefrontAnalyticsEventType;
  productId?: string;
  productName?: string;
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  try {
    const existingSessionId = localStorage.getItem(STOREFRONT_ANALYTICS_SESSION_KEY);

    if (existingSessionId) {
      return existingSessionId;
    }

    const nextSessionId = createSessionId();
    localStorage.setItem(STOREFRONT_ANALYTICS_SESSION_KEY, nextSessionId);
    return nextSessionId;
  } catch {
    return createSessionId();
  }
}

function shouldSkipEvent(dedupeKey: string) {
  try {
    const lastSentAt = sessionStorage.getItem(dedupeKey);
    const now = Date.now();

    if (lastSentAt && now - Number(lastSentAt) < STOREFRONT_ANALYTICS_DEDUPE_TTL_MS) {
      return true;
    }

    sessionStorage.setItem(dedupeKey, String(now));
    return false;
  } catch {
    return false;
  }
}

export function StorefrontAnalyticsTracker({
  businessId,
  eventType,
  productId,
  productName,
}: StorefrontAnalyticsTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const payload = trackStorefrontEventSchema.safeParse({
      businessId,
      eventType,
      path: pathname,
      productId,
      productName,
      sessionId: getSessionId(),
    });

    if (!payload.success) {
      return;
    }

    const dedupeKey = [
      'vitriona-storefront-analytics',
      payload.data.businessId,
      payload.data.eventType,
      payload.data.path,
      payload.data.productId ?? 'none',
    ].join(':');

    if (shouldSkipEvent(dedupeKey)) {
      return;
    }

    const body = JSON.stringify(payload.data);

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/storefront-analytics', new Blob([body], { type: 'application/json' }));

      if (sent) {
        return;
      }
    }

    void fetch('/api/storefront-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [businessId, eventType, pathname, productId, productName]);

  return null;
}
