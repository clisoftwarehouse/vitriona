# Vitriona — Plan de Mejoras v2

> Análisis completo y plan detallado por fases.
> Última actualización: 2026-03-10

---

## Estado Actual del Proyecto

### Base de Datos (10 tablas)

| Tabla | Campos clave | Gaps identificados |
|---|---|---|
| `users` | name, email, password, role, image | Sin preferencias, timezone, idioma, teléfono |
| `businesses` | name, slug, logo, category, phone, email, address, whatsapp | Sin currency, timezone, idioma, website, horarios, redes sociales propias |
| `catalogs` | name, description, isDefault | Muy escaso — sin imagen, slug, tipo, orden |
| `catalog_settings` | ~40 campos de tema/hero/secciones/SEO | Falta: temas preset, radius slider, acciones CTA, secciones custom |
| `categories` | name, slug, imageUrl, sortOrder | Correcto |
| `products` | name, price, sku, stock, status | Sin atributos/características, peso, dimensiones, tipo (producto/servicio) |
| `product_images` | url, alt, sortOrder | Correcto |
| `chatbot_configs` | botName, systemPrompt, businessInfo(JSON), faqs | businessInfo es JSON crudo, sin knowledge base, sin personalidad, sin acceso a catálogo |
| `orders` | customerName/Phone/Email, total, status | Sin deducción de inventario, sin historial de cambios |
| `order_items` | productName, unitPrice, quantity | Correcto |

### Módulos Funcionales

- **Auth**: ✅ Completo (login, register, Google OAuth, OTP, reset password)
- **Businesses**: ✅ CRUD básico (falta config avanzada)
- **Catalogs**: ✅ CRUD básico (muy escaso)
- **Categories**: ✅ CRUD completo
- **Products**: ✅ CRUD con imágenes (falta atributos, inventario)
- **Orders**: ⚠️ Lectura + cambio de status (sin deducción de stock)
- **Chatbot**: ⚠️ Gemini + Calendar (info negocio es JSON crudo, sin acceso a datos del catálogo)
- **Site Builder**: ⚠️ Preview inline funcional (falta personalización avanzada)
- **Storefront**: ✅ Funcional (muestra solo 1 catálogo default)

### Bugs y Inconsistencias Detectados

1. **Storefront muestra solo el catálogo default** — `getDefaultCatalog(business.id)` en `[slug]/page.tsx`. No hay vista multi-catálogo.
2. **Precio hardcodeado a USD** — `formatPrice` en storefront usa `currency: 'USD'` sin respetar la moneda del negocio.
3. **Sin gestión de inventario** — El stock existe en la tabla `products` pero nunca se deduce al crear un pedido.
4. **businessInfo del chatbot es JSON crudo** — UX pobre, propenso a errores.
5. **Dashboard con datos mock** — `src/app/dashboard/page.tsx` usa constantes hardcodeadas para stats y órdenes.
6. **Sin perfil de usuario** — No existe ruta ni action para editar nombre, contraseña o preferencias.
7. **Catálogos muy escasos** — Solo tienen `name` y `description`, sin imagen ni configuración propia.
8. **Site builder: CTA buttons sin acción configurable** — Solo guardan texto y link estático.
9. **Site builder: rounded corners es boolean** — Debería ser un slider (0px a 2rem).
10. **Site builder: badge icon fijo** — Siempre usa `Sparkles`.
11. **Sin secciones custom en el builder** — Solo hero, featured, categories, about, announcement.
12. **Sin selector de idioma** — Ni en el negocio ni en el chatbot.

---

## Plan por Fases

---

### FASE 1 — Perfil de Usuario y Fundamentos

**Objetivo**: Perfil completo del usuario, preferencias persistentes, base para i18n.

#### 1.1 — Migración de Schema

Agregar columnas a `users`:

```
phone             text
timezone          text        default 'America/Santo_Domingo'
locale            text        default 'es'        -- 'es' | 'en' | 'pt'
avatarUrl         text                             -- foto de perfil (separado de image de OAuth)
notifyEmail       boolean     default true
notifyPush        boolean     default false
onboardingDone    boolean     default false
```

Crear tabla `user_preferences`:

