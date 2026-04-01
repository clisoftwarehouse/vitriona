import { getRedis } from '@/lib/redis';

export interface StoredMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

const SESSION_TTL = 60 * 60 * 24; // 24 hours
const MAX_HISTORY = 50;

export async function getConversationHistory(sessionId: string): Promise<StoredMessage[]> {
  const client = getRedis();
  const key = `chat:${sessionId}`;
  const raw = await client.get(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export async function appendMessage(sessionId: string, message: StoredMessage): Promise<void> {
  const client = getRedis();
  const key = `chat:${sessionId}`;
  const history = await getConversationHistory(sessionId);

  history.push(message);

  const trimmed = history.slice(-MAX_HISTORY);

  await client.set(key, JSON.stringify(trimmed), 'EX', SESSION_TTL);
}

export async function appendMessages(sessionId: string, messages: StoredMessage[]): Promise<void> {
  const client = getRedis();
  const key = `chat:${sessionId}`;
  const history = await getConversationHistory(sessionId);

  history.push(...messages);

  const trimmed = history.slice(-MAX_HISTORY);

  await client.set(key, JSON.stringify(trimmed), 'EX', SESSION_TTL);
}
