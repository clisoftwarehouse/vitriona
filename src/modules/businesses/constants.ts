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
