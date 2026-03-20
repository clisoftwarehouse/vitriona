import { eq, or, and, ilike, inArray } from 'drizzle-orm';
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
import { orders, catalogs, products, categories, orderItems, productImages, catalogProducts } from '@/db/schema';

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
    ? `\n\nTienes acceso a las herramientas "search_products" y "get_categories" para consultar el catálogo del negocio. Úsalas cuando el cliente pregunte por productos, precios o categorías. La moneda del negocio es ${ctx.currency}.`
    : '';

  const orderSection = ctx.orderEnabled
    ? `\n\nPuedes crear pedidos usando la herramienta "create_order". Cuando el cliente confirme lo que quiere, pide su nombre y teléfono, luego crea el pedido.`
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
      name: 'create_order',
      description:
        'Crea un pedido para el cliente. Necesita nombre del cliente, teléfono y los productos con cantidades.',
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
                quantity: { type: SchemaType.NUMBER, description: 'Cantidad' },
              },
              required: ['product_name', 'quantity'],
            },
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
    // Get the default catalog for this business
    const [catalog] = await db
      .select({ id: catalogs.id })
      .from(catalogs)
      .where(eq(catalogs.businessId, ctx.businessId))
      .limit(1);

    if (!catalog) return JSON.stringify({ error: 'No hay catálogo disponible' });

    // Get product IDs linked to this catalog
    const linked = await db
      .select({ productId: catalogProducts.productId })
      .from(catalogProducts)
      .where(eq(catalogProducts.catalogId, catalog.id));
    const linkedIds = linked.map((l) => l.productId);

    if (call.name === 'search_products') {
      const query = args.query as string;
      if (linkedIds.length === 0) return JSON.stringify({ products: [], count: 0 });

      const results = await db
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
            inArray(products.id, linkedIds),
            or(ilike(products.name, `%${query}%`), ilike(products.description, `%${query}%`))
          )
        )
        .limit(10);

      return JSON.stringify({
        products: results.map((p) => ({
          name: p.name,
          price: `${p.price} ${ctx.currency}`,
          description: p.description,
          in_stock: p.stock === null || p.stock > 0,
        })),
        count: results.length,
      });
    }

    if (call.name === 'list_products') {
      const categoryName = args.category_name as string | undefined;
      if (linkedIds.length === 0)
        return JSON.stringify({ products: [], count: 0, category_filter: categoryName ?? null });

      const conditions = [inArray(products.id, linkedIds)];

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
          name: products.name,
          price: products.price,
          description: products.description,
          stock: products.stock,
          type: products.type,
        })
        .from(products)
        .where(and(...conditions))
        .limit(20);

      return JSON.stringify({
        products: results.map((p) => ({
          name: p.name,
          type: p.type,
          price: `${p.price} ${ctx.currency}`,
          description: p.description,
          in_stock: p.stock === null || p.stock > 0,
        })),
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
      if (linkedIds.length === 0) return JSON.stringify({ error: 'Producto no encontrado' });

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
        .where(and(inArray(products.id, linkedIds), ilike(products.name, `%${productName}%`)))
        .limit(1);

      if (!product) return JSON.stringify({ error: 'Producto no encontrado' });

      const images = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .limit(3);

      return JSON.stringify({
        name: product.name,
        price: `${product.price} ${ctx.currency}`,
        compare_at_price: product.compareAtPrice ? `${product.compareAtPrice} ${ctx.currency}` : null,
        description: product.description,
        in_stock: product.stock === null || product.stock > 0,
        stock: product.stock,
        images: images.map((i) => i.url),
      });
    }

    if (call.name === 'create_order') {
      const customerName = args.customer_name as string;
      const customerPhone = args.customer_phone as string | undefined;
      const items = args.items as Array<{ product_name: string; quantity: number }>;

      // Resolve products
      const orderProducts = [];
      const stockIssues: string[] = [];
      for (const item of items) {
        const [product] = await db
          .select({
            id: products.id,
            name: products.name,
            price: products.price,
            stock: products.stock,
            trackInventory: products.trackInventory,
          })
          .from(products)
          .where(
            and(
              inArray(products.id, linkedIds.length > 0 ? linkedIds : ['']),
              ilike(products.name, `%${item.product_name}%`)
            )
          )
          .limit(1);

        if (product) {
          if (product.trackInventory && product.stock !== null && product.stock < item.quantity) {
            stockIssues.push(
              `"${product.name}" solo tiene ${product.stock} unidades disponibles (pediste ${item.quantity})`
            );
            continue;
          }
          orderProducts.push({ ...product, quantity: item.quantity });
        }
      }

      if (stockIssues.length > 0) {
        return JSON.stringify({ error: `Problemas de stock: ${stockIssues.join('; ')}` });
      }

      if (orderProducts.length === 0) {
        return JSON.stringify({ error: 'No se encontraron los productos especificados' });
      }

      const total = orderProducts.reduce((sum, p) => sum + parseFloat(p.price) * p.quantity, 0);

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

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
          status: 'pending',
          checkoutType: 'internal',
        })
        .returning();

      await db.insert(orderItems).values(
        orderProducts.map((p) => ({
          orderId: order.id,
          productId: p.id,
          productName: p.name,
          unitPrice: p.price,
          quantity: p.quantity,
          subtotal: (parseFloat(p.price) * p.quantity).toFixed(2),
        }))
      );

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
    ['search_products', 'list_products', 'get_categories', 'get_product_details', 'create_order'].includes(call.name)
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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
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
}
