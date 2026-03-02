import { HugeiconsIcon } from '@hugeicons/react';
import { AiChat02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

import { CHAT_CONFIG } from '../../modules/ai-chat/ui/constants';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader = ({ onClose }: ChatHeaderProps) => {
  return (
    <div className='relative flex items-center gap-3 px-4 py-3'>
      <div className='flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 p-2'>
        <HugeiconsIcon icon={AiChat02Icon} className='h-full w-full text-zinc-300' />
      </div>
      <div className='flex-1'>
        <h3 className='text-base font-bold text-white'>{CHAT_CONFIG.TITLE}</h3>
        <p className='text-xs text-zinc-400'>{CHAT_CONFIG.SUBTITLE}</p>
      </div>
      <button
        type='button'
        className='leading-none text-white/80 transition-colors hover:text-zinc-300'
        onClick={onClose}
        aria-label='Cerrar chat'
      >
        <HugeiconsIcon icon={Cancel01Icon} className='size-5' />
      </button>
      <div className='pointer-events-none absolute inset-0 bg-zinc-800/30' />
      <div className='absolute right-0 bottom-0 left-0 h-[1px] bg-zinc-700' />
    </div>
  );
};
