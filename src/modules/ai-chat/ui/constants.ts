export const CHAT_CONFIG = {
  API_ENDPOINT: 'https://clisoftwarehouse.app.n8n.cloud/webhook/2d79e435-6b24-492f-824e-d09f27df00f0/chat',
  SESSION_STORAGE_KEY: 'chatSessionId',
  ERROR_MESSAGE: 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.',
  WELCOME_MESSAGE: '¡Hola! Pregúntame sobre Nebula Park',
  TITLE: 'Asistente Virtual',
  SUBTITLE: 'Nebula Park',
} as const;

export const FAQS = [
  '¿Cuáles son los horarios del parque?',
  '¿Cuánto cuesta la entrada?',
  '¿Qué atracciones tienen?',
  '¿Tienen paquetes de cumpleaños?',
  '¿Cuáles son las reglas del parque?',
] as const;
