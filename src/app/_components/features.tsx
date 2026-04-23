'use client';

import { useState } from 'react';
import {
  Bot,
  Gift,
  Tags,
  Star,
  Link2,
  Boxes,
  Store,
  Truck,
  MapPin,
  QrCode,
  Shield,
  Receipt,
  Package,
  Palette,
  Calendar,
  Sparkles,
  Briefcase,
  BarChart3,
  Smartphone,
  TrendingUp,
  ChevronDown,
  ShoppingCart,
  MessageSquare,
} from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const FEATURES = [
  {
    icon: Store,
    title: 'Tiendas personalizadas',
    description: 'Crea múltiples tiendas con tu marca, colores y estilo. Personaliza todo desde el Site Builder.',
  },
  {
    icon: Palette,
    title: 'Site Builder visual',
    description: 'Personaliza colores, tipografías, secciones y layout sin escribir una sola línea de código.',
  },
  {
    icon: Bot,
    title: 'Chatbot con IA',
    description:
      'Un asistente entrenado con tu tienda que responde preguntas, sugiere productos y crea pedidos automáticamente.',
    addOn: true,
  },
  {
    icon: ShoppingCart,
    title: 'Pedidos y pagos',
    description:
      'Recibe pedidos con métodos de pago configurables, verificación automática y gestión completa desde el dashboard.',
  },
  {
    icon: Truck,
    title: 'Envíos y retiros',
    description:
      'Configura métodos de entrega flexibles: envío a domicilio, retiro en tienda, delivery local con sus propias reglas.',
  },
  {
    icon: MessageSquare,
    title: 'Checkout por WhatsApp',
    description: 'Cero fricción para LATAM. El cliente completa su pedido y lo envía directo a tu WhatsApp.',
  },
  {
    icon: Receipt,
    title: 'Punto de venta (POS)',
    description:
      'Vende también en tu local físico. Terminal integrada que comparte inventario, clientes y reportes con tu tienda online.',
  },
  {
    icon: Calendar,
    title: 'Agenda de citas',
    description:
      'Integración con Google Calendar. Tus clientes agendan directamente a través del chatbot o tu storefront.',
  },
  {
    icon: Briefcase,
    title: 'Servicios agendables',
    description:
      'Vende servicios con duración, disponibilidad y reservas. Ideal para salones, consultorios y talleres.',
  },
  {
    icon: Package,
    title: 'Inventario inteligente',
    description: 'Control de stock por producto y variante. Deducción automática al crear pedidos.',
  },
  {
    icon: Tags,
    title: 'Variantes y atributos',
    description:
      'Gestiona talles, colores, materiales y cualquier atributo personalizado con stock y precio independiente por variante.',
  },
  {
    icon: Boxes,
    title: 'Combos y paquetes',
    description:
      'Arma bundles con múltiples productos y slots configurables. Vende packs con precios especiales y control de stock.',
  },
  {
    icon: Link2,
    title: 'Productos relacionados',
    description: 'Sugiere productos complementarios en cada ficha para aumentar el ticket promedio de tus ventas.',
  },
  {
    icon: Shield,
    title: 'Cupones y descuentos',
    description: 'Crea cupones con reglas flexibles: porcentaje, monto fijo, uso limitado, fechas de vigencia.',
  },
  {
    icon: Gift,
    title: 'Tarjetas de regalo',
    description:
      'Emite gift cards con monto fijo, porcentaje o productos específicos. Los clientes las canjean con QR en segundos.',
  },
  {
    icon: Star,
    title: 'Reseñas y calificaciones',
    description:
      'Tus clientes dejan reviews verificadas en cada producto. Construí reputación y aumentá la conversión.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard completo',
    description: 'Métricas de ventas, pedidos, productos y reseñas. Todo lo que necesitas en un solo lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Reportes avanzados',
    description:
      'Reportes detallados de ventas, inventario, clientes, productos y cupones. Exportá y tomá decisiones con datos reales.',
  },
  {
    icon: MapPin,
    title: 'Geo analíticas',
    description:
      'Descubre desde dónde compran tus clientes. Insights geográficos y de comportamiento de tu storefront.',
  },
  {
    icon: QrCode,
    title: 'QR Code',
    description: 'Genera códigos QR para tus tiendas. Ideal para comercios físicos que quieren digitalizar su vitrina.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    description: 'Storefronts optimizados para móviles. Tus clientes compran cómodamente desde cualquier dispositivo.',
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
            Desde tiendas digitales hasta un chatbot con inteligencia artificial. Una plataforma completa para vender
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
