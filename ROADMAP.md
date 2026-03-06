# Vitriona — Roadmap de Implementación

> SaaS de catálogos digitales y chatbot para comercios de cualquier rubro.
> Última actualización: Mar 2026

---

## Visión del producto

**Vitriona** permite a cualquier comerciante crear catálogos digitales personalizados y compartirlos con sus clientes. El comerciante puede gestionar múltiples negocios y catálogos, personalizar la apariencia, recibir pedidos por WhatsApp o por una bandeja interna, y contar con un chatbot de IA entrenado con su propio catálogo.

### Productos de referencia estudiados
| Producto | Qué aprendemos |
|---|---|
| **Tiendanube / Nuvemshop** | Integración WhatsApp nativa, flujo simple de tienda LATAM |
| **Shopify** | Sistema de variantes, metafields, temas intercambiables |
| **WhatsApp Business Catalog** | Checkout vía mensaje, catálogo simple mobile-first |
| **ManyChat** | Chatbot por WhatsApp con flujos configurables |
| **Stan.store / Beacons** | Storefront tipo "link in bio" con productos, enfoque mobile |
| **Chatbase** | Chatbot entrenado con datos propios del negocio |
| **Jumpseller** | SaaS simple orientado LATAM, onboarding rápido |
| **carta.menu / Slimmenus** | Menús digitales por QR para restaurantes — modelo aplicable a todos los rubros |

### Diferenciadores clave de Vitriona
1. **Multi-negocio / Multi-catálogo** — Un usuario puede tener varios negocios y varios catálogos por negocio (ej. catálogo verano, catálogo navidad)
2. **Chatbot entrenado con el catálogo propio** — El bot conoce los productos y ayuda al cliente a encontrarlos
3. **Checkout flexible** — WhatsApp (cero fricción para LATAM) o bandeja interna con gestión de pedidos
4. **No-code customization** — El comerciante personaliza colores, fuentes y layout sin tocar código
5. **QR code nativo** — Para comercios físicos que quieren digitalizar su vitrina

---

## Stack técnico (estado actual + adiciones)

### Actual
- Next.js 16 (App Router), React 19
- DrizzleORM + Neon (PostgreSQL serverless)
- Auth.js v5 (next-auth beta) + Google OAuth
- TailwindCSS + shadcn/ui
- Resend (emails)
- @node-rs/argon2 (passwords)

### Necesario agregar por fase
| Fase | Herramienta | Propósito |
|---|---|---|
| 1 | **Uploadthing** o **Vercel Blob** | Subida de imágenes de productos y logos |
| 1 | **slugify** (npm) | Generar slugs para URLs públicas |
| 3 | **react-colorful** | Color picker para personalización de catálogo |
| 4 | **OpenAI API** | Chatbot con contexto del catálogo |
| 4 | **Upstash Redis** | Rate limiting y caché de sesiones de chat |
| 5 | **qrcode** (npm) | Generar QR codes descargables |
| 6 | **Stripe** | Suscripciones y billing del SaaS |
| 6 | **Mercado Pago** | Pagos alternativos LATAM |

---

## Arquitectura de Base de Datos (Drizzle ORM)

### Esquema completo propuesto

```sql
-- Negocios del usuario
businesses (
  id, user_id, name, slug,           -- slug → vitriona.app/slug
  description, logo_url, banner_url,
  category,                           -- food | jewelry | clothing | etc.
  phone, email, address,
  whatsapp_number,
  is_active, plan,                    -- free | pro | business
  created_at, updated_at
)

-- Catálogos por negocio (puede haber múltiples)
catalogs (
  id, business_id, name,
  description, is_default, is_active,
  created_at, updated_at
)

-- Configuración visual por catálogo
catalog_settings (
  id, catalog_id,
  primary_color, accent_color, font,
  layout,                             -- grid | list | magazine
  show_prices, show_stock,
  hero_title, hero_subtitle,
  about_text, contact_info,
  seo_title, seo_description
)

-- Categorías dentro de un catálogo
categories (
  id, catalog_id, name, slug,
  description, image_url, sort_order,
  is_active
)

-- Productos
products (
  id, catalog_id, category_id,
  name, slug, description,
  base_price, compare_at_price,       -- para mostrar descuentos
  sku, barcode,
  has_variants,
  stock, low_stock_threshold,
  status,                             -- active | inactive | out_of_stock
  sort_order, is_featured,
  created_at, updated_at
)

-- Imágenes de producto
product_images (
  id, product_id,
  url, alt, sort_order, is_primary
)

-- Variantes (ej. talla S/M/L, color rojo/azul)
product_option_groups (
  id, product_id, name              -- ej. "Talla", "Color"
)

product_option_values (
  id, option_group_id, value, sort_order  -- ej. "S", "M", "Rojo"
)

product_variants (
  id, product_id,
  option_combination,               -- JSON: {talla: "S", color: "Rojo"}
  price_modifier,                   -- +/- sobre base_price
  stock, sku, image_url
)

-- Pedidos
orders (
  id, business_id, catalog_id,
  order_number,                     -- #ORD-0001 auto-increment por negocio
  customer_name, customer_phone, customer_email,
  customer_address, customer_notes,
  subtotal, discount, total,
  status,                           -- pending | confirmed | preparing | shipped | delivered | cancelled
  checkout_type,                    -- whatsapp | internal
  created_at, updated_at
)

order_items (
  id, order_id, product_id, variant_id,
  product_name, variant_label,      -- snapshot del nombre al momento del pedido
  unit_price, quantity, subtotal
)

-- Sesiones del chatbot
chatbot_sessions (
  id, business_id,
  session_token,                    -- UUID anónimo para el cliente
  messages,                         -- JSONB array de mensajes
  metadata,                         -- datos extraídos: productos consultados, etc.
  created_at, last_activity_at
)

-- Planes y suscripciones
subscriptions (
  id, user_id,
  plan,                             -- free | pro | business
  status,                           -- active | cancelled | past_due
  stripe_subscription_id,
  current_period_end,
  created_at
)
```

