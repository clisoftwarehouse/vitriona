'use client';

import { Icon } from '@iconify/react';
import ReactMarkdown from 'react-markdown';
import { useRef, useState, useEffect } from 'react';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Initialize or retrieve sessionId
  useEffect(() => {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chatSessionId', sessionId);
    }
    sessionIdRef.current = sessionId;
  }, []);

  // Scroll to last message when chat opens or messages change
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { from: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(
        'https://clisoftwarehouse.app.n8n.cloud/webhook/2d79e435-6b24-492f-824e-d09f27df00f0/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            chatInput: userMessage,
          }),
        }
      );

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      if (data.output && data.output.trim() !== '') {
        setMessages((prev) => [...prev, { from: 'bot', text: data.output }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const faqs = [
    '¿Cuáles son los horarios del parque?',
    '¿Cuánto cuesta la entrada?',
    '¿Qué atracciones tienen?',
    '¿Tienen paquetes de cumpleaños?',
    '¿Cuáles son las reglas del parque?',
  ];

  const handleFaqClick = async (question) => {
    setMessages((prev) => [...prev, { from: 'user', text: question }]);
    setIsTyping(true);

    try {
      const response = await fetch(
        'https://clisoftwarehouse.app.n8n.cloud/webhook/2d79e435-6b24-492f-824e-d09f27df00f0/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            chatInput: question,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from chat');
      }

      const data = await response.json();
      if (data.output && data.output.trim() !== '') {
        setMessages((prev) => [...prev, { from: 'bot', text: data.output }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Botón flotante del chat - visible cuando el chat está cerrado */}
      {!open && (
        <button
          type='button'
          className='rounded-full border-2 border-zinc-600 bg-zinc-800 p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-zinc-700'
          onClick={() => setOpen(true)}
          aria-label='Abrir asistente'
        >
          <Icon icon='mdi:robot-happy' className='h-10 w-10 text-zinc-300' />
        </button>
      )}

      {/* Ventana del chat - solo visible cuando está abierto */}
      {open && (
        <div className='fixed inset-0 z-50 flex flex-col overflow-hidden border-zinc-700 bg-zinc-900 shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[calc(100vh-2rem)] sm:w-[28rem] sm:rounded-2xl sm:border-2 lg:w-[32rem]'>
          {/* Header */}
          <div className='relative flex items-center gap-3 px-4 py-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 p-2'>
              <Icon icon='mdi:robot-happy' className='h-full w-full text-zinc-300' />
            </div>
            <div className='flex-1'>
              <h3 className='text-base font-bold text-white'>Asistente Virtual</h3>
              <p className='text-xs text-zinc-400'>Nebula Park</p>
            </div>
            <button
              type='button'
              className='text-2xl leading-none font-bold text-white/80 transition-colors hover:text-zinc-300'
              onClick={() => setOpen(false)}
              aria-label='Cerrar chat'
            >
              ×
            </button>
            <div className='pointer-events-none absolute inset-0 bg-zinc-800/30'></div>
            <div className='absolute right-0 bottom-0 left-0 h-[1px] bg-zinc-700'></div>
          </div>

          {/* FAQ Container */}
          <div className='border-b border-zinc-700 bg-zinc-800 px-4 py-3'>
            <div className='mb-2 text-sm font-semibold text-zinc-300'>Preguntas Frecuentes</div>
            <div className='flex flex-wrap gap-2'>
              {faqs.map((q, idx) => (
                <button
                  key={idx}
                  type='button'
                  className='rounded-full border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:scale-105 hover:bg-zinc-600'
                  onClick={() => handleFaqClick(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className='flex-1 space-y-3 overflow-y-auto bg-zinc-900 px-4 py-3'>
            {messages.length === 0 && (
              <div className='flex h-full flex-col items-center justify-center space-y-2 text-center'>
                <div className='h-16 w-16 rounded-full border border-zinc-600 bg-zinc-800 p-3'>
                  <Icon icon='mdi:robot-happy' className='h-full w-full text-zinc-400' />
                </div>
                <p className='text-sm text-zinc-400'>¡Hola! Pregúntame sobre Nebula Park</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isUser = msg.from === 'user';
              return (
                <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      isUser
                        ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-600 px-4 py-2 font-semibold text-white shadow-md'
                        : 'markdown-content max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-200'
                    }
                  >
                    {isUser ? (
                      msg.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          ul: ({ node, ...props }) => (
                            <ul className='my-2 list-inside list-disc space-y-1' {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className='my-2 list-inside list-decimal space-y-1' {...props} />
                          ),
                          li: ({ node, ...props }) => <li className='ml-2' {...props} />,
                          p: ({ node, ...props }) => <p className='my-1' {...props} />,
                          strong: ({ node, ...props }) => <strong className='font-bold text-white' {...props} />,
                          em: ({ node, ...props }) => <em className='italic' {...props} />,
                          code: ({ children, className, ...props }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code
                                className='rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-sm text-zinc-300'
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <code
                                className='my-2 block overflow-x-auto rounded bg-zinc-700 p-2 font-mono text-sm text-zinc-300'
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          a: ({ node, ...props }) => (
                            <a
                              className='text-zinc-300 underline hover:text-white'
                              target='_blank'
                              rel='noopener noreferrer'
                              {...props}
                            />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className='flex justify-start'>
                <div className='rounded-2xl rounded-tl-sm border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-200'>
                  <div className='flex space-x-1.5'>
                    <div
                      className='h-2 w-2 animate-bounce rounded-full bg-zinc-500'
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className='h-2 w-2 animate-bounce rounded-full bg-zinc-500'
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className='h-2 w-2 animate-bounce rounded-full bg-zinc-400'
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className='flex items-center gap-2 border-t border-zinc-700 bg-zinc-900 px-4 py-3'
          >
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className='flex-1 rounded-full border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-zinc-200 transition-all focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600 focus:outline-none'
              placeholder='Escribe tu pregunta...'
            />
            <button
              type='submit'
              disabled={!input.trim()}
              className='rounded-full bg-zinc-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
