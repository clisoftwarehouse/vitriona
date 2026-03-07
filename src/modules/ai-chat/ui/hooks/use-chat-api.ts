import { useState, useCallback } from 'react';

import { DEFAULT_CONFIG } from '../constants';
import type { Message, ChatRequest, ChatResponse, ChatbotConfig } from '../types';

export function useChatApi(
  sessionIdRef: React.MutableRefObject<string | null>,
  businessId: string | undefined,
  config: ChatbotConfig | null
) {
  const [isTyping, setIsTyping] = useState(false);

  const errorMessage = config?.errorMessage ?? DEFAULT_CONFIG.ERROR_MESSAGE;

  const sendMessage = useCallback(
    async (message: string): Promise<Message | null> => {
      if (!sessionIdRef.current || !businessId) return null;

      setIsTyping(true);

      try {
        const requestBody: ChatRequest = {
          chatInput: message,
          sessionId: sessionIdRef.current,
        };

        const response = await fetch(`/api/chat/${businessId}`, {
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
        return { from: 'bot', text: errorMessage };
      } finally {
        setIsTyping(false);
      }
    },
    [sessionIdRef, businessId, errorMessage]
  );

  return { isTyping, sendMessage };
}
