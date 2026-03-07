export interface Message {
  from: 'user' | 'bot';
  text: string;
}

export interface ChatResponse {
  output: string;
}

export interface ChatRequest {
  sessionId: string;
  chatInput: string;
}

export interface ChatbotConfig {
  botName: string;
  botSubtitle: string | null;
  welcomeMessage: string | null;
  errorMessage: string | null;
  faqs: string[];
  isEnabled: boolean;
}
