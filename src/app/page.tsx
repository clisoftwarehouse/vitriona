'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  X,
  Bot,
  Zap,
  Menu,
  Star,
  Check,
  Globe,
  Store,
  QrCode,
  Shield,
  Package,
  Palette,
  Calendar,
  BarChart3,
  ArrowRight,
  Smartphone,
  ChevronDown,
  ShoppingCart,
  MessageSquare,
} from 'lucide-react';

/* ─── Scroll animation hook ─── */

function useAnimateOnScroll<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('animate-in');
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

const ANIMATE_BASE = 'opacity-0 translate-y-8 transition-all duration-700 ease-out';
const ANIMATE_IN = '[&.animate-in]:opacity-100 [&.animate-in]:translate-y-0';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='bg-background/80 fixed top-0 right-0 left-0 z-50 border-b border-white/10 backdrop-blur-xl'>
      <nav className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
        <Link href='/' className='flex items-center gap-2'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-dark.png' className='hidden h-12 w-auto dark:block' alt='Vitriona' />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-light.png' className='block h-12 w-auto dark:hidden' alt='Vitriona' />
        </Link>
        <div className='hidden items-center gap-8 md:flex'>
          <a href='#features' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Funcionalidades
          </a>
          <a href='#how-it-works' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Cómo funciona
          </a>
          <a href='#pricing' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Precios
          </a>
          <a href='#faq' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            FAQ
          </a>
        </div>
        <div className='flex items-center gap-3'>
          <Link
            href='/auth/register'
            className='bg-primary text-primary-foreground hidden h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-90 sm:inline-flex'
          >
            Empezar gratis
            <ArrowRight className='size-3.5' />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='text-muted-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-lg md:hidden'
            aria-label='Toggle menu'
          >
            {mobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='bg-background border-border absolute top-16 right-0 left-0 border-b shadow-lg md:hidden'>
          <div className='flex flex-col px-6 py-4'>
            <a
              href='#features'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Funcionalidades
            </a>
            <a
              href='#how-it-works'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Cómo funciona
            </a>
            <a
              href='#pricing'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Precios
            </a>
            <a
              href='#faq'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              FAQ
            </a>
            <Link
              href='/auth/register'
              onClick={() => setMobileMenuOpen(false)}
              className='bg-primary text-primary-foreground mt-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
            >
              Empezar gratis
              <ArrowRight className='size-3.5' />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!bgRef.current) return;
      const y = window.scrollY;
      bgRef.current.style.transform = `translateY(${y * 0.35}px)`;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className='relative grid min-h-screen place-items-center overflow-hidden px-6 pt-20 pb-12'>
      {/* Background gradient with parallax */}
      <div ref={bgRef} className='pointer-events-none absolute inset-0 -z-10 will-change-transform'>
        <div className='bg-primary/8 absolute top-0 left-1/2 h-150 w-200 -translate-x-1/2 rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute top-40 right-0 h-100 w-100 rounded-full blur-3xl' />
      </div>

      <div className='w-full max-w-7xl text-center'>
        <div className='animate-fade-in-up border-primary/20 bg-primary/5 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm'>
          <Zap className='size-3.5' />
          Plataforma todo-en-uno para tu negocio
        </div>

        <h1 className='animate-fade-in-up mx-auto max-w-4xl text-4xl font-bold tracking-tight delay-100 sm:text-5xl md:text-6xl lg:text-7xl'>
          Tu catálogo digital con{' '}
          <span className='from-primary bg-linear-to-r to-purple-400 bg-clip-text text-transparent'>
            asistente de IA
          </span>
        </h1>

        <p className='animate-fade-in-up text-muted-foreground mx-auto mt-6 max-w-2xl text-lg delay-200 md:text-xl'>
          Crea catálogos personalizados, recibe pedidos por WhatsApp, agenda citas y deja que tu chatbot con IA atienda
          a tus clientes 24/7.
        </p>

        <div className='animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 delay-300 sm:flex-row'>
          <Link
            href='/auth/register'
            className='bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/30 inline-flex h-12 items-center gap-2 rounded-xl px-8 text-base font-semibold shadow-lg transition-all hover:opacity-90 hover:shadow-xl'
          >
            Crear mi catálogo gratis
            <ArrowRight className='size-4' />
          </Link>
          <a
            href='#features'
            className='border-border hover:bg-accent inline-flex h-12 items-center gap-2 rounded-xl border px-8 text-base font-medium transition-colors'
          >
            Ver funcionalidades
          </a>
        </div>

        {/* Stats */}
        <div className='animate-fade-in-up mt-16 grid grid-cols-2 gap-8 delay-500 md:grid-cols-4'>
          {[
            { value: 'Ilimitados', label: 'Catálogos' },
            { value: '24/7', label: 'Chatbot IA' },
            { value: 'WhatsApp', label: 'Checkout' },
            { value: 'Gratis', label: 'Para empezar' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className='text-primary text-2xl font-bold md:text-3xl'>{stat.value}</p>
              <p className='text-muted-foreground mt-1 text-sm'>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Store,
    title: 'Catálogos personalizados',
    description: 'Crea múltiples catálogos con tu marca, colores y estilo. Personaliza todo desde el Site Builder.',
  },
  {
    icon: Bot,
    title: 'Chatbot con IA',
    description:
      'Un asistente entrenado con tu catálogo que responde preguntas, sugiere productos y crea pedidos automáticamente.',
  },
  {
    icon: ShoppingCart,
    title: 'Pedidos y pagos',
    description:
      'Recibe pedidos con métodos de pago configurables, verificación automática y gestión completa desde el dashboard.',
  },
  {
    icon: Calendar,
    title: 'Agenda de citas',
    description:
      'Integración con Google Calendar. Tus clientes agendan directamente a través del chatbot o tu storefront.',
  },
  {
    icon: MessageSquare,
    title: 'Checkout por WhatsApp',
    description: 'Cero fricción para LATAM. El cliente completa su pedido y lo envía directo a tu WhatsApp.',
  },
  {
    icon: Palette,
    title: 'Site Builder visual',
    description: 'Personaliza colores, tipografías, secciones y layout sin escribir una sola línea de código.',
  },
  {
    icon: Package,
    title: 'Inventario inteligente',
    description: 'Control de stock por producto y variante. Deducción automática al crear pedidos.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard completo',
    description: 'Métricas de ventas, pedidos, productos y reseñas. Todo lo que necesitas en un solo lugar.',
  },
  {
    icon: QrCode,
    title: 'QR Code',
    description:
      'Genera códigos QR para tus catálogos. Ideal para comercios físicos que quieren digitalizar su vitrina.',
  },
  {
    icon: Globe,
    title: 'Multi-negocio',
    description: 'Gestiona varios negocios desde una sola cuenta. Cada uno con sus catálogos, productos y chatbot.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    description: 'Storefronts optimizados para móviles. Tus clientes compran cómodamente desde cualquier dispositivo.',
  },
  {
    icon: Shield,
    title: 'Cupones y descuentos',
    description: 'Crea cupones con reglas flexibles: porcentaje, monto fijo, uso limitado, fechas de vigencia.',
  },
];

function Features() {
  const [showAll, setShowAll] = useState(false);
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id='features' className='py-20 md:py-28'>
      <div ref={ref} className={`mx-auto max-w-7xl px-6 ${ANIMATE_BASE} ${ANIMATE_IN}`}>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>Funcionalidades</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Todo lo que tu negocio necesita</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl'>
            Desde catálogos digitales hasta un chatbot con inteligencia artificial. Una plataforma completa para vender
            más y atender mejor.
          </p>
        </div>
        <div className='mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const hiddenOnMobile = i >= 4 && !showAll ? 'hidden sm:flex' : 'flex';
            return (
              <div
                key={feature.title}
                className={`group border-border/50 bg-card hover:border-primary/20 hover:shadow-primary/5 ${hiddenOnMobile} flex-col rounded-2xl border p-6 transition-all hover:shadow-lg`}
              >
                <div className='bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground inline-flex size-12 items-center justify-center rounded-xl transition-colors'>
                  <Icon className='size-6' />
                </div>
                <h3 className='mt-4 text-lg font-semibold'>{feature.title}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{feature.description}</p>
              </div>
            );
          })}
        </div>
        {!showAll && (
          <div className='mt-8 text-center sm:hidden'>
            <button
              onClick={() => setShowAll(true)}
              className='border-border hover:bg-accent inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-colors'
            >
              Ver más funcionalidades
              <ChevronDown className='size-4' />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

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

function HowItWorks() {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id='how-it-works' className='border-border/50 bg-muted/30 border-t py-20 md:py-28'>
      <div ref={ref} className={`mx-auto max-w-7xl px-6 ${ANIMATE_BASE} ${ANIMATE_IN}`}>
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
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    description: 'Perfecto para probar la plataforma.',
    features: [
      '1 negocio',
      '1 catálogo',
      'Hasta 20 productos',
      'Storefront público',
      'Pedidos por WhatsApp',
      'Chatbot básico',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$16',
    period: '/mes',
    description: 'Para negocios que quieren crecer.',
    features: [
      '3 negocios',
      'Catálogos ilimitados',
      'Productos ilimitados',
      'Chatbot con IA avanzado',
      'Agenda de citas',
      'Inventario y variantes',
      'Cupones y descuentos',
      'Métodos de pago',
      'Dominio personalizado',
    ],
    cta: 'Comenzar ahora',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$39',
    period: '/mes',
    description: 'Para empresas con múltiples marcas.',
    features: [
      'Negocios ilimitados',
      'Todo lo del plan Pro',
      'Soporte prioritario',
      'API access',
      'Reportes avanzados',
      'Integraciones custom',
      'Onboarding personalizado',
    ],
    cta: 'Contactar ventas',
    highlighted: false,
  },
];

function Pricing() {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id='pricing' className='py-20 md:py-28'>
      <div ref={ref} className={`mx-auto max-w-7xl px-6 ${ANIMATE_BASE} ${ANIMATE_IN}`}>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>Precios</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Simple y transparente</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>
            Empieza gratis y escala cuando lo necesites. Sin sorpresas.
          </p>
        </div>
        <div className='mt-16 grid gap-8 lg:grid-cols-3'>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-shadow ${
                plan.highlighted
                  ? 'border-primary bg-card shadow-primary/10 shadow-xl'
                  : 'border-border/50 bg-card hover:shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className='bg-primary text-primary-foreground absolute -top-3 right-6 rounded-full px-3 py-0.5 text-xs font-semibold'>
                  Popular
                </div>
              )}
              <h3 className='text-lg font-semibold'>{plan.name}</h3>
              <div className='mt-4 flex items-baseline gap-1'>
                <span className='text-4xl font-bold'>{plan.price}</span>
                <span className='text-muted-foreground text-sm'>{plan.period}</span>
              </div>
              <p className='text-muted-foreground mt-2 text-sm'>{plan.description}</p>
              <Link
                href='/auth/register'
                className={`mt-6 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md hover:opacity-90'
                    : 'border-border bg-background hover:bg-accent border'
                }`}
              >
                {plan.cta}
              </Link>
              <ul className='mt-8 space-y-3'>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-2.5 text-sm'>
                    <Check className='text-primary mt-0.5 size-4 shrink-0' />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: '¿Necesito saber programar?',
    answer:
      'No. Vitriona está diseñado para que cualquier persona pueda crear su catálogo digital sin conocimientos técnicos. Todo se configura desde el dashboard con un editor visual.',
  },
  {
    question: '¿Cómo funciona el chatbot con IA?',
    answer:
      'El chatbot se entrena automáticamente con los productos de tu catálogo. Puede listar productos, buscar por categoría, crear pedidos, mostrar métodos de pago y hasta agendar citas — todo de forma conversacional.',
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

function FAQ() {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id='faq' className='border-border/50 bg-muted/30 border-t py-20 md:py-28'>
      <div ref={ref} className={`mx-auto max-w-3xl px-6 ${ANIMATE_BASE} ${ANIMATE_IN}`}>
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
      </div>
    </section>
  );
}

function CTA() {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section className='py-20 md:py-28'>
      <div ref={ref} className={`mx-auto max-w-7xl px-6 ${ANIMATE_BASE} ${ANIMATE_IN}`}>
        <div className='bg-primary relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16'>
          <div className='pointer-events-none absolute inset-0 z-0'>
            <div className='absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-24 -left-24 size-64 rounded-full bg-white/10 blur-3xl' />
          </div>
          <div className='relative z-10'>
            <h2 className='text-primary-foreground text-3xl font-bold md:text-4xl'>Empieza a vender hoy</h2>
            <p className='text-primary-foreground/80 mx-auto mt-4 max-w-xl text-base'>
              Crea tu catálogo digital en minutos, activa tu chatbot con IA y comparte el enlace con tus clientes.
            </p>
            <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link
                href='/auth/register'
                className='text-primary inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold transition-opacity hover:opacity-90'
              >
                Crear cuenta gratis
                <ArrowRight className='size-4' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className='border-border/50 border-t py-12'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div className='md:col-span-2'>
            <Link href='/' className='flex items-center gap-2'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/images/vitriona-logo-dark.png' className='hidden h-8 w-auto dark:block' alt='Vitriona' />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/images/vitriona-logo-light.png' className='block h-8 w-auto dark:hidden' alt='Vitriona' />
            </Link>
            <p className='text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed'>
              La plataforma todo-en-uno para crear catálogos digitales, gestionar pedidos y atender clientes con
              inteligencia artificial.
            </p>
          </div>
          <div>
            <h4 className='text-sm font-semibold'>Producto</h4>
            <ul className='mt-3 space-y-2'>
              {['Funcionalidades', 'Precios', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className='text-muted-foreground hover:text-foreground text-sm'>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className='text-sm font-semibold'>Cuenta</h4>
            <ul className='mt-3 space-y-2'>
              <li>
                <Link href='/auth/login' className='text-muted-foreground hover:text-foreground text-sm'>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href='/auth/register' className='text-muted-foreground hover:text-foreground text-sm'>
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='border-border/50 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row'>
          <p className='text-muted-foreground text-xs'>
            &copy; {new Date().getFullYear()} Vitriona. Hecho por{' '}
            <span className='text-foreground font-medium'>CLI Software House</span>.
          </p>
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <Star className='fill-primary text-primary size-3' />
            Hecho en Venezuela
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className='min-h-screen'>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
