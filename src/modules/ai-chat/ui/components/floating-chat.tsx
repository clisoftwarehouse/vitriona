'use client';

import { useState } from 'react';

import type { Message } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { useChatApi } from '../hooks/use-chat-api';
import { useAutoScroll } from '../hooks/use-auto-scroll';
import { ChatInput } from '@/components/chat/chat-input';
import { useChatSession } from '../hooks/use-chat-session';
import { ChatButton } from '@/components/chat/chat-button';
import { ChatHeader } from '@/components/chat/chat-header';
import { FaqSection } from '@/components/chat/faq-section';
import { useChatbotConfig } from '../hooks/use-chatbot-config';
import { MessagesList } from '@/components/chat/messages-list';

interface ChatWidgetProps {
  businessId?: string;
}

function ChatWidgetInner({ businessId }: ChatWidgetProps) {
  const config = useChatbotConfig(businessId);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sessionIdRef = useChatSession();
  const { isTyping, sendMessage } = useChatApi(sessionIdRef, businessId, config);
  const messagesEndRef = useAutoScroll(isOpen, messages);

  if (!config || !config.isEnabled) return null;

  const botName = config.botName ?? DEFAULT_CONFIG.BOT_NAME;
  const botSubtitle = config.botSubtitle ?? DEFAULT_CONFIG.BOT_SUBTITLE;
  const welcomeMessage = config.welcomeMessage ?? DEFAULT_CONFIG.WELCOME_MESSAGE;
  const faqs = config.faqs?.length ? config.faqs : DEFAULT_CONFIG.FAQS;

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (messageText: string) => {
    const userMessage: Message = { from: 'user', text: messageText };
    addMessage(userMessage);

    const botResponse = await sendMessage(messageText);
    if (botResponse) {
      addMessage(botResponse);
    } else {
      addMessage({ from: 'bot', text: config?.errorMessage ?? DEFAULT_CONFIG.ERROR_MESSAGE });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const messageText = input.trim();
    setInput('');
    await handleSendMessage(messageText);
  };

  const handleFaqClick = async (question: string) => {
    await handleSendMessage(question);
  };

  return (
    <div className='fixed right-6 bottom-6 z-[9999]'>
      {!isOpen && <ChatButton onClick={() => setIsOpen(true)} />}

      {isOpen && (
        <div className='fixed inset-0 z-50 flex flex-col overflow-hidden border-zinc-700 bg-zinc-900 shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[calc(100vh-2rem)] sm:w-[28rem] sm:rounded-2xl sm:border-2 lg:w-[32rem]'>
          <ChatHeader botName={botName} botSubtitle={botSubtitle} onClose={() => setIsOpen(false)} />
          <FaqSection faqs={faqs} onFaqClick={handleFaqClick} />
          <MessagesList
            messages={messages}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            welcomeMessage={welcomeMessage}
          />
          <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isTyping} />
        </div>
      )}
    </div>
  );
}

export default function ChatWidget({ businessId }: ChatWidgetProps) {
  return <ChatWidgetInner businessId={businessId} />;
}
