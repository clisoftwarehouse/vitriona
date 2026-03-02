'use client';

import { useState, useCallback } from 'react';

import type { Message } from '../types';
import { useChatApi } from '../hooks/use-chat-api';
import { useAutoScroll } from '../hooks/use-auto-scroll';
import { ChatInput } from '@/components/chat/chat-input';
import { useChatSession } from '../hooks/use-chat-session';
import { ChatButton } from '@/components/chat/chat-button';
import { ChatHeader } from '@/components/chat/chat-header';
import { FaqSection } from '@/components/chat/faq-section';
import { MessagesList } from '@/components/chat/messages-list';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sessionIdRef = useChatSession();
  const { isTyping, sendMessage } = useChatApi(sessionIdRef);
  const messagesEndRef = useAutoScroll(isOpen, messages);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      const userMessage: Message = { from: 'user', text: messageText };
      addMessage(userMessage);

      const botResponse = await sendMessage(messageText);
      if (botResponse) {
        addMessage(botResponse);
      }
    },
    [addMessage, sendMessage]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isTyping) return;

      const messageText = input.trim();
      setInput('');
      await handleSendMessage(messageText);
    },
    [handleSendMessage, input, isTyping]
  );

  const handleFaqClick = useCallback(
    async (question: string) => {
      await handleSendMessage(question);
    },
    [handleSendMessage]
  );

  return (
    <div className='fixed right-6 bottom-6 z-[9999]'>
      {!isOpen && <ChatButton onClick={() => setIsOpen(true)} />}

      {isOpen && (
        <div className='fixed inset-0 z-50 flex flex-col overflow-hidden border-zinc-700 bg-zinc-900 shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[calc(100vh-2rem)] sm:w-[28rem] sm:rounded-2xl sm:border-2 lg:w-[32rem]'>
          <ChatHeader onClose={() => setIsOpen(false)} />
          <FaqSection onFaqClick={handleFaqClick} />
          <MessagesList messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} />
          <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isTyping} />
        </div>
      )}
    </div>
  );
}
