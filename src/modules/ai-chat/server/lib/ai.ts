import { eq, or, and, sql, ilike, inArray } from 'drizzle-orm';
import {
  SchemaType,
  type Content,
  type FunctionCall,
  GoogleGenerativeAI,
  type FunctionDeclaration,
} from '@google/generative-ai';

import { db } from '@/db/drizzle';
import type { StoredMessage } from './redis';
import { bookAppointment, getAvailableSlots } from './calendar';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { getBundleComponents, syncBundlesForComponent } from '@/modules/products/server/lib/bundles';
import {
  orders,
  brands,
  catalogs,
  products,
  categories,
  orderItems,
  productImages,
  paymentMethods,
  productVariants,
  catalogProducts,
  inventoryMovements,
  orderBundleComponents,
} from '@/db/schema';

interface KnowledgeEntry {
  key: string;
  value: string;
  category: string | null;
}

interface KnowledgeFile {
  fileName: string;
  extractedText: string | null;
}

export interface ChatbotContext {
  systemPrompt: string | null;
  businessInfo: Record<string, unknown> | null;
  calendarEnabled: boolean;
  googleCalendarId: string | null;
  calendarTimezone: string;
  slotDurationMode: string;
  slotDurationMinutes: number;
  businessName: string;
  businessId: string;
  currency: string;
  // Phase 3
  personality: string | null;
  tone: string;
  language: string;
  knowledgeEntries: KnowledgeEntry[];
  knowledgeFiles: KnowledgeFile[];
  autoAccessCatalog: boolean;
  orderEnabled: boolean;
  maxTokens: number;
}

function getModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY environment variable is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

function buildSystemPrompt(ctx: ChatbotContext): string {
  const toneMap: Record<string, string> = {
    professional: 'profesional y cortés',
    friendly: 'amigable y cercano',
    casual: 'casual y relajado',
    formal: 'formal y respetuoso',
  };
  const toneDesc = toneMap[ctx.tone] ?? 'profesional';

  const personalitySection = ctx.personality ? `\n\nPersonalidad del bot: ${ctx.personality}` : '';

  const base =
    ctx.systemPrompt ??
    `Eres un asistente virtual de atención al cliente para "${ctx.businessName}".
Tu tono es ${toneDesc}. Responde en ${ctx.language === 'es' ? 'español' : ctx.language === 'en' ? 'inglés' : 'portugués'}.
Solo responde preguntas relacionadas con el negocio.
Si no sabes algo, indica amablemente que no tienes esa información.`;

  const now = new Date();
  const dateSection = `\n\nFecha y hora actual: ${now.toISOString()}. Hoy es ${now.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. NUNCA agendes citas en fechas pasadas. Todas las fechas deben ser posteriores a la fecha actual.`;

  const businessSection = ctx.businessInfo
    ? `\n\nInformación del negocio:\n${JSON.stringify(ctx.businessInfo, null, 2)}`
    : '';

  // Knowledge base
  let knowledgeSection = '';
  if (ctx.knowledgeEntries.length > 0) {
    const grouped = ctx.knowledgeEntries.reduce(
      (acc, e) => {
        const cat = e.category ?? 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(`- ${e.key}: ${e.value}`);
        return acc;
      },
      {} as Record<string, string[]>
    );
    knowledgeSection = '\n\nBase de conocimiento del negocio:';
    for (const [cat, items] of Object.entries(grouped)) {
      knowledgeSection += `\n[${cat}]\n${items.join('\n')}`;
    }
  }
  if (ctx.knowledgeFiles.length > 0) {
    const fileTexts = ctx.knowledgeFiles
      .filter((f) => f.extractedText)
      .map((f) => `--- ${f.fileName} ---\n${f.extractedText!.slice(0, 4000)}`)
      .join('\n\n');
    if (fileTexts) {
      knowledgeSection += `\n\nDocumentos de referencia:\n${fileTexts}`;
    }
  }

  // Catalog access
  const catalogSection = ctx.autoAccessCatalog
    ? `\n\nIMPORTANTE - CATÁLOGO DE PRODUCTOS:
Tienes acceso a herramientas para consultar el catálogo REAL del negocio. SIEMPRE debes usarlas. NUNCA inventes ni adivines productos, precios o stock.
- "list_products": Lista todos los productos. Úsala cuando pregunten qué hay disponible, qué vendes, cuál es el menú, etc.
- "search_products": Busca productos por nombre o palabra clave.
- "get_categories": Lista las categorías disponibles.
- "get_product_details": Obtiene detalles completos de un producto, incluyendo variantes.
Si un producto tiene variantes (tallas, colores, etc.), informa al cliente las opciones disponibles y su stock individual.
La moneda del negocio es ${ctx.currency}.`
    : '';

  const orderSection = ctx.orderEnabled
    ? `\n\nIMPORTANTE - FLUJO DE PEDIDOS Y PAGO:
Puedes crear pedidos usando las herramientas "create_order" y "get_payment_methods".
Sigue este flujo al crear un pedido:
1. El cliente elige productos. Si un producto tiene variantes, SIEMPRE pregunta cuál variante desea.
2. Confirma el resumen del pedido (productos, cantidades, variantes, total estimado).
3. Pide el nombre y teléfono del cliente.
4. Usa "get_payment_methods" para mostrar los métodos de pago disponibles con sus instrucciones y datos de cuenta.
5. El cliente elige un método de pago. Muéstrale los datos de la cuenta (número, banco, titular, etc.) para que realice el pago.
6. Solicita el dato de verificación/identificación correspondiente al método elegido (teléfono, correo, cédula, etc. según "verification_required").
7. Solicita el número de referencia o confirmación del pago que realizó el cliente.
8. Crea el pedido con "create_order" incluyendo payment_method_name, verification_value (identificación) y payment_reference (referencia del pago).
NUNCA crees un pedido sin antes mostrar los métodos de pago, recoger la identificación del cliente Y el número de referencia del pago.
Si no hay métodos de pago configurados, crea el pedido sin información de pago.`
    : '';

  const calendarSection = ctx.calendarEnabled
    ? `\n\nIMPORTANTE - AGENDAMIENTO DE CITAS:
Tienes acceso a herramientas de calendario. SIEMPRE debes usarlas cuando el cliente quiera:
- Verificar disponibilidad: usa la función "check_availability" con la fecha.
- Agendar una cita: usa la función "book_appointment" con los datos del cliente.
NUNCA le digas al cliente que "simplemente puede venir" si tiene la opción de agendar.
NUNCA uses fechas en el pasado. El año actual es ${now.getFullYear()}.
${ctx.slotDurationMode === 'per_service' ? 'La duración de cada cita depende del servicio.' : `La duración estándar de cada cita es de ${ctx.slotDurationMinutes} minutos.`}`
    : '';

  return (
    base +
    personalitySection +
    dateSection +
    businessSection +
    knowledgeSection +
    catalogSection +
    orderSection +
    calendarSection
  );
}

