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
