import { ChevronDown } from 'lucide-react';

import { FAQ_ITEMS } from '../_data/landing';
import { ScrollReveal } from './scroll-reveal';

export function FAQ() {
  return (
    <section id='faq' className='border-border/50 bg-muted/30 border-t py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-3xl px-6'>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>FAQ</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Preguntas frecuentes</h2>
        </div>
        <div className='mt-12 space-y-4'>
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className='group border-border/50 bg-card rounded-xl border'>
              <summary className='hover:text-primary flex cursor-pointer items-center justify-between p-5 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden'>
                {item.question}
                <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180' />
              </summary>
              <div className='text-muted-foreground px-5 pb-5 text-sm leading-relaxed'>{item.answer}</div>
            </details>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