---

## Fases de Implementación

---

### FASE 1 — Multi-negocio + Catálogo Core (MVP)
> **Objetivo:** Un comerciante puede crear su negocio, cargar productos y compartir su catálogo público.
> **Estimado:** 3–4 semanas

#### 1.1 Gestión de negocios
- [ ] DB: tabla `businesses`
- [ ] Onboarding: formulario para crear primer negocio al registrarse
- [ ] CRUD de negocio: nombre, logo, descripción, teléfono, categoría, número de WhatsApp
- [ ] Generación automática de slug único (ej. `mi-joyeria-ana`)
- [ ] Selector de negocio activo en el sidebar (para multi-negocio)
- [ ] Dashboard: sección "Mis Negocios" con lista y botón crear nuevo

#### 1.2 Gestión de catálogos
- [ ] DB: tablas `catalogs` y `catalog_settings`
- [ ] Crear/editar/eliminar catálogos por negocio
- [ ] Un negocio tiene un catálogo por defecto
- [ ] Dashboard: sección "Catálogos" con tabs por catálogo

#### 1.3 Categorías de productos
- [ ] DB: tabla `categories`
- [ ] CRUD de categorías (nombre, imagen, orden)
- [ ] UI: tabla de categorías con drag-and-drop para reordenar

#### 1.4 Gestión de productos
- [ ] DB: tablas `products`, `product_images`
- [ ] CRUD completo de productos
- [ ] Subida de imágenes (Uploadthing) — múltiples imágenes por producto
- [ ] Asignar categoría al producto
- [ ] Estado: activo / inactivo / sin stock
- [ ] Ordenar y destacar productos
- [ ] Listado con filtros (categoría, estado, búsqueda)

#### 1.5 Página pública del catálogo
- [ ] Ruta: `vitriona.app/[slug]`
- [ ] Layout de catálogo: header con logo y nombre del negocio, grid de productos
- [ ] Filtro por categoría (sidebar o tabs horizontales)
- [ ] Búsqueda de productos en tiempo real
- [ ] Página de detalle del producto: galería, descripción, precio, botón agregar al carrito
- [ ] Diseño mobile-first, totalmente responsive
- [ ] Metadatos SEO básicos (title, description, OG image)

---

### FASE 2 — Carrito y Checkout
> **Objetivo:** El cliente puede agregar productos al carrito y realizar su pedido.
> **Estimado:** 2–3 semanas

#### 2.1 Carrito de compras
- [ ] Estado del carrito en el cliente (Zustand o Context API)
- [ ] Persistencia en `localStorage`
- [ ] Agregar / quitar productos
- [ ] Cambiar cantidad
- [ ] Panel lateral del carrito (slide-over)
- [ ] Badge con cantidad de items en el header del catálogo

#### 2.2 Checkout vía WhatsApp
- [ ] Formulario de checkout: nombre, teléfono (opcional), notas
- [ ] Generar mensaje de WhatsApp con detalle del pedido
  ```
  Hola! Quiero hacer el siguiente pedido:
  
  - 2x Collar de plata (Talla S) — $45.00
  - 1x Pulsera dorada — $28.00
  
  Total: $118.00
  
  Nombre: María López
  ```
