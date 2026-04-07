export const BUSINESS_CATEGORIES = [
  { value: 'food', label: 'Alimentos y bebidas' },
  { value: 'jewelry', label: 'Joyería y accesorios' },
  { value: 'clothing', label: 'Ropa y moda' },
  { value: 'electronics', label: 'Electrónica' },
  { value: 'beauty', label: 'Belleza y cuidado personal' },
  { value: 'home', label: 'Hogar y decoración' },
  { value: 'sports', label: 'Deportes y fitness' },
  { value: 'toys', label: 'Juguetes y juegos' },
  { value: 'books', label: 'Libros y papelería' },
  { value: 'services', label: 'Servicios' },
  { value: 'other', label: 'Otro' },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]['value'];

export const CURRENCIES = [
  { value: 'USD', label: 'USD — Dólar estadounidense', symbol: '$' },
  { value: 'DOP', label: 'DOP — Peso dominicano', symbol: 'RD$' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { value: 'MXN', label: 'MXN — Peso mexicano', symbol: '$' },
  { value: 'COP', label: 'COP — Peso colombiano', symbol: '$' },
  { value: 'ARS', label: 'ARS — Peso argentino', symbol: '$' },
  { value: 'CLP', label: 'CLP — Peso chileno', symbol: '$' },
  { value: 'PEN', label: 'PEN — Sol peruano', symbol: 'S/' },
  { value: 'BRL', label: 'BRL — Real brasileño', symbol: 'R$' },
  { value: 'GBP', label: 'GBP — Libra esterlina', symbol: '£' },
  { value: 'CAD', label: 'CAD — Dólar canadiense', symbol: '$' },
  { value: 'GTQ', label: 'GTQ — Quetzal guatemalteco', symbol: 'Q' },
  { value: 'HNL', label: 'HNL — Lempira hondureño', symbol: 'L' },
  { value: 'NIO', label: 'NIO — Córdoba nicaragüense', symbol: 'C$' },
  { value: 'CRC', label: 'CRC — Colón costarricense', symbol: '₡' },
  { value: 'PAB', label: 'PAB — Balboa panameño', symbol: 'B/.' },
  { value: 'UYU', label: 'UYU — Peso uruguayo', symbol: '$U' },
  { value: 'BOB', label: 'BOB — Boliviano', symbol: 'Bs' },
  { value: 'PYG', label: 'PYG — Guaraní paraguayo', symbol: '₲' },
  { value: 'VES', label: 'VES — Bolívar venezolano', symbol: 'Bs.S' },
] as const;

export const LOCALE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
] as const;

export const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Lunes', short: 'Lun' },
  { key: 'tue', label: 'Martes', short: 'Mar' },
  { key: 'wed', label: 'Miércoles', short: 'Mié' },
  { key: 'thu', label: 'Jueves', short: 'Jue' },
  { key: 'fri', label: 'Viernes', short: 'Vie' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
] as const;

export const DEFAULT_BUSINESS_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  mon: { open: '09:00', close: '18:00', closed: false },
  tue: { open: '09:00', close: '18:00', closed: false },
  wed: { open: '09:00', close: '18:00', closed: false },
  thu: { open: '09:00', close: '18:00', closed: false },
  fri: { open: '09:00', close: '18:00', closed: false },
  sat: { open: '09:00', close: '14:00', closed: false },
  sun: { open: '09:00', close: '14:00', closed: true },
};
