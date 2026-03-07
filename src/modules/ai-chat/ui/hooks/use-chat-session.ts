import { useRef, useEffect } from 'react';

import { SESSION_STORAGE_KEY } from '../constants';

export function useChatSession() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    sessionIdRef.current = sessionId;
  }, []);

  return sessionIdRef;
}
