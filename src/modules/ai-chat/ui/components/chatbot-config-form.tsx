'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Bot, Plus, Save, Trash2, Loader2, Calendar } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { upsertChatbotConfigAction } from '../../server/actions/upsert-chatbot-config.action';

interface ChatbotConfigFormProps {
  businessId: string;
  businessName: string;
  serviceAccountEmail: string | null;
  initialConfig: {
    botName: string;
    botSubtitle: string | null;
    welcomeMessage: string | null;
    errorMessage: string | null;
    systemPrompt: string | null;
    businessInfo: unknown;
    faqs: string[] | null;
    isEnabled: boolean;
    calendarEnabled: boolean;
    googleCalendarId: string | null;
    calendarTimezone: string;
    slotDurationMode: string;
    slotDurationMinutes: number;
  } | null;
}

export function ChatbotConfigForm({
  businessId,
  businessName,
  serviceAccountEmail,
  initialConfig,
}: ChatbotConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const [isEnabled, setIsEnabled] = useState(initialConfig?.isEnabled ?? false);
  const [botName, setBotName] = useState(initialConfig?.botName ?? 'Asistente Virtual');
  const [botSubtitle, setBotSubtitle] = useState(initialConfig?.botSubtitle ?? businessName ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialConfig?.welcomeMessage ?? '¡Hola! ¿En qué puedo ayudarte?'
  );
  const [errorMessage, setErrorMessage] = useState(
    initialConfig?.errorMessage ??
      'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.'
  );
  const [systemPrompt, setSystemPrompt] = useState(initialConfig?.systemPrompt ?? '');
  const [businessInfo, setBusinessInfo] = useState(
    initialConfig?.businessInfo ? JSON.stringify(initialConfig.businessInfo, null, 2) : ''
  );
  const [faqs, setFaqs] = useState<string[]>((initialConfig?.faqs as string[]) ?? []);
  const [newFaq, setNewFaq] = useState('');
  const [calendarEnabled, setCalendarEnabled] = useState(initialConfig?.calendarEnabled ?? false);
  const [googleCalendarId, setGoogleCalendarId] = useState(initialConfig?.googleCalendarId ?? '');
  const [calendarTimezone, setCalendarTimezone] = useState(initialConfig?.calendarTimezone ?? 'America/Santo_Domingo');
  const [slotDurationMode, setSlotDurationMode] = useState(initialConfig?.slotDurationMode ?? 'fixed');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(initialConfig?.slotDurationMinutes ?? 60);

  const handleAddFaq = () => {
    const trimmed = newFaq.trim();
    if (!trimmed) return;
    setFaqs((prev) => [...prev, trimmed]);
    setNewFaq('');
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let parsedBusinessInfo: Record<string, unknown> | null = null;
    if (businessInfo.trim()) {
      try {
        parsedBusinessInfo = JSON.parse(businessInfo);
      } catch {
        toast.error('La información del negocio debe ser un JSON válido');
        return;
      }
    }

    startTransition(async () => {
      const result = await upsertChatbotConfigAction({
        businessId,
        isEnabled,
        botName,
        botSubtitle,
        welcomeMessage,
        errorMessage,
        systemPrompt: systemPrompt || null,
        businessInfo: parsedBusinessInfo,
        faqs,
        calendarEnabled: calendarEnabled && !!googleCalendarId.trim(),
        googleCalendarId: googleCalendarId.trim() || null,
        calendarTimezone,
        slotDurationMode: slotDurationMode as 'fixed' | 'per_service',
        slotDurationMinutes,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Configuración guardada correctamente');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Enable/Disable */}
      <Card>
        <CardContent className='flex items-center justify-between p-5'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
              <Bot className='text-primary size-5' />
            </div>
            <div>
              <h3 className='font-semibold'>Chatbot de atención al cliente</h3>
              <p className='text-muted-foreground text-sm'>
                {isEnabled ? 'El chatbot está activo para tus clientes' : 'El chatbot está desactivado'}
              </p>
            </div>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Apariencia</h3>
          <p className='text-muted-foreground text-sm'>Personaliza cómo se ve el chat para tus clientes.</p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='botName'>Nombre del bot</Label>
              <Input id='botName' value={botName} onChange={(e) => setBotName(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='botSubtitle'>Subtítulo</Label>
              <Input
                id='botSubtitle'
                value={botSubtitle ?? ''}
                onChange={(e) => setBotSubtitle(e.target.value)}
                placeholder={businessName}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='welcomeMessage'>Mensaje de bienvenida</Label>
            <Input
              id='welcomeMessage'
              value={welcomeMessage ?? ''}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='errorMessage'>Mensaje de error</Label>
            <Input id='errorMessage' value={errorMessage ?? ''} onChange={(e) => setErrorMessage(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del negocio</h3>
          <p className='text-muted-foreground text-sm'>
            Esta información será utilizada por la IA para responder preguntas de tus clientes. Escribe un JSON con los
            datos relevantes (horarios, precios, servicios, dirección, etc.).
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='businessInfo'>Datos del negocio (JSON)</Label>
            <Textarea
              id='businessInfo'
              value={businessInfo}
              onChange={(e) => setBusinessInfo(e.target.value)}
              rows={10}
              className='font-mono text-sm'
              placeholder={'{\n  "horarios": "Lun-Vie 9:00-18:00",\n  "direccion": "...",\n  "servicios": [...]\n}'}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='systemPrompt'>Instrucciones personalizadas para la IA (opcional)</Label>
            <Textarea
              id='systemPrompt'
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder='Ej: Siempre responde en español. Si preguntan por precios, menciona que pueden variar...'
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Preguntas frecuentes</h3>
          <p className='text-muted-foreground text-sm'>
            Los clientes verán estas preguntas como botones rápidos al abrir el chat.
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          {faqs.length > 0 && (
            <div className='space-y-2'>
              {faqs.map((faq, index) => (
                <div key={index} className='bg-muted flex items-center gap-2 rounded-lg px-3 py-2'>
                  <span className='flex-1 text-sm'>{faq}</span>
                  <Button type='button' variant='ghost' size='icon-sm' onClick={() => handleRemoveFaq(index)}>
                    <Trash2 className='size-4 text-red-500' />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className='flex gap-2'>
            <Input
              value={newFaq}
              onChange={(e) => setNewFaq(e.target.value)}
              placeholder='Nueva pregunta frecuente...'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFaq();
                }
              }}
            />
            <Button type='button' variant='outline' size='icon' onClick={handleAddFaq}>
              <Plus className='size-4' />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-blue-500/10'>
              <Calendar className='size-5 text-blue-500' />
            </div>
            <div>
              <h3 className='font-semibold'>Google Calendar (opcional)</h3>
              <p className='text-muted-foreground text-sm'>
                Permite que los clientes verifiquen disponibilidad y agenden citas desde el chat.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium'>Habilitar agendamiento por chat</p>
              <p className='text-muted-foreground text-xs'>
                La IA podrá consultar disponibilidad y crear eventos en tu calendario.
              </p>
            </div>
            <Switch checked={calendarEnabled} onCheckedChange={setCalendarEnabled} />
          </div>

          {calendarEnabled && (
            <>
              <Separator />
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='googleCalendarId'>ID del calendario</Label>
                  <Input
                    id='googleCalendarId'
                    value={googleCalendarId}
                    onChange={(e) => setGoogleCalendarId(e.target.value)}
                    placeholder='tu-email@gmail.com'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Normalmente es tu correo de Gmail. Lo encuentras en Google Calendar &rarr; Configuración &rarr; ID
                    del calendario.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='calendarTimezone'>Zona horaria</Label>
                  <select
                    id='calendarTimezone'
                    value={calendarTimezone}
                    onChange={(e) => setCalendarTimezone(e.target.value)}
                    className='border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs'
                  >
                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Separator />

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='slotDurationMode'>Duración de las citas</Label>
                  <select
                    id='slotDurationMode'
                    value={slotDurationMode}
                    onChange={(e) => setSlotDurationMode(e.target.value)}
                    className='border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs'
                  >
                    <option value='fixed'>Duración fija</option>
                    <option value='per_service'>Según el servicio</option>
                  </select>
                  <p className='text-muted-foreground text-xs'>
                    {slotDurationMode === 'per_service'
                      ? 'La duración se tomará del campo "duracion_minutos" de cada servicio en la información del negocio.'
                      : 'Todas las citas tendrán la misma duración.'}
                  </p>
                </div>
                {slotDurationMode === 'fixed' && (
                  <div className='space-y-2'>
                    <Label htmlFor='slotDurationMinutes'>Minutos por cita</Label>
                    <select
                      id='slotDurationMinutes'
                      value={slotDurationMinutes}
                      onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                      className='border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs'
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1 hora 30 min</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                )}
              </div>

              {serviceAccountEmail && (
                <div className='rounded-lg border border-blue-500/20 bg-blue-500/5 p-4'>
                  <p className='text-sm font-medium'>Instrucciones para conectar</p>
                  <ol className='text-muted-foreground mt-2 list-inside list-decimal space-y-1 text-xs'>
                    <li>
                      Abre <strong>Google Calendar</strong> en tu navegador.
                    </li>
                    <li>
                      Ve a <strong>Configuración</strong> del calendario que quieres usar.
                    </li>
                    <li>
                      En la sección <strong>&quot;Compartir con personas o grupos específicos&quot;</strong>, agrega
                      este correo:
                    </li>
                  </ol>
                  <code className='mt-2 block rounded bg-black/20 px-3 py-2 text-xs break-all'>
                    {serviceAccountEmail}
                  </code>
                  <ol className='text-muted-foreground mt-2 list-inside list-decimal space-y-1 text-xs' start={4}>
                    <li>
                      Dale permisos de <strong>&quot;Hacer cambios en eventos&quot;</strong>.
                    </li>
                    <li>
                      Copia el <strong>ID del calendario</strong> y pégalo arriba.
                    </li>
                  </ol>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className='flex justify-end'>
        <Button type='submit' disabled={isPending}>
          {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Save className='mr-2 size-4' />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