function getCalendarTools(): FunctionDeclaration[] {
  return [
    {
      name: 'check_availability',
      description:
        'Consulta los horarios disponibles en el calendario del negocio para una fecha específica. Usa formato YYYY-MM-DD para la fecha.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          date: {
            type: SchemaType.STRING,
            description: 'Fecha en formato YYYY-MM-DD',
          },
          duration_minutes: {
            type: SchemaType.NUMBER,
            description: 'Duración del slot en minutos (default 60)',
          },
        },
        required: ['date'],
      },
    },
    {
      name: 'book_appointment',
      description:
        'Agenda una cita en el calendario del negocio. El summary DEBE tener el formato "Servicio - Nombre del cliente". SIEMPRE pide el email del cliente antes de agendar.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              'Título de la cita en formato "Servicio - Nombre del cliente" (ej: "Fiesta de cumpleaños - María García")',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Detalles adicionales: número de personas, requerimientos especiales, etc.',
          },
          start_time: {
            type: SchemaType.STRING,
            description: 'Hora de inicio en formato ISO 8601 (e.g. 2024-03-15T10:00:00)',
          },
          end_time: {
            type: SchemaType.STRING,
            description: 'Hora de fin en formato ISO 8601 (e.g. 2024-03-15T11:00:00)',
          },
          attendee_email: {
            type: SchemaType.STRING,
            description: 'Email del cliente para enviarle la invitación al calendario',
          },
        },
        required: ['summary', 'start_time', 'end_time', 'attendee_email'],
      },
    },
  ];
}

