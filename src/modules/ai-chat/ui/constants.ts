export const SESSION_STORAGE_KEY = 'chatSessionId';

export const DEFAULT_CONFIG = {
  BOT_NAME: 'Asistente Virtual',
  BOT_SUBTITLE: null as string | null,
  WELCOME_MESSAGE: '¡Hola! ¿En qué puedo ayudarte?',
  ERROR_MESSAGE: 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.',
  FAQS: [] as string[],
} as const;
