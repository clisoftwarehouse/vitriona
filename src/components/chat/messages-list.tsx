import { EmptyState } from './empty-state';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import type { Message } from '../../modules/ai-chat/ui/types';

interface MessagesListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessagesList = ({ isTyping, messages, messagesEndRef }: MessagesListProps) => {
  return (
    <div className='flex-1 space-y-3 overflow-y-auto bg-zinc-900 px-4 py-3'>
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        messages.map((message, index) => <MessageBubble key={index} message={message} />)
      )}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};
