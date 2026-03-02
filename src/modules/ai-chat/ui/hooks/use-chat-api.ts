import { useState, useCallback } from 'react';

import { CHAT_CONFIG } from '../constants';
import type { Message, ChatRequest, ChatResponse } from '../types';

export function useChatApi(sessionIdRef: React.MutableRefObject<string | null>) {
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (message: string): Promise<Message | null> => {
      if (!sessionIdRef.current) return null;

      setIsTyping(true);

      try {
        const requestBody: ChatRequest = {
          chatInput: message,
          sessionId: sessionIdRef.current,
        };

        const response = await fetch(CHAT_CONFIG.API_ENDPOINT, {
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        if (!response.ok) {
          console.error('Response not OK:', response.status, response.statusText);
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const data: ChatResponse = await response.json();

        if (data.output?.trim()) {
          return { from: 'bot', text: data.output };
        }

        return null;
      } catch (error) {
        console.error('Error sending message:', error);
        return { from: 'bot', text: CHAT_CONFIG.ERROR_MESSAGE };
      } finally {
        setIsTyping(false);
      }
    },
    [sessionIdRef]
  );

  return { isTyping, sendMessage };
}
