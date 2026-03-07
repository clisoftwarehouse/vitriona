interface FaqSectionProps {
  faqs: string[];
  onFaqClick: (question: string) => void;
}

export const FaqSection = ({ faqs, onFaqClick }: FaqSectionProps) => {
  if (!faqs.length) return null;

  return (
    <div className='border-b border-zinc-700 bg-zinc-800 px-4 py-3'>
      <div className='mb-2 text-sm font-semibold text-zinc-300'>Preguntas Frecuentes</div>
      <div className='flex flex-wrap gap-2'>
        {faqs.map((question, index) => (
          <button
            key={index}
            type='button'
            className='rounded-full border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:scale-105 hover:bg-zinc-600'
            onClick={() => onFaqClick(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};