```
id                text PK
userId            text FK → users.id UNIQUE
theme             text        default 'system'    -- 'light' | 'dark' | 'system'
sidebarCollapsed  boolean     default false
defaultBusinessId text FK → businesses.id nullable
```

#### 1.2 — Server Actions

- `getUserProfile()`  — fetch user + preferences
- `updateUserProfile({ name, phone, timezone, locale, avatarUrl })`
- `updateUserPassword({ currentPassword, newPassword })`
- `updateUserPreferences({ theme, sidebarCollapsed, defaultBusinessId })`
- `deleteUserAccount()` — soft delete o hard delete con confirmación

#### 1.3 — Rutas y UI

- **Ruta**: `/dashboard/settings` con sub-tabs:
  - **Perfil**: Nombre, email (readonly si OAuth), teléfono, avatar upload, timezone selector
  - **Seguridad**: Cambiar contraseña (solo si credentials), sesiones activas
  - **Preferencias**: Tema, sidebar, negocio por defecto, locale
  - **Cuenta**: Eliminar cuenta

#### 1.4 — Integración

- El sidebar lee `defaultBusinessId` de preferences para auto-seleccionar negocio
- El `locale` se usa para formatear fechas y monedas en todo el dashboard
- El `theme` persiste en DB (actualmente solo en localStorage via next-themes)

#### Archivos a crear/modificar:

```
src/db/schema.ts                                          -- columnas + tabla
src/db/migrations/XXXX_user_profile.sql                   -- migración
src/modules/users/server/actions/                          -- 4 actions
src/modules/users/ui/components/profile-form.tsx
src/modules/users/ui/components/security-form.tsx
src/modules/users/ui/components/preferences-form.tsx
src/modules/users/ui/schemas/user.schemas.ts
src/app/dashboard/settings/page.tsx
src/app/dashboard/settings/layout.tsx                     -- tabs layout
src/components/layouts/admin-layout/app-sidebar.tsx        -- link a settings
src/components/layouts/admin-layout/user-menu.tsx          -- link a perfil
```

---

### FASE 2 — Módulo de Negocios Mejorado

**Objetivo**: Negocio más completo con currency, idioma, horarios, redes, y UI mejorada.

#### 2.1 — Migración de Schema

Agregar columnas a `businesses`:

```
currency          text        default 'USD'       -- ISO 4217 ('USD', 'DOP', 'EUR', etc.)
locale            text        default 'es'
timezone          text        default 'America/Santo_Domingo'
website           text
instagramUrl      text
facebookUrl       text
tiktokUrl         text
twitterUrl        text
youtubeUrl        text
taxId             text                             -- RNC / NIF / Tax ID
businessHours     jsonb                            -- { mon: { open: "09:00", close: "18:00", closed: false }, ... }
country           text
city              text
state             text
zipCode           text
```

#### 2.2 — Server Actions

- Actualizar `createBusinessAction` y `updateBusinessAction` con los campos nuevos
- `getBusinessDetail(businessId)` — fetch completo para la vista de detalle
- Actualizar schemas Zod

#### 2.3 — UI Mejorada

**Vista de lista de negocios** (`/dashboard/businesses`):
- Mostrar **logo real** en lugar del icono genérico
- Mostrar currency, categoría, status como badges
- Agregar contadores (catálogos, productos, pedidos)

**Formulario de negocio** (create/edit):
- Sección **Información básica**: nombre, slug, descripción, categoría, logo, banner
- Sección **Contacto**: phone, email, whatsapp, website
- Sección **Ubicación**: address, city, state, country, zipCode
- Sección **Configuración regional**: currency selector (top 20 monedas), timezone, locale
- Sección **Redes sociales**: instagram, facebook, tiktok, twitter, youtube
- Sección **Horarios**: Editor visual de horarios por día de la semana
- Sección **Fiscal**: taxId

**Vista de detalle** (`/dashboard/businesses/[id]`):
- Dashboard del negocio con cards de resumen (logo + nombre grande)
- Accesos rápidos: catálogos, productos, pedidos, chatbot, builder
- Stats reales: total productos, total pedidos, ingresos

#### 2.4 — Impacto en Storefront

