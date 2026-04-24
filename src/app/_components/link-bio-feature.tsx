import {
  Link2,
  Phone,
  Palette,
  Youtube,
  Twitter,
  Facebook,
  Instagram,
  ShoppingBag,
  GripVertical,
  ExternalLink,
} from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const BULLETS = [
  {
    icon: Palette,
    title: 'Personalización completa',
    description: 'Elige colores, fondo, tipografía y estilo de botones. O reutiliza el tema de tu tienda con un clic.',
  },
  {
    icon: Instagram,
    title: 'Iconos reales de cada marca',
    description: 'Instagram, TikTok, WhatsApp y más se muestran con su logo auténtico — no con emojis.',
  },
  {
    icon: GripVertical,
    title: 'Ordenamiento drag & drop',
    description: 'Arrastra tus links, activa o desactiva cada uno y sube tu propio icono para los personalizados.',
  },
  {
    icon: Link2,
    title: 'Una URL corta para compartir',
    description:
      'Usa vitriona.app/tu-negocio/links en tu bio de Instagram, TikTok o WhatsApp y envía todo tu tráfico a un solo lugar.',
  },
];

const MOCKUP_LINKS = [
  { icon: ShoppingBag, label: 'Ver nuestra tienda', highlight: true },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Twitter, label: 'Twitter / X' },
  { icon: Phone, label: 'Llamar' },
];

export function LinkBioFeature() {
  return (
    <section className='border-border/50 bg-muted/10 overflow-hidden border-t py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6 lg:px-12'>
        <div className='flex w-full flex-col-reverse items-center justify-between gap-16 lg:flex-row lg:gap-10'>
          {/* ── Left: mockup ── */}
          <div className='relative flex w-full justify-center lg:w-[45%] xl:w-[40%]'>
            {/* Soft background glow */}
            <div
              aria-hidden='true'
              className='from-primary/30 absolute inset-0 -z-10 m-auto size-80 rounded-full bg-linear-to-br to-purple-400/20 blur-3xl'
            />

            <div
              className='relative w-full max-w-xs rounded-4xl border border-white/10 bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 shadow-2xl'
              style={{ boxShadow: '0 25px 80px -20px rgba(88, 28, 135, 0.45)' }}
            >
              {/* Avatar */}
              <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-400 to-purple-600 text-2xl font-bold text-white shadow-lg ring-2 ring-white/20'>
                V
              </div>

              {/* Title + bio */}
              <div className='mt-4 text-center'>
                <p className='text-base font-bold text-white'>@tu-negocio</p>
                <p className='mt-1 text-xs leading-relaxed text-white/60'>Todo lo nuestro en un solo lugar ✨</p>
              </div>

              {/* Links */}
              <div className='mt-5 flex flex-col gap-2.5'>
                {MOCKUP_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <div
                      key={link.label}
                      className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
                        link.highlight
                          ? 'bg-linear-to-r from-fuchsia-500 to-purple-600 text-white shadow-md shadow-purple-900/40'
                          : 'border border-white/15 bg-white/5 text-white backdrop-blur-sm'
                      }`}
                    >
                      <Icon className='size-4 shrink-0' />
                      <span className='flex-1 text-center'>{link.label}</span>
                      <ExternalLink className='size-2.5 shrink-0 opacity-40' />
                    </div>
                  );
                })}
              </div>

              {/* Powered by */}
              <p className='mt-5 text-center text-[9px] font-semibold tracking-wider text-white/30 uppercase'>
                Creado con Vitriona
              </p>
            </div>
          </div>

          {/* ── Right: copy + bullets ── */}
          <div className='w-full lg:w-[50%]'>
            <div className='bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold'>
              <Link2 className='size-3.5' />
              Página de Links
            </div>
            <h2 className='text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl'>
              Tu bio link con todo lo tuyo en un solo enlace
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              Una URL corta para poner en la bio de Instagram, TikTok o WhatsApp. Redes sociales, tu tienda, agenda y
              contacto — todo en una página que tú personalizas con la identidad de tu marca.
            </p>

            <div className='mt-10 grid gap-8 sm:grid-cols-2'>
              {BULLETS.map((bullet) => {
                const Icon = bullet.icon;
                return (
                  <div key={bullet.title} className='relative pl-12 text-left'>
                    <div className='bg-primary/10 text-primary absolute top-1 left-0 flex size-8 items-center justify-center rounded-lg'>
                      <Icon className='size-4' />
                    </div>
                    <h3 className='text-base font-semibold'>{bullet.title}</h3>
                    <p className='text-muted-foreground mt-2 text-sm'>{bullet.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
