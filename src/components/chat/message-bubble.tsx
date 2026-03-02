import ReactMarkdown from 'react-markdown';

import type { Message } from '../../modules/ai-chat/ui/types';

interface MessageBubbleProps {
  message: Message;
}

const markdownComponents = {
  a: ({ ...props }) => (
    <a className='text-zinc-300 underline hover:text-white' target='_blank' rel='noopener noreferrer' {...props} />
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className;
    return isInline ? (
      <code className='rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-sm text-zinc-300' {...props}>
        {children}
      </code>
    ) : (
      <code className='my-2 block overflow-x-auto rounded bg-zinc-700 p-2 font-mono text-sm text-zinc-300' {...props}>
        {children}
      </code>
    );
  },
  em: ({ ...props }) => <em className='italic' {...props} />,
  li: ({ ...props }) => <li className='ml-2' {...props} />,
  ol: ({ ...props }) => <ol className='my-2 list-inside list-decimal space-y-1' {...props} />,
  p: ({ ...props }) => <p className='my-1' {...props} />,
  strong: ({ ...props }) => <strong className='font-bold text-white' {...props} />,
  ul: ({ ...props }) => <ul className='my-2 list-inside list-disc space-y-1' {...props} />,
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.from === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-600 px-4 py-2 font-semibold text-white shadow-md'
            : 'markdown-content max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-200'
        }
      >
        {isUser ? (
          <span>{message.text}</span>
        ) : (
          <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
        )}
      </div>
    </div>
  );
};
