import { ScrollReveal } from './scroll-reveal';

const STEPS = [
  {
    step: '01',
    title: 'Crea tu negocio',
    description: 'Regístrate gratis, crea tu negocio y configura la información básica: nombre, logo, WhatsApp y más.',
  },
  {
    step: '02',
    title: 'Agrega productos',
    description: 'Sube tus productos con fotos, precios, variantes e inventario. Importa desde Excel si tienes muchos.',
  },
  {
    step: '03',
    title: 'Personaliza tu catálogo',
    description: 'Usa el Site Builder para elegir colores, fuentes y layout. Tu storefront queda listo en minutos.',
  },
  {
    step: '04',
    title: 'Activa el chatbot y vende',
    description:
      'Configura tu chatbot con IA, comparte el enlace de tu catálogo y empieza a recibir pedidos al instante.',
  },
];

export function HowItWorks() {
  return (
    <section id='how-it-works' className='border-border/50 bg-muted/30 border-t py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>Cómo funciona</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Listo en 4 pasos</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>
            No necesitas conocimientos técnicos. Configura todo desde tu navegador.
          </p>
        </div>
        <div className='mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {STEPS.map((item) => (
            <div key={item.step} className='relative'>
              <span className='text-primary/30 text-5xl font-black'>{item.step}</span>
              <h3 className='mt-2 text-lg font-semibold'>{item.title}</h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{item.description}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