function historyToContents(history: StoredMessage[]): Content[] {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

function getCatalogTools(): FunctionDeclaration[] {
  return [
    {
      name: 'search_products',
      description:
        'Busca productos en el catálogo del negocio por nombre o descripción. Devuelve nombre, precio, descripción y stock.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: 'Término de búsqueda (nombre del producto o palabra clave)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_products',
      description:
        'Lista todos los productos/servicios del catálogo, opcionalmente filtrados por categoría. Usa esto cuando el cliente pregunte qué productos o servicios hay disponibles.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          category_name: {
            type: SchemaType.STRING,
            description: 'Nombre de la categoría para filtrar (opcional). Si no se provee, lista todos los productos.',
          },
        },
      },
    },
    {
      name: 'get_categories',
      description: 'Lista todas las categorías disponibles en el catálogo del negocio.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: 'get_product_details',
      description: 'Obtiene el detalle completo de un producto por su nombre.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          product_name: {
            type: SchemaType.STRING,
            description: 'Nombre del producto',
          },
        },
        required: ['product_name'],
      },
    },
  ];
}

function getOrderTools(): FunctionDeclaration[] {
  return [
    {
      name: 'get_payment_methods',
      description:
        'Obtiene los métodos de pago activos del negocio. Úsalo ANTES de crear un pedido para mostrar las opciones de pago al cliente.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: 'create_order',
      description:
        'Crea un pedido para el cliente. Necesita nombre, teléfono, productos, método de pago elegido y dato de verificación.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          customer_name: {
            type: SchemaType.STRING,
            description: 'Nombre del cliente',
          },
          customer_phone: {
            type: SchemaType.STRING,
            description: 'Teléfono del cliente',
          },
          items: {
            type: SchemaType.ARRAY,
            description: 'Lista de productos a ordenar',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                product_name: { type: SchemaType.STRING, description: 'Nombre del producto' },
                variant_name: {
                  type: SchemaType.STRING,
                  description:
                    'Nombre de la variante elegida (obligatorio si el producto tiene variantes, ej: "Talla M", "Oro 18k")',
                },
                quantity: { type: SchemaType.NUMBER, description: 'Cantidad' },
              },
              required: ['product_name', 'quantity'],
            },
          },
          payment_method_name: {
            type: SchemaType.STRING,
            description: 'Nombre del método de pago elegido por el cliente (ej: "Pago Móvil", "Zelle")',
          },
          verification_value: {
            type: SchemaType.STRING,
            description:
              'Dato de verificación/identificación del cliente (teléfono, email, cédula, según lo que pida el método de pago)',
          },
          payment_reference: {
            type: SchemaType.STRING,
            description: 'Número de referencia o confirmación del pago realizado por el cliente',
          },
        },
        required: ['customer_name', 'items'],
      },
    },
  ];
}