- `formatPrice` ahora usa `business.currency` en vez de hardcoded 'USD'
- Footer muestra redes sociales reales del negocio (no del catalog_settings)
- Horarios visibles en sección "Sobre nosotros"

#### Archivos a crear/modificar:

```
src/db/schema.ts                                          -- columnas businesses
src/modules/businesses/constants.ts                       -- CURRENCIES, COUNTRIES
src/modules/businesses/ui/schemas/business.schemas.ts     -- schema actualizado
src/modules/businesses/ui/components/business-form.tsx    -- formulario expandido
src/modules/businesses/ui/components/business-card.tsx    -- tarjeta con logo
src/modules/businesses/ui/components/business-hours-editor.tsx
src/app/dashboard/businesses/page.tsx                     -- lista mejorada
src/app/dashboard/businesses/[id]/page.tsx                -- dashboard del negocio
src/modules/storefront/                                   -- formatPrice dinámico
```

---

### FASE 3 — Chatbot Inteligente

**Objetivo**: Chatbot configurable con UI amigable, knowledge base por PDF, personalidad, acceso a datos del negocio, y capacidad de crear pedidos.

#### 3.1 — Migración de Schema

Modificar `chatbot_configs`:

```
-- Reemplazar businessInfo (jsonb genérico) por campos estructurados:
personality       text                             -- "Eres amable y profesional..."
tone              text        default 'professional' -- 'professional' | 'friendly' | 'casual' | 'formal'
language          text        default 'es'
autoAccessCatalog boolean     default true          -- acceso auto a catálogos/productos
orderEnabled      boolean     default false         -- puede crear pedidos
maxTokens         integer     default 1024
```

Crear tabla `chatbot_knowledge_entries`:

```
id                text PK
chatbotConfigId   text FK → chatbot_configs.id
key               text NOT NULL                    -- "horarios", "politica_devolucion"
value             text NOT NULL                    -- "Lunes a Viernes 9am-6pm"
category          text                             -- "general", "envios", "pagos"
sortOrder         integer     default 0
createdAt         timestamp
```

Crear tabla `chatbot_knowledge_files`:

```
id                text PK
chatbotConfigId   text FK → chatbot_configs.id
fileName          text NOT NULL
fileUrl           text NOT NULL                    -- URL del PDF en storage
fileSize          integer
mimeType          text
extractedText     text                             -- texto extraído del PDF
status            text        default 'processing' -- 'processing' | 'ready' | 'error'
createdAt         timestamp
```

#### 3.2 — Backend: Extracción de PDF

- Endpoint `POST /api/chatbot/upload-knowledge` — recibe PDF, extrae texto con `pdf-parse`
- Guarda el archivo en storage, extrae texto, actualiza status a 'ready'
- El texto extraído se incluye en el context del prompt

#### 3.3 — Backend: Acceso a Datos del Negocio

Nuevas tools para el chatbot (function calling de Gemini):

- **`search_products`**: Busca productos por nombre/categoría, devuelve nombre, precio, descripción, imagen
- **`get_categories`**: Lista categorías disponibles
- **`get_product_details`**: Detalle completo de un producto por nombre o ID
- **`add_to_cart`**: Agrega producto al carrito del cliente (via session)
- **`get_cart`**: Muestra el carrito actual
- **`create_order`**: Crea el pedido, genera link de WhatsApp con el resumen

Flujo de pedido por chatbot:
1. Cliente pide un producto → bot usa `search_products` → muestra opciones
2. Cliente confirma → bot usa `add_to_cart`
3. Cliente quiere finalizar → bot pide nombre/teléfono → usa `create_order`
4. Bot devuelve link de WhatsApp con el pedido + confirma creación en la plataforma

#### 3.4 — UI del Formulario de Configuración

Reemplazar el JSON textarea por secciones amigables:

- **Personalidad**: Textarea con placeholder guiado + selector de tono
- **Idioma**: Selector de idioma principal del bot
- **Información del negocio**: Lista de key-value editable (add/remove rows)
  - Cada entry tiene: categoría (dropdown), clave (input), valor (textarea)
  - Ejemplo: `[Envíos] Tiempo de entrega → "3-5 días hábiles en Santo Domingo"`
