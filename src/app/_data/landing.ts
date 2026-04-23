export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Necesito saber programar?',
    answer:
      'No. Vitriona está diseñado para que cualquier persona pueda crear su tienda digital sin conocimientos técnicos. Todo se configura desde el dashboard con un editor visual.',
  },
  {
    question: '¿Cómo funciona el chatbot con IA?',
    answer:
      'El chatbot con IA es un add-on que se agrega a cualquier plan. Se entrena automáticamente con los productos de tu tienda y puede listar productos, buscar por categoría, crear pedidos, mostrar métodos de pago y hasta agendar citas — todo de forma conversacional. Puedes elegir entre 3 niveles según tu volumen de consultas.',
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
      'Sí. Vitriona te permite gestionar varios negocios desde una sola cuenta, cada uno con su propia tienda, productos, chatbot y configuración. Cada negocio utiliza su propia suscripción.',
  },
  {
    question: '¿Mis clientes necesitan crear cuenta?',
    answer:
      'No. Tus clientes acceden a tu tienda pública con un enlace directo (vitriona.app/tu-negocio) y pueden hacer pedidos sin registrarse.',
  },
];

export type Plan = {
  name: string;
  monthlyPrice: number;
  description: string;
};

export const PLANS: Plan[] = [
  {
    name: 'Gratis',
    monthlyPrice: 0,
    description: 'Ideal para probar la plataforma sin compromiso.',
  },
  {
    name: 'Emprendedor',
    monthlyPrice: 15,
    description: 'Para negocios que quieren crecer sin límites.',
  },
  {
    name: 'Negocio',
    monthlyPrice: 30,
    description: 'Para negocios que necesitan escalar.',
  },
];
