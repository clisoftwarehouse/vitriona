import type { Metadata } from 'next';

import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vitriona | Crea tu tienda online con IA y WhatsApp — Ecommerce todo-en-uno',
    template: '%s | Vitriona',
  },
  description:
    'Crea tu tienda online en minutos con Vitriona. Recibe pedidos por WhatsApp, agenda citas y vende con un chatbot de IA. Plan gratis, sin tarjeta de crédito.',
  applicationName: 'Vitriona',
  category: 'E-commerce',
  keywords: [
    'crear tienda online',
    'tienda online',
    'tienda digital',
    'tienda virtual',
    'ecommerce',
    'plataforma ecommerce',
    'ecommerce con WhatsApp',
    'tienda online WhatsApp',
    'checkout por WhatsApp',
    'chatbot IA',
    'chatbot con inteligencia artificial',
    'asistente virtual IA',
    'punto de venta online',
    'POS online',
    'catálogo digital',
    'catálogo online',
    'tarjetas de regalo',
    'gift cards online',
    'agendar citas online',
    'Google Calendar',
    'alternativa Shopify',
    'ecommerce para pequeños negocios',
    'tienda online Latinoamérica',
    'tienda online República Dominicana',
  ],
  authors: [{ name: 'CLI Software House', url: 'https://clisoftwarehouse.com' }],
  creator: 'CLI Software House',
  publisher: 'CLI Software House',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_DO',
    alternateLocale: ['es_ES', 'es_MX', 'es_AR', 'es_CO'],
    url: SITE_URL,
    siteName: 'Vitriona',
    title: 'Vitriona | Crea tu tienda online con IA y WhatsApp',
    description:
      'Crea tu tienda online en minutos. Recibe pedidos por WhatsApp, agenda citas y vende con un chatbot de IA. Plan gratis, sin tarjeta de crédito.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitriona | Crea tu tienda online con IA y WhatsApp',
    description:
      'Crea tu tienda online en minutos. Recibe pedidos por WhatsApp, agenda citas y vende con un chatbot de IA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='es' suppressHydrationWarning>
      <body className='antialiased' suppressHydrationWarning>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position='bottom-right' />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