- **Base de conocimiento (PDFs)**: Upload area con lista de archivos subidos, status indicator
- **Acceso a datos**: Toggle "El bot puede acceder a catálogos y productos"
- **Pedidos por chat**: Toggle "Permitir que el bot cree pedidos"
- **FAQs**: Se mantiene igual pero con mejor UI (drag & drop reorder)

#### 3.5 — Integración en Chat Route

- `POST /api/chat/[businessId]` ahora:
  1. Carga knowledge entries + knowledge files (extractedText)
  2. Carga catálogos + productos del negocio si `autoAccessCatalog = true`
  3. Registra las tools de productos/carrito/pedido si `orderEnabled = true`
  4. Incluye personality + tone en el system prompt

#### Archivos a crear/modificar:

```
src/db/schema.ts                                          -- tablas + columnas
src/modules/ai-chat/server/lib/ai.ts                      -- nuevas tools
src/modules/ai-chat/server/lib/pdf-extract.ts             -- extracción PDF
src/modules/ai-chat/server/actions/upsert-chatbot-config.action.ts
src/modules/ai-chat/server/actions/knowledge-entries.action.ts
src/modules/ai-chat/server/actions/knowledge-files.action.ts
src/modules/ai-chat/ui/components/chatbot-config-form.tsx -- rewrite completo
src/modules/ai-chat/ui/components/knowledge-entries-editor.tsx
src/modules/ai-chat/ui/components/knowledge-files-upload.tsx
src/app/api/chat/[businessId]/route.ts                    -- context enriquecido
src/app/api/chatbot/upload-knowledge/route.ts             -- upload PDF
```

---

### FASE 4 — Catálogos Multi-Vista y Storefront Multi-Catálogo

**Objetivo**: Catálogos más completos, storefront muestra todos los catálogos del negocio.

#### 4.1 — Migración de Schema

Agregar columnas a `catalogs`:

```
slug              text                             -- para URLs amigables
imageUrl          text                             -- foto de portada
type              text        default 'general'    -- 'general' | 'seasonal' | 'premium' | 'services'
sortOrder         integer     default 0
productCount      integer     default 0            -- counter cache (o computed)
```

#### 4.2 — Server Actions

- Actualizar `createCatalog` / `updateCatalog` con campos nuevos
- `getCatalogsByBusiness(businessId)` — todos los catálogos activos
- `getCatalogBySlug(businessSlug, catalogSlug)` — para la ruta pública

#### 4.3 — Dashboard: Gestión de Catálogos Mejorada

**Lista de catálogos** (`/dashboard/businesses/[id]/catalogs`):
- Cards con imagen de portada, nombre, tipo, conteo de productos
- Badge "Default" en el catálogo principal
- Drag & drop para reordenar

**Formulario de catálogo**:
- Nombre, slug (auto-generado), descripción, tipo, imagen de portada
- Toggle "Catálogo principal"

#### 4.4 — Storefront: Vista Multi-Catálogo

**Nueva arquitectura de rutas**:

```
/[slug]                    → Landing del negocio (muestra TODOS los catálogos)
/[slug]/[catalogSlug]      → Vista de un catálogo específico
/[slug]/producto/[productSlug]  → Se mantiene
/[slug]/checkout            → Se mantiene
```

**Landing del negocio** (`/[slug]/page.tsx`):
- Hero del negocio (usa settings del catálogo default)
- Grid de catálogos: tarjeta con imagen, nombre, descripción, conteo productos
- Al hacer click en un catálogo → `/[slug]/[catalogSlug]`
- Si solo hay 1 catálogo, comportamiento actual (mostrar productos directamente)

**Vista de catálogo** (`/[slug]/[catalogSlug]/page.tsx`):
- Misma UI actual de `StorefrontCatalog` pero scoped al catálogo seleccionado
- Breadcrumb: Negocio > Catálogo
- Cada catálogo puede tener sus propios settings (o heredar del default)

#### Archivos a crear/modificar:

```
src/db/schema.ts
src/modules/catalogs/server/actions/                      -- CRUD actualizado
src/modules/catalogs/ui/components/catalog-form.tsx        -- form mejorado
src/app/[slug]/page.tsx                                   -- landing multi-catálogo
src/app/[slug]/[catalogSlug]/page.tsx                     -- NEW vista catálogo
src/modules/storefront/server/queries/get-storefront-data.ts
src/modules/storefront/ui/components/catalog-grid.tsx      -- grid de catálogos
```