- [ ] Botón "Pedir por WhatsApp" → `https://wa.me/{numero}?text={mensaje}`
- [ ] Guardar el pedido en la DB con status `pending`

#### 2.3 Checkout interno (bandeja de pedidos)
- [ ] Formulario de checkout con datos del cliente
- [ ] Confirmación de pedido con número de orden
- [ ] Email de confirmación al cliente (Resend)
- [ ] Pedido guardado en DB

#### 2.4 Bandeja de pedidos (dashboard del comerciante)
- [ ] DB: tablas `orders`, `order_items`
- [ ] Lista de pedidos con filtro por estado
- [ ] Vista detalle de pedido
- [ ] Cambiar estado del pedido (confirmar, preparar, enviar, entregar)
- [ ] Notificación de nuevo pedido (browser push o email)

---

### FASE 3 — Personalización del Catálogo
> **Objetivo:** El comerciante puede hacer su catálogo único con su branding.
> **Estimado:** 2–3 semanas

#### 3.1 Editor de tema
- [ ] DB: tabla `catalog_settings`
- [ ] Color primario y de acento (color picker)
- [ ] Selección de fuente (Inter, Playfair, DM Sans, etc.)
- [ ] Layout: grilla (2, 3, 4 cols), lista, estilo magazine
- [ ] Preview en tiempo real del catálogo público

#### 3.2 Contenido personalizable
- [ ] Hero section: título, subtítulo, imagen de fondo
- [ ] Sección "Sobre nosotros"
- [ ] Horarios de atención
- [ ] Información de contacto (teléfono, email, dirección, redes sociales)
- [ ] Mostrar/ocultar precios
- [ ] Mostrar/ocultar disponibilidad de stock

#### 3.3 QR Code y compartir
- [ ] Generar QR code del catálogo público (descargable en PNG/SVG)
- [ ] Botón "Copiar enlace"
- [ ] Botones de compartir en WhatsApp, Instagram, etc.
- [ ] Widget embebible (código `<iframe>` para sitios externos)

---

### FASE 4 — Variantes e Inventario Avanzado
> **Objetivo:** Soporte completo de variantes y control de stock.
> **Estimado:** 2–3 semanas

#### 4.1 Variantes de productos
- [ ] DB: tablas `product_option_groups`, `product_option_values`, `product_variants`
- [ ] UI para crear opciones (ej. "Talla" con valores S/M/L)
- [ ] Combinaciones automáticas de variantes
- [ ] Precio y stock por variante
- [ ] Imagen por variante
- [ ] Selector de variantes en la página pública del catálogo

#### 4.2 Gestión de inventario
- [ ] Stock por producto/variante
- [ ] Umbral de stock bajo (alertas)
- [ ] Historial de movimientos de stock
- [ ] Descontar stock automáticamente al confirmar pedido
- [ ] Vista de inventario con filtro de stock bajo

---

### FASE 5 — Chatbot de IA
> **Objetivo:** El catálogo público tiene un chatbot que conoce los productos del comercio.
> **Estimado:** 2–3 semanas

#### 5.1 Motor del chatbot
- [ ] Integración OpenAI API (GPT-4o-mini para costo/rendimiento)
- [ ] System prompt dinámico con contexto del negocio y catálogo completo
- [ ] Rate limiting (Upstash Redis) por sesión anónima
- [ ] Guardar sesiones en DB para analytics
- [ ] Streaming de respuestas (SSE)

#### 5.2 Capacidades del bot
- [ ] Responder preguntas sobre productos ("¿Tienes collares de plata?")
- [ ] Buscar productos por descripción
- [ ] Informar sobre disponibilidad y precios
- [ ] Sugerir productos relacionados
- [ ] Agregar productos al carrito desde el chat
- [ ] Redirigir al checkout de WhatsApp

#### 5.3 Configuración del chatbot (dashboard)
- [ ] Nombre y avatar del bot
- [ ] Mensaje de bienvenida personalizado
- [ ] FAQs del negocio (horarios, políticas de envío, etc.)
- [ ] Tono del bot (formal, amigable, divertido)
- [ ] Activar/desactivar el bot por catálogo
- [ ] Historial de conversaciones

---

### FASE 6 — Analytics y Crecimiento
> **Objetivo:** El comerciante entiende el comportamiento de sus clientes.
> **Estimado:** 2 semanas

#### 6.1 Analytics del catálogo
- [ ] Vistas únicas del catálogo (por día/semana/mes)
- [ ] Productos más vistos
- [ ] Búsquedas más frecuentes
- [ ] Tasa de conversión del carrito
- [ ] Origen del tráfico (WhatsApp, link directo, QR)

