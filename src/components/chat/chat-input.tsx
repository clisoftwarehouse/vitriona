import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export const ChatInput = ({ disabled = false, onChange, onSubmit, value }: ChatInputProps) => {
  return (
    <form onSubmit={onSubmit} className='flex items-center gap-2 border-t border-zinc-700 bg-zinc-900 px-4 py-3'>
      <Input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='flex-1 rounded-full border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-zinc-200 transition-all focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600 focus:outline-none'
        placeholder='Escribe tu pregunta...'
        disabled={disabled}
      />
      <Button
        type='submit'
        disabled={!value.trim() || disabled}
        className='rounded-full bg-zinc-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-50'
      >
        Enviar
      </Button>
    </form>
  );
};