---

### FASE 5 — Productos, Servicios, Atributos e Inventario

**Objetivo**: Productos con atributos dinámicos, módulo de servicios, gestión de inventario.

#### 5.1 — Migración de Schema

Crear tabla `product_attributes` (definiciones por negocio):

```
id                text PK
businessId        text FK → businesses.id
name              text NOT NULL                    -- "Talla", "Material", "Color"
slug              text NOT NULL
type              text        default 'text'       -- 'text' | 'number' | 'select' | 'color' | 'boolean'
options           jsonb                            -- ["S","M","L","XL"] para type='select'
isRequired        boolean     default false
sortOrder         integer     default 0
createdAt         timestamp
```

Crear tabla `product_attribute_values` (valores por producto):

```
id                text PK
productId         text FK → products.id
attributeId       text FK → product_attributes.id
value             text NOT NULL                    -- "M", "Oro 18k", "#FF0000"
```

Agregar columnas a `products`:

```
type              text        default 'product'    -- 'product' | 'service'
weight            numeric(10,2)                    -- peso en kg/lb
dimensions        jsonb                            -- { length, width, height, unit }
minStock          integer     default 0            -- alerta de stock bajo
trackInventory    boolean     default true
tags              text[]                           -- tags para búsqueda
```

Crear tabla `services` (módulo de servicios):

```
id                text PK
catalogId         text FK → catalogs.id
categoryId        text FK → categories.id nullable
name              text NOT NULL
slug              text NOT NULL
description       text
price             numeric(10,2) NOT NULL default 0
durationMinutes   integer                          -- duración del servicio
imageUrl          text
isActive          boolean     default true
sortOrder         integer     default 0
createdAt         timestamp
updatedAt         timestamp
```

Crear tabla `inventory_movements`:

```
id                text PK
productId         text FK → products.id
type              text NOT NULL                    -- 'in' | 'out' | 'adjustment' | 'order'
quantity          integer NOT NULL                 -- positivo=entrada, negativo=salida
reason            text                             -- "Pedido #123", "Ajuste manual", "Restock"
referenceId       text                             -- orderId o null
previousStock     integer NOT NULL
newStock          integer NOT NULL
createdBy         text FK → users.id nullable
createdAt         timestamp
```

#### 5.2 — Módulo de Atributos de Producto

**Dashboard** (`/dashboard/businesses/[id]/attributes`):
- CRUD de atributos: nombre, tipo, opciones (para select/color)
- Los atributos son **por negocio**, no por catálogo
- Al crear un producto, se muestran los atributos definidos para ese negocio

**En el formulario de producto**:
- Sección "Características" debajo de los campos base
- Cada atributo definido aparece como un campo del tipo correcto:
  - `text` → Input
  - `number` → Input numérico
  - `select` → Select con las opciones definidas
  - `color` → Color picker
  - `boolean` → Checkbox

#### 5.3 — Módulo de Servicios

**Dashboard** (`/dashboard/businesses/[id]/catalogs/[catalogId]/services`):
- CRUD similar a productos pero para servicios
- Campos: nombre, descripción, precio, duración, imagen, categoría
- El campo `durationMinutes` es crucial para la integración con el chatbot (agendamiento)

**En el storefront**:
- Los servicios se muestran como tarjetas similares a productos
- Pueden tener botón "Agendar" en vez de "Agregar al carrito"
- Integración con el chatbot para agendamiento

#### 5.4 — Módulo de Inventario

**Dashboard** (`/dashboard/businesses/[id]/inventory`):
- Vista de inventario: lista de productos con stock actual, stock mínimo, status
- Filtros: stock bajo, sin stock, por catálogo/categoría
- Acciones: ajuste manual de stock (+/-), importar stock (CSV futuro)
- Historial de movimientos por producto

**Lógica de negocio**:
- Al crear un pedido → `createInventoryMovement(type: 'order', quantity: -N)`
- Al cancelar un pedido → `createInventoryMovement(type: 'adjustment', quantity: +N)`
- El status del producto cambia automáticamente a `out_of_stock` si stock llega a 0

