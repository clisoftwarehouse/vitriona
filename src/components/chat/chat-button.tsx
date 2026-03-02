import { HugeiconsIcon } from '@hugeicons/react';
import { AiChat02Icon } from '@hugeicons/core-free-icons';

interface ChatButtonProps {
  onClick: () => void;
}

export const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <button
      type='button'
      className='rounded-full border-2 border-zinc-600 bg-zinc-800 p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-zinc-700'
      onClick={onClick}
      aria-label='Abrir asistente'
    >
      <HugeiconsIcon icon={AiChat02Icon} className='h-10 w-10 text-zinc-300' />
    </button>
  );
};
