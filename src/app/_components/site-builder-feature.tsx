import Image from 'next/image';
import { Layers, Palette, Smartphone, MousePointerSquareDashed } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const BUILDER_FEATURES = [
  {
    icon: Palette,
    title: 'Personalización Visual',
    description:
      'Ajusta colores, tipografías y el estilo de tu marca en tiempo real, sin escribir una sola línea de código.',
  },
  {
    icon: Layers,
    title: 'Secciones Modulares',
    description:
      'Activa o desactiva secciones de tu catálogo con un clic. Muestra banners comerciales, categorías destacadas y más.',
  },
  {
    icon: Smartphone,
    title: 'Diseño Responsivo',
    description:
      'Tu catálogo se verá increíble en cualquier dispositivo, optimizado automáticamente para móviles y pantallas grandes.',
  },
  {
    icon: MousePointerSquareDashed,
    title: 'Interfaz Drag & Drop',
    description: 'Organiza el diseño, los productos y las categorías arrastrando y soltando de forma intuitiva.',
  },
];

export function SiteBuilderFeature() {
  return (
    <section className='border-border/50 bg-muted/10 overflow-hidden border-t py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6 lg:px-12'>
        <div className='flex w-full flex-col items-center justify-between lg:flex-row'>
          <div className='w-full lg:w-[45%] xl:w-[40%]'>
            <div className='bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold'>
              <Palette className='size-3.5' />
              Site Builder Integrado
            </div>
            <h2 className='text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl'>
              Crea el catálogo perfecto sin saber programar
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              Diseña una experiencia de compra única para tus clientes. Nuestro poderoso editor en vivo te permite
              moldear cada aspecto de tu tienda web en minutos, aplicando la autenticidad de tu marca.
            </p>

            <div className='mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-1'>
              {BUILDER_FEATURES.map((feature) => (
                <div key={feature.title} className='relative pl-12 text-left'>
                  <div className='bg-primary/10 text-primary absolute top-1 left-0 flex size-8 items-center justify-center rounded-lg'>
                    <feature.icon className='size-4' />
                  </div>
                  <h3 className='text-base font-semibold'>{feature.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm'>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='relative mt-16 flex w-full justify-end lg:mt-0 lg:w-[50%]'>
            <Image
              src='/images/vitriona-sitebuilder-shot.png'
              alt='Vitriona Site Builder visual editor en acción'
              width={700}
              height={700}
              className='h-auto w-full max-w-2xl object-contain drop-shadow-xl'
              priority
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