#### 5.5 — Storefront: Mostrar Atributos

- En la página de detalle del producto (`/[slug]/producto/[productSlug]`):
  - Tabla de características: Talla → M, Material → Oro 18k, etc.
  - Badges de tags
- En las tarjetas de producto: mostrar 1-2 atributos clave debajo del precio

#### Archivos a crear/modificar:

```
src/db/schema.ts                                          -- 4 tablas nuevas + columnas
src/modules/products/server/actions/                       -- CRUD actualizado
src/modules/products/ui/components/product-form.tsx        -- atributos dinámicos
src/modules/products/ui/components/product-attributes-section.tsx
src/modules/attributes/server/actions/                     -- CRUD atributos
src/modules/attributes/ui/components/attributes-manager.tsx
src/modules/services/server/actions/                       -- CRUD servicios
src/modules/services/ui/components/service-form.tsx
src/modules/inventory/server/actions/                      -- movimientos
src/modules/inventory/ui/components/inventory-dashboard.tsx
src/modules/inventory/ui/components/stock-adjustment-dialog.tsx
src/modules/inventory/ui/components/movement-history.tsx
src/app/dashboard/businesses/[id]/attributes/page.tsx
src/app/dashboard/businesses/[id]/catalogs/[catalogId]/services/page.tsx
src/app/dashboard/businesses/[id]/inventory/page.tsx
```

---

### FASE 6 — Pedidos con Inventario

**Objetivo**: Los pedidos deducen inventario, historial completo, notificaciones.

#### 6.1 — Migración de Schema

Agregar columnas a `orders`:

```
inventoryDeducted boolean     default false        -- flag para evitar doble deducción
cancelledAt       timestamp
cancelReason      text
```

Crear tabla `order_status_history`:

```
id                text PK
orderId           text FK → orders.id
fromStatus        text
toStatus          text NOT NULL
changedBy         text FK → users.id nullable      -- null si es automático
note              text
createdAt         timestamp
```

#### 6.2 — Lógica de Negocio

**Al crear pedido** (`createOrderAction`):
1. Verificar stock disponible para cada item
2. Si no hay stock suficiente → error con detalle de qué productos faltan
3. Crear el pedido
4. Deducir inventario por cada item → `inventory_movements(type: 'order')`
5. Actualizar `products.stock` (decrement)
6. Si stock llega a 0 → actualizar `products.status = 'out_of_stock'`
7. Marcar `order.inventoryDeducted = true`

**Al cancelar pedido** (`cancelOrderAction`):
1. Si `inventoryDeducted = true` → restaurar stock
2. Crear `inventory_movements(type: 'adjustment')` por cada item
3. Actualizar `products.stock` (increment)
4. Si producto estaba `out_of_stock` y ahora tiene stock → `status = 'active'`
5. Registrar en `order_status_history`

**Al cambiar status** (`updateOrderStatusAction`):
- Registrar en `order_status_history`
- Si status = 'cancelled' → ejecutar flujo de cancelación

#### 6.3 — UI de Pedidos Mejorada

- **Detalle de pedido**: Timeline visual de cambios de status
- **Botón de cancelar**: Con modal de confirmación y razón
- **Indicador de stock**: Warning si algún item ya no tiene stock suficiente
- **Filtros**: Por status, fecha, cliente, monto

#### Archivos a crear/modificar:

```
src/db/schema.ts
src/modules/storefront/server/actions/create-order.action.ts  -- inventario
src/modules/orders/server/actions/update-order-status.action.ts
src/modules/orders/server/actions/cancel-order.action.ts      -- NEW
src/modules/orders/ui/components/orders-table.tsx              -- mejorada
src/modules/orders/ui/components/order-detail.tsx              -- NEW
src/modules/orders/ui/components/order-timeline.tsx            -- NEW
```

---

### FASE 7 — Site Builder Avanzado

**Objetivo**: Temas preset, radius slider, CTAs configurables, secciones custom, SEO completo, social links.

#### 7.1 — Migración de Schema

Modificar `catalog_settings`:

