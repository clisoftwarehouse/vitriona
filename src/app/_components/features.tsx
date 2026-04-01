'use client';

import { useState } from 'react';
import {
  Bot,
  Globe,
  Store,
  QrCode,
  Shield,
  Package,
  Palette,
  Calendar,
  Sparkles,
  BarChart3,
  Smartphone,
  ChevronDown,
  ShoppingCart,
  MessageSquare,
} from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

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
    addOn: true,
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

export function Features() {
  const [showAll, setShowAll] = useState(false);

  return (
    <section id='features' className='py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
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
                className={`group border-border/50 bg-card hover:border-primary/20 hover:shadow-primary/5 ${hiddenOnMobile} relative flex-col rounded-2xl border p-6 transition-all hover:shadow-lg`}
              >
                {'addOn' in feature && feature.addOn && (
                  <span className='absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400'>
                    <Sparkles className='size-3' />
                    Add-on
                  </span>
                )}
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
      </ScrollReveal>
    </section>
  );
}
