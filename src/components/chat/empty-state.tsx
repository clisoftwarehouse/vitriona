import { HugeiconsIcon } from '@hugeicons/react';
import { AiChat02Icon } from '@hugeicons/core-free-icons';

import { CHAT_CONFIG } from '../../modules/ai-chat/ui/constants';

export const EmptyState = () => {
  return (
    <div className='flex h-full flex-col items-center justify-center space-y-2 text-center'>
      <div className='h-16 w-16 rounded-full border border-zinc-600 bg-zinc-800 p-3'>
        <HugeiconsIcon icon={AiChat02Icon} className='h-full w-full text-zinc-400' />
      </div>
      <p className='text-sm text-zinc-400'>{CHAT_CONFIG.WELCOME_MESSAGE}</p>
    </div>
  );
};
