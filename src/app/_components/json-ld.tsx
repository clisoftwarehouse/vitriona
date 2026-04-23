import { PLANS, FAQ_ITEMS } from '../_data/landing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

function buildSchemas() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vitriona',
    url: SITE_URL,
    logo: `${SITE_URL}/images/vitriona-logo-light.png`,
    sameAs: [] as string[],
    founder: {
      '@type': 'Organization',
      name: 'CLI Software House',
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vitriona',
    url: SITE_URL,
    inLanguage: 'es',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vitriona',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'E-commerce',
    operatingSystem: 'Web',
    description:
      'Plataforma todo-en-uno para crear tu tienda online, recibir pedidos por WhatsApp, agendar citas y vender con un chatbot de inteligencia artificial.',
    inLanguage: 'es',
    offers: PLANS.map((plan) => ({
      '@type': 'Offer',
      name: `Plan ${plan.name}`,
      description: plan.description,
      price: plan.monthlyPrice.toFixed(2),
      priceCurrency: 'EUR',
      category: 'SaaS subscription',
    })),
    featureList: [
      'Tiendas digitales personalizadas',
      'Site Builder visual sin código',
      'Chatbot con inteligencia artificial',
      'Checkout por WhatsApp',
      'Punto de venta (POS)',
      'Gestión de inventario y variantes',
      'Cupones, descuentos y tarjetas de regalo',
      'Reseñas y calificaciones',
      'Reportes y analíticas avanzadas',
      'Agenda de citas con Google Calendar',
    ],
    publisher: {
      '@type': 'Organization',
      name: 'CLI Software House',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return [organization, website, softwareApplication, faqPage];
}

export function JsonLd() {
  const schemas = buildSchemas();

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
