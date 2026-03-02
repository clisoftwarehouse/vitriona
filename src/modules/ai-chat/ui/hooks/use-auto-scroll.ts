import { useRef, useEffect } from 'react';

import type { Message } from '../types';

export function useAutoScroll(isOpen: boolean, messages: Message[]) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  return messagesEndRef;
}