async function handleCatalogCall(call: FunctionCall, ctx: ChatbotContext): Promise<string> {
  const args = call.args as Record<string, unknown>;

  try {
    // Get default catalog ID (needed for create_order)
    const [catalog] = await db
      .select({ id: catalogs.id })
      .from(catalogs)
      .where(eq(catalogs.businessId, ctx.businessId))
      .limit(1);

    // Query ALL active products by businessId (same as storefront)
    const baseConditions = [eq(products.businessId, ctx.businessId), eq(products.status, 'active')];

    if (call.name === 'search_products') {
      const query = args.query as string;

      // 1. Direct match by product name/description
      const directResults = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          description: products.description,
          stock: products.stock,
        })
        .from(products)
        .where(
          and(
            ...baseConditions,
            or(
              ilike(products.name, `%${query}%`),
              ilike(products.description, `%${query}%`),
              sql`array_to_string(${products.tags}, ',') ILIKE ${'%' + query + '%'}`
            )
          )
        )
        .limit(10);

      // 2. Match by catalog name (e.g. searching "oro" finds products in the "Oro" catalog)
      const matchingCatalogs = await db
        .select({ id: catalogs.id })
        .from(catalogs)
        .where(and(eq(catalogs.businessId, ctx.businessId), ilike(catalogs.name, `%${query}%`)));

      let catalogProductResults: typeof directResults = [];
      if (matchingCatalogs.length > 0) {
        const catalogIds = matchingCatalogs.map((c) => c.id);
        const linkedProducts = await db
          .select({ productId: catalogProducts.productId })
          .from(catalogProducts)
          .where(inArray(catalogProducts.catalogId, catalogIds));
        const linkedIds = linkedProducts.map((l) => l.productId);
        if (linkedIds.length > 0) {
          catalogProductResults = await db
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              description: products.description,
              stock: products.stock,
            })
            .from(products)
            .where(and(...baseConditions, inArray(products.id, linkedIds)))
            .limit(10);
        }
      }

      // 3. Match by category name
      const matchingCategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.businessId, ctx.businessId), ilike(categories.name, `%${query}%`)));

      let categoryProductResults: typeof directResults = [];
      if (matchingCategories.length > 0) {
        const categoryIds = matchingCategories.map((c) => c.id);
        categoryProductResults = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            description: products.description,
            stock: products.stock,
          })
          .from(products)
          .where(and(...baseConditions, inArray(products.categoryId, categoryIds)))
          .limit(10);
      }

      // 4. Match by brand name
      const matchingBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(and(eq(brands.businessId, ctx.businessId), ilike(brands.name, `%${query}%`)));

      let brandProductResults: typeof directResults = [];
      if (matchingBrands.length > 0) {
        const brandIds = matchingBrands.map((b) => b.id);
        brandProductResults = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            description: products.description,
            stock: products.stock,
          })
          .from(products)
          .where(and(...baseConditions, inArray(products.brandId, brandIds)))
          .limit(10);
      }

      // Merge and deduplicate results
      const allResults = [
        ...directResults,
        ...catalogProductResults,
        ...categoryProductResults,
        ...brandProductResults,
      ];
      const seen = new Set<string>();
      const uniqueResults = allResults.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      return JSON.stringify({
        products: uniqueResults.slice(0, 15).map((p) => ({
          name: p.name,
          price: `${p.price} ${ctx.currency}`,
          description: p.description,
          in_stock: p.stock === null || p.stock > 0,
        })),
        count: uniqueResults.length,
      });
    }

    if (call.name === 'list_products') {
      const categoryName = args.category_name as string | undefined;

      const conditions = [...baseConditions];

      if (categoryName) {
        const [cat] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.businessId, ctx.businessId), ilike(categories.name, `%${categoryName}%`)))
          .limit(1);

        if (cat) {
          conditions.push(eq(products.categoryId, cat.id));
        }
      }

      const results = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          description: products.description,
          stock: products.stock,
          type: products.type,
          categoryId: products.categoryId,
          brandId: products.brandId,
          tags: products.tags,
        })
        .from(products)
        .where(and(...conditions))
        .limit(20);

      const resultIds = results.map((r) => r.id);

      // Fetch variants for all listed products
      const allVariants =
        resultIds.length > 0
          ? await db
              .select({
                productId: productVariants.productId,
                name: productVariants.name,
                price: productVariants.price,
                stock: productVariants.stock,
              })
              .from(productVariants)
              .where(inArray(productVariants.productId, resultIds))
          : [];

      const variantMap = new Map<string, typeof allVariants>();
      for (const v of allVariants) {
        const existing = variantMap.get(v.productId) ?? [];
        existing.push(v);
        variantMap.set(v.productId, existing);
      }

      // Fetch category names
      const catIds = [...new Set(results.map((r) => r.categoryId).filter(Boolean))] as string[];
      const categoryMap = new Map<string, string>();
      if (catIds.length > 0) {
        const catRows = await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(inArray(categories.id, catIds));
        for (const c of catRows) categoryMap.set(c.id, c.name);
      }

      // Fetch brand names
      const bIds = [...new Set(results.map((r) => r.brandId).filter(Boolean))] as string[];
      const brandMap = new Map<string, string>();
      if (bIds.length > 0) {
        const brandRows = await db
          .select({ id: brands.id, name: brands.name })
          .from(brands)
          .where(inArray(brands.id, bIds));
        for (const b of brandRows) brandMap.set(b.id, b.name);
      }

      // Fetch catalog names per product
      const allCatalogLinks =
        resultIds.length > 0
          ? await db
              .select({
                productId: catalogProducts.productId,
                catalogId: catalogProducts.catalogId,
              })
              .from(catalogProducts)
              .where(inArray(catalogProducts.productId, resultIds))
          : [];
      const allCatalogIds = [...new Set(allCatalogLinks.map((l) => l.catalogId))];
      const catalogNameMap = new Map<string, string>();
      if (allCatalogIds.length > 0) {
        const catLogRows = await db
          .select({ id: catalogs.id, name: catalogs.name })
          .from(catalogs)
          .where(inArray(catalogs.id, allCatalogIds));
        for (const c of catLogRows) catalogNameMap.set(c.id, c.name);
      }
      const productCatalogMap = new Map<string, string[]>();
      for (const link of allCatalogLinks) {
        const existing = productCatalogMap.get(link.productId) ?? [];
        const name = catalogNameMap.get(link.catalogId);
        if (name) existing.push(name);
        productCatalogMap.set(link.productId, existing);
      }

      return JSON.stringify({
        products: results.map((p) => {
          const vars = variantMap.get(p.id);
          return {
            name: p.name,
            type: p.type,
            price: `${p.price} ${ctx.currency}`,
            description: p.description,
            in_stock: p.stock === null || p.stock > 0,
            category: p.categoryId ? (categoryMap.get(p.categoryId) ?? null) : null,
            brand: p.brandId ? (brandMap.get(p.brandId) ?? null) : null,
            tags: p.tags ?? [],
            collections: productCatalogMap.get(p.id) ?? [],
            ...(vars && vars.length > 0
              ? {
                  has_variants: true,
                  variants: vars.map((v) => ({
                    name: v.name,
                    price: `${v.price} ${ctx.currency}`,
                    stock: v.stock,
                    in_stock: v.stock > 0,
                  })),
                }
              : {}),
          };
        }),
        count: results.length,
        category_filter: categoryName ?? null,
      });
    }

    if (call.name === 'get_categories') {
      const cats = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.businessId, ctx.businessId));

      return JSON.stringify({ categories: cats.map((c) => c.name) });
    }

    if (call.name === 'get_product_details') {
      const productName = args.product_name as string;

      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          description: products.description,
          stock: products.stock,
        })
        .from(products)
        .where(and(...baseConditions, ilike(products.name, `%${productName}%`)))
        .limit(1);

      if (!product) return JSON.stringify({ error: 'Producto no encontrado' });

      const images = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .limit(3);

      // Fetch variants
      const variants = await db
        .select({
          name: productVariants.name,
          price: productVariants.price,
          stock: productVariants.stock,
          sku: productVariants.sku,
        })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));

      return JSON.stringify({
        name: product.name,
        price: `${product.price} ${ctx.currency}`,
        compare_at_price: product.compareAtPrice ? `${product.compareAtPrice} ${ctx.currency}` : null,
        description: product.description,
        in_stock: product.stock === null || product.stock > 0,
        stock: product.stock,
        images: images.map((i) => i.url),
        ...(variants.length > 0
          ? {
              has_variants: true,
              variants: variants.map((v) => ({
                name: v.name,
                price: `${v.price} ${ctx.currency}`,
                stock: v.stock,
                in_stock: v.stock > 0,
                sku: v.sku,
              })),
            }
          : {}),
      });
    }

    if (call.name === 'get_payment_methods') {
      const methods = await db
        .select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.businessId, ctx.businessId), eq(paymentMethods.isActive, true)));

      const verificationLabels: Record<string, string> = {
        phone: 'Número de teléfono',
        email: 'Correo electrónico',
        document_id: 'Cédula / Documento de identidad',
      };

      return JSON.stringify({
        payment_methods: methods.map((m) => ({
          name: m.name,
          instructions: m.instructions,
          fields: m.fields,
          verification_required: m.verificationMethod
            ? m.verificationMethod === 'custom'
              ? (m.verificationLabel ?? 'Dato de verificación')
              : verificationLabels[m.verificationMethod]
            : null,
          verification_type: m.verificationMethod,
        })),
        count: methods.length,
      });
    }

    if (call.name === 'create_order') {
      const customerName = args.customer_name as string;
      const customerPhone = args.customer_phone as string | undefined;
      const paymentMethodName = args.payment_method_name as string | undefined;
      const verificationValue = args.verification_value as string | undefined;
      const paymentReference = args.payment_reference as string | undefined;
      const items = args.items as Array<{ product_name: string; variant_name?: string; quantity: number }>;

      // Resolve products and variants
      const orderProducts: Array<{
        productId: string;
        variantId: string | null;
        name: string;
        price: string;
        quantity: number;
        productType: 'product' | 'service' | 'bundle';
        trackInventory: boolean;
        bundleComponents?: Array<{
          componentProductId: string;
          componentProductName: string;
          unitQuantity: number;
          totalQuantity: number;
          unitPrice: string;
          subtotal: string;
          tracksInventory: boolean;
        }>;
      }> = [];
      const issues: string[] = [];

      for (const item of items) {
        const [product] = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            stock: products.stock,
            trackInventory: products.trackInventory,
            type: products.type,
          })
          .from(products)
          .where(and(...baseConditions, ilike(products.name, `%${item.product_name}%`)))
          .limit(1);

        if (!product) {
          issues.push(`Producto "${item.product_name}" no encontrado`);
          continue;
        }

        if (product.type === 'bundle') {
          if (item.variant_name) {
            issues.push(`"${product.name}" es un paquete y no admite variantes`);
            continue;
          }

          const bundleComponents = await getBundleComponents(product.id);
          if (bundleComponents.length === 0) {
            issues.push(`"${product.name}" no tiene componentes configurados`);
            continue;
          }

          const unavailableComponent = bundleComponents.find(
            (component) => component.trackInventory && (component.stock ?? 0) < component.quantity * item.quantity
          );
          if (unavailableComponent) {
            issues.push(`"${unavailableComponent.name}" no tiene suficiente stock para el paquete "${product.name}"`);
            continue;
          }

          orderProducts.push({
            productId: product.id,
            variantId: null,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            productType: 'bundle',
            trackInventory: bundleComponents.some((component) => component.trackInventory),
            bundleComponents: bundleComponents.map((component) => ({
              componentProductId: component.productId,
              componentProductName: component.name,
              unitQuantity: component.quantity,
              totalQuantity: component.quantity * item.quantity,
              unitPrice: component.price,
              subtotal: (parseFloat(component.price) * component.quantity * item.quantity).toFixed(2),
              tracksInventory: component.trackInventory,
            })),
          });

          continue;
        }

        // Check if product has variants
        const variants = await db
          .select({
            id: productVariants.id,
            name: productVariants.name,
            price: productVariants.price,
            stock: productVariants.stock,
          })
          .from(productVariants)
          .where(eq(productVariants.productId, product.id));

        if (variants.length > 0) {
          // Product has variants — variant_name is required
          if (!item.variant_name) {
            const variantNames = variants.map((v) => v.name).join(', ');
            issues.push(`"${product.name}" tiene variantes. Pregunta al cliente cuál desea: ${variantNames}`);
            continue;
          }

          // Find matching variant
          const variant =
            variants.find((v) => v.name.toLowerCase() === item.variant_name!.toLowerCase()) ??
            variants.find((v) => v.name.toLowerCase().includes(item.variant_name!.toLowerCase()));

          if (!variant) {
            const variantNames = variants.map((v) => v.name).join(', ');
            issues.push(
              `Variante "${item.variant_name}" no encontrada para "${product.name}". Opciones: ${variantNames}`
            );
            continue;
          }

          if (product.trackInventory && variant.stock < item.quantity) {
            issues.push(
              `"${product.name} (${variant.name})" solo tiene ${variant.stock} unidades (pediste ${item.quantity})`
            );
            continue;
          }

          orderProducts.push({
            productId: product.id,
            variantId: variant.id,
            name: `${product.name} (${variant.name})`,
            price: variant.price ?? product.price,
            quantity: item.quantity,
            productType: product.type as 'product' | 'service',
            trackInventory: product.trackInventory,
          });
        } else {
          // No variants — use product stock directly
          if (product.trackInventory && product.stock !== null && product.stock < item.quantity) {
            issues.push(`"${product.name}" solo tiene ${product.stock} unidades (pediste ${item.quantity})`);
            continue;
          }

          orderProducts.push({
            productId: product.id,
            variantId: null,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            productType: product.type as 'product' | 'service',
            trackInventory: product.trackInventory,
          });
        }
      }

      if (issues.length > 0) {
        return JSON.stringify({ error: issues.join('; ') });
      }

      if (orderProducts.length === 0) {
        return JSON.stringify({ error: 'No se encontraron los productos especificados' });
      }

      const total = orderProducts.reduce((sum, p) => sum + parseFloat(p.price) * p.quantity, 0);

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Resolve payment method if provided
      let resolvedPaymentMethodId: string | null = null;
      let resolvedPaymentMethodName: string | null = null;
      let resolvedPaymentDetails: Record<string, unknown> | null = null;

      if (paymentMethodName) {
        const activeMethods = await db
          .select()
          .from(paymentMethods)
          .where(and(eq(paymentMethods.businessId, ctx.businessId), eq(paymentMethods.isActive, true)));

        const matched =
          activeMethods.find((m) => m.name.toLowerCase() === paymentMethodName.toLowerCase()) ??
          activeMethods.find((m) => m.name.toLowerCase().includes(paymentMethodName.toLowerCase()));

        if (matched) {
          resolvedPaymentMethodId = matched.id;
          resolvedPaymentMethodName = matched.name;
          resolvedPaymentDetails = {
            verification_type: matched.verificationMethod,
            verification_value: verificationValue ?? null,
            reference: paymentReference ?? null,
            source: 'chatbot',
          };
        }
      }

      const [order] = await db
        .insert(orders)
        .values({
          businessId: ctx.businessId,
          catalogId: catalog.id,
          orderNumber,
          customerName,
          customerPhone: customerPhone ?? null,
          subtotal: total.toFixed(2),
          total: total.toFixed(2),
          status: 'pending_payment',
          checkoutType: 'internal',
          inventoryDeducted: true,
          paymentMethodId: resolvedPaymentMethodId,
          paymentMethodName: resolvedPaymentMethodName,
          paymentDetails: resolvedPaymentDetails,
        })
        .returning();

      const insertedOrderItems = await db
        .insert(orderItems)
        .values(
          orderProducts.map((p) => ({
            orderId: order.id,
            productId: p.productId,
            variantId: p.variantId,
            productName: p.name,
            unitPrice: p.price,
            quantity: p.quantity,
            subtotal: (parseFloat(p.price) * p.quantity).toFixed(2),
          }))
        )
        .returning({ id: orderItems.id });

      const bundleSnapshotRows = insertedOrderItems.flatMap((orderItem, index) => {
        const product = orderProducts[index];
        return (product.bundleComponents ?? []).map((component) => ({
          orderItemId: orderItem.id,
          componentProductId: component.componentProductId,
          componentProductName: component.componentProductName,
          unitQuantity: component.unitQuantity,
          totalQuantity: component.totalQuantity,
          unitPrice: component.unitPrice,
          subtotal: component.subtotal,
          tracksInventory: component.tracksInventory,
        }));
      });

      if (bundleSnapshotRows.length > 0) {
        await db.insert(orderBundleComponents).values(bundleSnapshotRows);
      }

      // Deduct inventory
      const affectedProductIds = new Set<string>();

      for (const item of orderProducts) {
        if (item.productType === 'bundle') {
          for (const component of item.bundleComponents ?? []) {
            if (!component.tracksInventory) continue;

            const [product] = await db
              .select({ stock: products.stock })
              .from(products)
              .where(eq(products.id, component.componentProductId))
              .limit(1);
            const previousStock = product?.stock ?? 0;
            const newStock = Math.max(0, previousStock - component.totalQuantity);

            await db
              .update(products)
              .set({
                stock: newStock,
                status: newStock === 0 ? 'out_of_stock' : undefined,
                updatedAt: new Date(),
              })
              .where(eq(products.id, component.componentProductId));

            await db.insert(inventoryMovements).values({
              productId: component.componentProductId,
              type: 'order',
              quantity: component.totalQuantity,
              reason: `Pedido ${orderNumber} (paquete, chatbot: ${item.name})`,
              referenceId: order.id,
              previousStock,
              newStock,
            });

            affectedProductIds.add(component.componentProductId);
          }

          continue;
        }

        if (!item.trackInventory) continue;

        if (item.variantId) {
          // Deduct from variant stock
          const [variant] = await db
            .select({ id: productVariants.id, stock: productVariants.stock })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
            .limit(1);
          if (variant) {
            const prevStock = variant.stock;
            const newStock = Math.max(0, prevStock - item.quantity);
            await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, item.variantId));

            await db.insert(inventoryMovements).values({
              productId: item.productId,
              type: 'order',
              quantity: item.quantity,
              reason: `Pedido ${orderNumber} (variante, chatbot)`,
              referenceId: order.id,
              previousStock: prevStock,
              newStock,
            });
          }
          await syncProductStockWithVariants(item.productId);
          affectedProductIds.add(item.productId);
        } else {
          // Deduct from product stock
          const [product] = await db
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);
          const previousStock = product?.stock ?? 0;
          const newStock = Math.max(0, previousStock - item.quantity);

          await db
            .update(products)
            .set({
              stock: newStock,
              status: newStock === 0 ? 'out_of_stock' : undefined,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));

          await db.insert(inventoryMovements).values({
            productId: item.productId,
            type: 'order',
            quantity: item.quantity,
            reason: `Pedido ${orderNumber} (chatbot)`,
            referenceId: order.id,
            previousStock,
            newStock,
          });

          affectedProductIds.add(item.productId);
        }
      }

      for (const productId of affectedProductIds) {
        await syncBundlesForComponent(productId);
      }

      return JSON.stringify({
        success: true,
        order_number: orderNumber,
        total: `${total.toFixed(2)} ${ctx.currency}`,
        items: orderProducts.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          price: `${p.price} ${ctx.currency}`,
        })),
      });
    }

    return JSON.stringify({ error: 'Función no reconocida' });
  } catch (error) {
    console.error('Catalog function call error:', error);
    return JSON.stringify({ error: 'Error al consultar el catálogo' });
  }
}