```
-- Reemplazar roundedCorners (boolean) por:
borderRadius      integer     default 12           -- 0 a 24 (px value mapped to rem)

-- Hero enhancements:
heroCtaPrimaryAction  text    default 'scroll'     -- 'scroll' | 'link' | 'whatsapp' | 'catalog'
heroCtaSecondaryAction text   default 'link'
heroBadgeIcon     text        default 'sparkles'   -- nombre del icono Lucide

-- Announcement enhancements:
announcementLink      text
announcementDismissable boolean default false
announcementIcon      text

-- Theme presets:
themePreset       text        default 'custom'     -- 'light' | 'dark' | 'elegant' | 'vibrant' | 'custom'
darkMode          boolean     default false         -- la tienda soporta modo oscuro

-- Social links (mover de jsonb a columnas para mayor control en builder):
socialInstagram   text
socialFacebook    text
socialTwitter     text
socialTiktok      text
socialYoutube     text
socialWhatsapp    text
socialEmail       text
socialPhone       text

-- SEO avanzado:
seoCanonicalUrl   text
seoKeywords       text                             -- comma separated
seoJsonLd         jsonb                            -- structured data override
faviconUrl        text
```

Crear tabla `custom_sections`:

```
id                text PK
catalogSettingsId text FK → catalog_settings.id
type              text NOT NULL                    -- 'info' | 'banner' | 'promo' | 'products_by_category' | 'products_by_catalog' | 'testimonials' | 'gallery'
title             text
subtitle          text
content           jsonb                            -- config específica del tipo
imageUrl          text
backgroundColor   text
textColor         text
sortOrder         integer     default 0
isEnabled         boolean     default true
createdAt         timestamp
```

#### 7.2 — Temas Preset

Definir presets de colores que el usuario puede seleccionar con un click:

| Preset | Primary | BG | Surface | Text | Border |
|---|---|---|---|---|---|
| Light | #000000 | #ffffff | #f9fafb | #111827 | #e5e7eb |
| Dark | #ffffff | #0a0a0a | #171717 | #fafafa | #262626 |
| Elegant | #1a1a2e | #fefefe | #f0f0f5 | #1a1a2e | #d4d4e0 |
| Vibrant | #7c3aed | #ffffff | #f5f3ff | #1e1b4b | #e0e0ff |
| Ocean | #0ea5e9 | #ffffff | #f0f9ff | #0c4a6e | #bae6fd |

El usuario puede seleccionar un preset y luego customizar colores individuales (cambia a `themePreset: 'custom'`).

#### 7.3 — Border Radius Slider

- Reemplazar el toggle por un slider de 0 a 24
- Mapeo: `0 → 0px`, `4 → 0.25rem`, `8 → 0.5rem`, `12 → 0.75rem`, `16 → 1rem`, `20 → 1.25rem`, `24 → 1.5rem`
- Preview se actualiza en tiempo real

#### 7.4 — CTA Buttons Configurables

Cada CTA (primary y secondary) tiene:
- **Texto**: Input de texto
- **Acción**: Selector con opciones:
  - `scroll` → Scroll a #products
  - `link` → Campo URL custom
  - `whatsapp` → Abre WhatsApp del negocio
  - `catalog` → Link a un catálogo específico (selector)
- **Icono**: Selector de icono (Lucide subset: ChevronRight, ArrowRight, ShoppingBag, MessageCircle, etc.)

#### 7.5 — Badge Icon Selector

- Dropdown con iconos Lucide populares: Sparkles, Star, Zap, Gift, Flame, Heart, Crown, Award, etc.
- Preview del badge con el icono seleccionado

#### 7.6 — Secciones Custom (Drag & Drop)

El builder tendrá una lista de secciones que se pueden:
- **Reordenar** (drag & drop)
- **Habilitar/deshabilitar** (toggle por sección)
- **Agregar nuevas** (botón "Agregar sección")

Tipos de sección custom:
- **Informativa**: Título, texto, imagen opcional, layout (text-left, text-right, centered)
- **Banner promocional**: Imagen full-width, texto overlay, CTA, countdown timer opcional
- **Productos por categoría**: Selector de categoría, cantidad a mostrar, título custom
- **Productos por catálogo**: Selector de catálogo, cantidad, título
- **Galería de imágenes**: Upload de múltiples imágenes, layout (grid, carousel)
- **Testimonios**: Lista de testimonios (nombre, texto, avatar, rating)

