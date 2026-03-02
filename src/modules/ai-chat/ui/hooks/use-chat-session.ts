import { useRef, useEffect } from 'react';

import { CHAT_CONFIG } from '../constants';

export function useChatSession() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let sessionId = sessionStorage.getItem(CHAT_CONFIG.SESSION_STORAGE_KEY);

    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(CHAT_CONFIG.SESSION_STORAGE_KEY, sessionId);
    }

    sessionIdRef.current = sessionId;
  }, []);

  return sessionIdRef;
}