async function handleFunctionCall(call: FunctionCall, ctx: ChatbotContext): Promise<string> {
  const args = call.args as Record<string, unknown>;

  // Catalog & order tools
  if (
    [
      'search_products',
      'list_products',
      'get_categories',
      'get_product_details',
      'get_payment_methods',
      'create_order',
    ].includes(call.name)
  ) {
    return handleCatalogCall(call, ctx);
  }

  // Calendar tools
  if (!ctx.googleCalendarId) {
    return JSON.stringify({ error: 'Calendario no configurado para este negocio' });
  }

  try {
    if (call.name === 'check_availability') {
      const date = args.date as string;
      const duration = (args.duration_minutes as number) || 60;
      const slots = await getAvailableSlots(ctx.googleCalendarId, date, duration);
      return JSON.stringify({ available_slots: slots, date });
    }

    if (call.name === 'book_appointment') {
      const result = await bookAppointment({
        calendarId: ctx.googleCalendarId,
        timezone: ctx.calendarTimezone,
        summary: args.summary as string,
        description: args.description as string | undefined,
        startTime: args.start_time as string,
        endTime: args.end_time as string,
        attendeeEmail: args.attendee_email as string | undefined,
      });
      return JSON.stringify({ success: true, event: result });
    }

    return JSON.stringify({ error: 'Función no reconocida' });
  } catch (error) {
    console.error('Function call error:', error);
    return JSON.stringify({ error: 'Error al ejecutar la operación' });
  }
}

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;
const MAX_RETRIES = 3;

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    return msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('high demand');
  }
  return false;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateChatResponse(
  userMessage: string,
  history: StoredMessage[],
  ctx: ChatbotContext
): Promise<string> {
  const genAI = getModel();
  const systemInstruction = buildSystemPrompt(ctx);

  const allDeclarations: FunctionDeclaration[] = [];
  if (ctx.calendarEnabled) allDeclarations.push(...getCalendarTools());
  if (ctx.autoAccessCatalog) allDeclarations.push(...getCatalogTools());
  if (ctx.orderEnabled) allDeclarations.push(...getOrderTools());

  const tools = allDeclarations.length > 0 ? [{ functionDeclarations: allDeclarations }] : [];

  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          tools,
          generationConfig: {
            maxOutputTokens: ctx.maxTokens,
          },
        });

        const chat = model.startChat({
          history: historyToContents(history),
        });

        let result = await chat.sendMessage(userMessage);
        let response = result.response;

        // Handle function calling loop
        while (response.candidates?.[0]?.content?.parts?.some((p) => p.functionCall)) {
          const functionCallPart = response.candidates[0].content.parts.find((p) => p.functionCall);
          if (!functionCallPart?.functionCall) break;

          const functionResult = await handleFunctionCall(functionCallPart.functionCall, ctx);

          result = await chat.sendMessage([
            {
              functionResponse: {
                name: functionCallPart.functionCall.name,
                response: JSON.parse(functionResult),
              },
            },
          ]);
          response = result.response;
        }

        return response.text() || '';
      } catch (error) {
        console.warn(`Chat API error (model=${modelName}, attempt=${attempt}/${MAX_RETRIES}):`, error);

        if (isRetryableError(error) && attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s
          continue;
        }

        if (isRetryableError(error)) {
          break; // Move to fallback model
        }

        throw error; // Non-retryable error, throw immediately
      }
    }
  }

  throw new Error('Todos los modelos de IA están temporalmente no disponibles. Intenta de nuevo en unos segundos.');
}