#### 7.7 — Announcement Bar Mejorada

- Link opcional (la barra es clickeable)
- Icono opcional al inicio del texto
- Opción de "dismissable" (el usuario puede cerrar el anuncio)
- Background puede ser gradiente (campo extra)

#### 7.8 — SEO Completo

Panel de SEO expandido:
- **Título SEO**: Con preview de cómo se ve en Google (snippet preview)
- **Meta description**: Con contador de caracteres (ideal 150-160)
- **Keywords**: Tags input (comma separated)
- **URL canónica**: Auto-generada o custom
- **OG Image**: Upload con preview
- **Favicon**: Upload
- **JSON-LD**: Toggle para structured data automática (Organization + Product)
- **Robots**: noindex toggle, nofollow toggle
- **Sitemap**: Auto-generado con catálogos y productos

#### 7.9 — Panel Social

Sección dedicada en el builder para links de redes:
- Instagram, Facebook, TikTok, Twitter/X, YouTube, WhatsApp, Email, Teléfono
- Cada uno con input + toggle de visibilidad en la tienda
- Preview muestra iconos en footer y/o header

#### Archivos a crear/modificar:

```
src/db/schema.ts                                          -- columnas + tabla custom_sections
src/modules/catalogs/ui/components/site-builder.tsx        -- rewrite parcial
src/modules/catalogs/ui/components/builder/               -- subdirectorio
  theme-presets.tsx
  radius-slider.tsx
  cta-configurator.tsx
  badge-icon-selector.tsx
  section-manager.tsx                                     -- drag & drop
  custom-section-editor.tsx
  announcement-editor.tsx
  seo-panel.tsx                                           -- expandido
  social-panel.tsx
src/modules/storefront/ui/components/storefront-catalog.tsx -- custom sections
src/modules/storefront/ui/components/custom-section-renderer.tsx
```

---

## Resumen de Migraciones de Schema

| Fase | Tablas Nuevas | Columnas Nuevas |
|---|---|---|
| 1 | `user_preferences` | 7 en `users` |
| 2 | — | 14 en `businesses` |
| 3 | `chatbot_knowledge_entries`, `chatbot_knowledge_files` | 6 en `chatbot_configs` |
| 4 | — | 4 en `catalogs` |
| 5 | `product_attributes`, `product_attribute_values`, `services`, `inventory_movements` | 6 en `products` |
| 6 | `order_status_history` | 3 en `orders` |
| 7 | `custom_sections` | ~18 en `catalog_settings` |

**Total**: 8 tablas nuevas, ~58 columnas nuevas.

---

## Orden de Ejecución Recomendado

```
Fase 1 (Perfil)      ██████░░░░  ~2-3 días   ← Fundamento para todo
Fase 2 (Negocios)    ████████░░  ~3-4 días   ← Currency impacta storefront
Fase 4 (Catálogos)   ██████░░░░  ~2-3 días   ← Cambio de arquitectura storefront
Fase 5 (Productos)   ██████████  ~5-6 días   ← Mayor complejidad (atributos + servicios + inventario)
Fase 6 (Pedidos)     ████░░░░░░  ~1-2 días   ← Depende de Fase 5 (inventario)
Fase 3 (Chatbot)     ██████████  ~5-6 días   ← Mayor complejidad (tools, PDF, pedidos)
Fase 7 (Builder)     ██████████  ~5-6 días   ← Mayor complejidad (secciones custom, drag&drop)
```

**Nota**: Las fases 5, 6 y 7 son las más grandes. Cada una puede subdividirse en sprints más pequeños si se prefiere.

---

## Dependencias entre Fases

```
Fase 1 ← independiente
Fase 2 ← independiente (pero se beneficia de Fase 1 para locale)
Fase 3 ← depende parcialmente de Fase 5 (acceso a productos) y Fase 6 (crear pedidos)
Fase 4 ← independiente
Fase 5 ← independiente
Fase 6 ← depende de Fase 5 (inventory_movements)
Fase 7 ← independiente (pero Fase 4 enriquece las opciones de secciones)
```

**Orden óptimo**: 1 → 2 → 4 → 5 → 6 → 3 → 7
