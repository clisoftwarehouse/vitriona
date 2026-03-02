const ANIMATION_DELAYS = {
  DOT_1: '0ms',
  DOT_2: '150ms',
  DOT_3: '300ms',
};

export const TypingIndicator = () => {
  return (
    <div className='flex justify-start'>
      <div className='rounded-2xl rounded-tl-sm border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-200'>
        <div className='flex space-x-1.5'>
          <div
            className='h-2 w-2 animate-bounce rounded-full bg-zinc-500'
            style={{ animationDelay: ANIMATION_DELAYS.DOT_1 }}
          />
          <div
            className='h-2 w-2 animate-bounce rounded-full bg-zinc-500'
            style={{ animationDelay: ANIMATION_DELAYS.DOT_2 }}
          />
          <div
            className='h-2 w-2 animate-bounce rounded-full bg-zinc-400'
            style={{ animationDelay: ANIMATION_DELAYS.DOT_3 }}
          />
        </div>
      </div>
    </div>
  );
};