#### 6.2 Analytics de pedidos
- [ ] Total de ingresos
- [ ] Pedidos por estado
- [ ] Producto más vendido
- [ ] Ticket promedio
- [ ] Exportar reportes a CSV

#### 6.3 Operaciones en masa
- [ ] Importar productos desde CSV (plantilla descargable)
- [ ] Exportar catálogo completo a CSV
- [ ] Edición masiva de precios (porcentaje de aumento/descuento global)
- [ ] Duplicar catálogo

---

### FASE 7 — Planes y Monetización
> **Objetivo:** Activar el modelo de negocio del SaaS.
> **Estimado:** 2–3 semanas

#### 7.1 Definición de planes

| Característica | Free | Pro | Business |
|---|---|---|---|
| Negocios | 1 | 3 | Ilimitados |
| Catálogos por negocio | 1 | 5 | Ilimitados |
| Productos | 30 | 500 | Ilimitados |
| Imágenes por producto | 2 | 10 | Ilimitados |
| Variantes | ✗ | ✓ | ✓ |
| Checkout WhatsApp | ✓ | ✓ | ✓ |
| Checkout interno | ✗ | ✓ | ✓ |
| Personalización de tema | Básica | Completa | Completa |
| Chatbot IA | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✓ | ✓ |
| QR Code | ✓ | ✓ | ✓ |
| Soporte | Email | Prioritario | Dedicado |

#### 7.2 Integración de billing
- [ ] Integración Stripe (suscripciones recurrentes)
- [ ] Webhooks de Stripe (activar/desactivar plan)
- [ ] Página de pricing pública
- [ ] Upgrade/downgrade de plan desde el dashboard
- [ ] Facturación y historial de pagos
- [ ] Período de prueba gratuito (14 días Pro)

---

### FASE 8 — Integraciones Externas (Futuro)
> **Objetivo:** Conectar Vitriona con el ecosistema del comerciante.

- [ ] **WhatsApp Business API** (Meta): recibir y responder pedidos directamente desde la bandeja
- [ ] **Instagram Shopping**: sincronizar catálogo con Instagram
- [ ] **Google My Business**: catálogo visible en Google
- [ ] **Mercado Pago / PayPal**: pagos en línea dentro del checkout interno
- [ ] **Zapier/Make**: webhooks para conectar con cualquier herramienta
- [ ] **Dominio propio**: `catalogo.minegocio.com` apuntando al catálogo

---

## Orden de prioridad recomendado

```
FASE 1  →  FASE 2  →  FASE 3  →  FASE 4  →  FASE 5  →  FASE 6  →  FASE 7  →  FASE 8
 Core       Cart      Themes    Variants    Chatbot    Analytics   Billing  Integrations
```

Para un **MVP lanzable**, lo mínimo es completar **Fase 1 + Fase 2 (checkout WhatsApp)**.
Para un **producto competitivo**, necesitas **Fases 1–3 + Fase 5 (chatbot)**.

---

## Estructura de rutas propuesta

### Dashboard (privado)
```
/dashboard                          → Overview con stats
/dashboard/businesses               → Lista de negocios
/dashboard/businesses/new           → Crear negocio
/dashboard/businesses/[id]          → Editar negocio
/dashboard/catalogs                 → Lista de catálogos del negocio activo
/dashboard/catalogs/[id]/products   → Productos del catálogo
/dashboard/catalogs/[id]/categories → Categorías del catálogo
/dashboard/catalogs/[id]/customize  → Personalización visual
/dashboard/catalogs/[id]/settings   → Configuración del catálogo
/dashboard/orders                   → Bandeja de pedidos
/dashboard/orders/[id]              → Detalle de pedido
/dashboard/chatbot                  → Configuración del chatbot
/dashboard/chatbot/sessions         → Historial de conversaciones
/dashboard/analytics                → Analytics
/dashboard/settings                 → Configuración de cuenta
/dashboard/billing                  → Planes y facturación
```

### Catálogo público (público)
```
/[slug]                             → Catálogo principal del negocio
/[slug]/[catalog-slug]              → Catálogo específico (si tiene múltiples)
/[slug]/producto/[product-slug]     → Página de producto
/[slug]/carrito                     → Carrito (o panel lateral)
/[slug]/checkout                    → Checkout interno
/[slug]/pedido/[order-number]       → Confirmación de pedido
```

---

## Próximos pasos inmediatos

Comenzar con **Fase 1.1 — Gestión de negocios**:

1. Crear migración de DB para tabla `businesses`
2. Formulario de onboarding post-registro
3. CRUD de negocios en el dashboard
4. Selector de negocio activo en el sidebar

---

*Documento vivo — actualizar checkboxes conforme se completen las tareas.*
