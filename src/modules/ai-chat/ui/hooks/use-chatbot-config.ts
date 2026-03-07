import { useState, useEffect } from 'react';

import type { ChatbotConfig } from '../types';
import { getChatbotConfigAction } from '../../server/actions/get-chatbot-config.action';

export function useChatbotConfig(businessId: string | undefined): ChatbotConfig | null {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);

  useEffect(() => {
    if (!businessId) return;

    let cancelled = false;

    getChatbotConfigAction(businessId).then((result) => {
      if (cancelled) return;
      if (result.data) {
        setConfig({
          botName: result.data.botName,
          botSubtitle: result.data.botSubtitle,
          welcomeMessage: result.data.welcomeMessage,
          errorMessage: result.data.errorMessage,
          faqs: (result.data.faqs as string[]) ?? [],
          isEnabled: result.data.isEnabled,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return config;
}
