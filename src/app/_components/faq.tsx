import { ChevronDown } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const FAQ_ITEMS = [
  {
    question: '¿Necesito saber programar?',
    answer:
      'No. Vitriona está diseñado para que cualquier persona pueda crear su catálogo digital sin conocimientos técnicos. Todo se configura desde el dashboard con un editor visual.',
  },
  {
    question: '¿Cómo funciona el chatbot con IA?',
    answer:
      'El chatbot con IA es un add-on que se agrega a cualquier plan. Se entrena automáticamente con los productos de tu catálogo y puede listar productos, buscar por categoría, crear pedidos, mostrar métodos de pago y hasta agendar citas — todo de forma conversacional. Puedes elegir entre 3 niveles según tu volumen de consultas.',
  },
  {
    question: '¿Puedo recibir pedidos por WhatsApp?',
    answer:
      'Sí. Cuando un cliente completa su pedido en tu storefront, se genera un mensaje con todos los detalles y se envía directo a tu WhatsApp Business. Cero fricción.',
  },
  {
    question: '¿Qué métodos de pago puedo configurar?',
    answer:
      'Puedes crear los métodos de pago que uses: Pago Móvil, Zelle, transferencia bancaria, efectivo, etc. Cada uno con sus instrucciones y datos de cuenta.',
  },
  {
    question: '¿Puedo tener varios negocios?',
    answer:
      'Sí. Vitriona es multi-negocio desde el inicio. Puedes gestionar varios negocios, cada uno con sus propios catálogos, productos, chatbot y configuración.',
  },
  {
    question: '¿Mis clientes necesitan crear cuenta?',
    answer:
      'No. Tus clientes acceden al catálogo público con un enlace directo (vitriona.app/tu-negocio) y pueden hacer pedidos sin registrarse.',
  },
];

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
