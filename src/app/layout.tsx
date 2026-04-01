import type { Metadata } from 'next';

import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vitriona — Catálogos digitales y asistente IA para tu negocio',
    template: '%s | Vitriona',
  },
  description:
    'Crea catálogos digitales, gestiona productos y agenda citas con un asistente de inteligencia artificial. La plataforma todo-en-uno para negocios modernos.',
  keywords: [
    'catálogo digital',
    'chatbot IA',
    'agendar citas',
    'gestión de negocios',
    'asistente virtual',
    'Google Calendar',
    'catálogo online',
    'tienda digital',
  ],
  authors: [{ name: 'CLI Software House' }],
  creator: 'CLI Software House',
  openGraph: {
    type: 'website',
    locale: 'es_DO',
    url: SITE_URL,
    siteName: 'Vitriona',
    title: 'Vitriona — Catálogos digitales y asistente IA para tu negocio',
    description:
      'Crea catálogos digitales, gestiona productos y agenda citas con un asistente de inteligencia artificial.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitriona — Catálogos digitales y asistente IA para tu negocio',
    description:
      'Crea catálogos digitales, gestiona productos y agenda citas con un asistente de inteligencia artificial.',
  },
  robots: {
    index: true,
    follow: true,
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
