import {
  SchemaType,
  type Content,
  type FunctionCall,
  GoogleGenerativeAI,
  type FunctionDeclaration,
} from '@google/generative-ai';

import type { StoredMessage } from './redis';
import { bookAppointment, getAvailableSlots } from './calendar';

interface ChatbotContext {
  systemPrompt: string | null;
  businessInfo: Record<string, unknown> | null;
  calendarEnabled: boolean;
  googleCalendarId: string | null;
  calendarTimezone: string;
  slotDurationMode: string;
  slotDurationMinutes: number;
  businessName: string;
}

function getModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY environment variable is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

function buildSystemPrompt(ctx: ChatbotContext): string {
  const base =
    ctx.systemPrompt ??
    `Eres un asistente virtual de atención al cliente para "${ctx.businessName}". 
Responde de forma amable, concisa y profesional. 
Solo responde preguntas relacionadas con el negocio. 
Si no sabes algo, indica amablemente que no tienes esa información.`;

  const now = new Date();
  const dateSection = `\n\nFecha y hora actual: ${now.toISOString()}. Hoy es ${now.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. NUNCA agendes citas en fechas pasadas. Todas las fechas deben ser posteriores a la fecha actual.`;

  const businessSection = ctx.businessInfo
    ? `\n\nInformación del negocio:\n${JSON.stringify(ctx.businessInfo, null, 2)}`
    : '';

  const calendarSection = ctx.calendarEnabled
    ? `\n\nIMPORTANTE - AGENDAMIENTO DE CITAS:
Tienes acceso a herramientas de calendario. SIEMPRE debes usarlas cuando el cliente quiera:
- Verificar disponibilidad: usa la función "check_availability" con la fecha.
- Agendar una cita: usa la función "book_appointment" con los datos del cliente.
NUNCA le digas al cliente que "simplemente puede venir" si tiene la opción de agendar. Siempre ofrece verificar disponibilidad y crear la reserva en el calendario.
NUNCA uses fechas en el pasado. El año actual es ${now.getFullYear()}.
${ctx.slotDurationMode === 'per_service' ? 'La duración de cada cita depende del servicio. Consulta la información del negocio para obtener la duración de cada servicio y usa esa duración al verificar disponibilidad y agendar.' : `La duración estándar de cada cita es de ${ctx.slotDurationMinutes} minutos. Usa esta duración al verificar disponibilidad y al calcular la hora de fin de la cita.`}`
    : '';

  return base + dateSection + businessSection + calendarSection;
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

async function handleFunctionCall(call: FunctionCall, ctx: ChatbotContext): Promise<string> {
  const args = call.args as Record<string, unknown>;

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

  const tools = ctx.calendarEnabled ? [{ functionDeclarations: getCalendarTools() }] : [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction,
    tools,
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
