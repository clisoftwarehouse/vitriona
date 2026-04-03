'use client';

import { toast } from 'sonner';
import type { ElementType } from 'react';
import { useState, useEffect, useTransition } from 'react';
import { Bot, Plus, Save, Brain, Trash2, Loader2, Calendar, Database, ShoppingCart, MessageSquare } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { KnowledgeFilesUpload } from './knowledge-files-upload';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getKnowledgeFilesAction } from '../../server/actions/knowledge-files.action';
import { type KnowledgeEntry, KnowledgeEntriesEditor } from './knowledge-entries-editor';
import { upsertChatbotConfigAction } from '../../server/actions/upsert-chatbot-config.action';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { getKnowledgeEntriesAction, saveKnowledgeEntriesAction } from '../../server/actions/knowledge-entries.action';

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
    personality: string | null;
    tone: string;
    language: string;
    autoAccessCatalog: boolean;
    orderEnabled: boolean;
    maxTokens: number;
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

  // Appearance
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

  // Personality
  const [personality, setPersonality] = useState(initialConfig?.personality ?? '');
  const [tone, setTone] = useState(initialConfig?.tone ?? 'professional');
  const [language, setLanguage] = useState(initialConfig?.language ?? 'es');
  const [systemPrompt, setSystemPrompt] = useState(initialConfig?.systemPrompt ?? '');

  // Business Info (legacy JSON)
  const [businessInfo, setBusinessInfo] = useState(
    initialConfig?.businessInfo ? JSON.stringify(initialConfig.businessInfo, null, 2) : ''
  );

  // Knowledge
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<
    { id: string; fileName: string; fileUrl: string; status: 'processing' | 'ready' | 'error' }[]
  >([]);

  // Capabilities
  const [autoAccessCatalog, setAutoAccessCatalog] = useState(initialConfig?.autoAccessCatalog ?? true);
  const [orderEnabled, setOrderEnabled] = useState(initialConfig?.orderEnabled ?? false);
  const [maxTokens, setMaxTokens] = useState(initialConfig?.maxTokens ?? 1024);

  // FAQs
  const [faqs, setFaqs] = useState<string[]>((initialConfig?.faqs as string[]) ?? []);
  const [newFaq, setNewFaq] = useState('');

  // Calendar
  const [calendarEnabled, setCalendarEnabled] = useState(initialConfig?.calendarEnabled ?? false);
  const [googleCalendarId, setGoogleCalendarId] = useState(initialConfig?.googleCalendarId ?? '');
  const [calendarTimezone, setCalendarTimezone] = useState(initialConfig?.calendarTimezone ?? 'America/Santo_Domingo');
  const [slotDurationMode, setSlotDurationMode] = useState(initialConfig?.slotDurationMode ?? 'fixed');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(initialConfig?.slotDurationMinutes ?? 60);

  // Load knowledge entries and files
  useEffect(() => {
    getKnowledgeEntriesAction(businessId).then((res) => {
      if (res.data) {
        setKnowledgeEntries(
          res.data.map((e) => ({
            id: e.id,
            key: e.key,
            value: e.value,
            category: (e.category as KnowledgeEntry['category']) ?? 'general',
          }))
        );
      }
    });
    getKnowledgeFilesAction(businessId).then((res) => {
      if (res.data) {
        setKnowledgeFiles(
          res.data.map((f) => ({
            id: f.id,
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            status: f.status as 'processing' | 'ready' | 'error',
          }))
        );
      }
    });
  }, [businessId]);

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
      // Save config first (creates the row if it doesn't exist yet)
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
        personality: personality || null,
        tone: tone as 'professional' | 'friendly' | 'casual' | 'formal',
        language,
        autoAccessCatalog,
        orderEnabled,
        maxTokens,
        calendarEnabled: calendarEnabled && !!googleCalendarId.trim(),
        googleCalendarId: googleCalendarId.trim() || null,
        calendarTimezone,
        slotDurationMode: slotDurationMode as 'fixed' | 'per_service',
        slotDurationMinutes,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Save knowledge entries (after config exists)
      const entriesResult = await saveKnowledgeEntriesAction(
        businessId,
        knowledgeEntries
          .filter((e) => e.key.trim() && e.value.trim())
          .map((e) => ({ key: e.key, value: e.value, category: e.category }))
      );
      if (entriesResult.error) {
        toast.error(entriesResult.error);
        return;
      }

      toast.success('Configuración guardada correctamente');
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card className='gap-0'>
        <CardHeader className='border-b pb-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='flex items-start gap-4'>
              <div className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl'>
                <Bot className='size-5' />
              </div>
              <div className='space-y-1'>
                <h3 className='font-semibold'>Chatbot de atención al cliente</h3>
                <p className='text-muted-foreground text-sm'>
                  Configura la personalidad, la base de conocimiento y las capacidades del chatbot desde un solo
                  formulario.
                </p>
              </div>
            </div>

            <Button type='submit' disabled={isPending} className='w-full lg:w-auto'>
              {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Save className='mr-2 size-4' />}
              Guardar configuración
            </Button>
          </div>

          <div className='bg-muted/30 mt-4 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Estado del chatbot</p>
              <p className='text-muted-foreground text-sm'>
                {isEnabled
                  ? 'El chatbot está activo y visible para tus clientes.'
                  : 'El chatbot está desactivado hasta que decidas activarlo.'}
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </CardHeader>

        <CardContent className='space-y-8 pt-6'>
          <SectionTitle
            icon={MessageSquare}
            title='Apariencia'
            description='Personaliza cómo se ve el chat para tus clientes.'
          />
          <div className='space-y-4'>
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
          </div>

          <SectionTitle
            icon={Brain}
            title='Personalidad e idioma'
            description='Define el estilo de comunicación del chatbot.'
          />
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Tono</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='professional'>Profesional</SelectItem>
                    <SelectItem value='friendly'>Amigable</SelectItem>
                    <SelectItem value='casual'>Casual</SelectItem>
                    <SelectItem value='formal'>Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Idioma principal</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='es'>Español</SelectItem>
                    <SelectItem value='en'>Inglés</SelectItem>
                    <SelectItem value='pt'>Portugués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='personality'>Personalidad del bot</Label>
              <Textarea
                id='personality'
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={3}
                placeholder='Ej: Eres amable, entusiasta y siempre ofreces ayuda extra. Usas emojis ocasionalmente.'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='systemPrompt'>Instrucciones personalizadas para la IA (opcional)</Label>
              <Textarea
                id='systemPrompt'
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                placeholder='Ej: Siempre responde en español. Si preguntan por precios, menciona que pueden variar...'
              />
            </div>
          </div>

          <SectionTitle
            icon={Database}
            title='Base de conocimiento'
            description='Agrega información que la IA usará para responder preguntas.'
          />
          <div className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Entradas de conocimiento</Label>
              <KnowledgeEntriesEditor entries={knowledgeEntries} onChange={setKnowledgeEntries} />
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Documentos PDF</Label>
              <KnowledgeFilesUpload businessId={businessId} files={knowledgeFiles} onFilesChange={setKnowledgeFiles} />
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label htmlFor='businessInfo'>Datos del negocio (JSON legacy)</Label>
              <Textarea
                id='businessInfo'
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                rows={6}
                className='font-mono text-sm'
                placeholder={'{\n  "horarios": "Lun-Vie 9:00-18:00",\n  "direccion": "...",\n  "servicios": [...]\n}'}
              />
              <p className='text-muted-foreground text-xs'>
                Si ya tienes datos en formato JSON, puedes mantenerlos aquí. Recomendamos migrar a las entradas de
                conocimiento arriba.
              </p>
            </div>
          </div>

          <SectionTitle
            icon={ShoppingCart}
            title='Capacidades'
            description='Controla qué puede hacer el chatbot con los datos de tu negocio.'
          />
          <div className='space-y-4 rounded-2xl border p-4'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm font-medium'>Acceso al catálogo</p>
                <p className='text-muted-foreground text-xs'>
                  El bot puede buscar productos, ver precios y categorías de tu catálogo.
                </p>
              </div>
              <Switch checked={autoAccessCatalog} onCheckedChange={setAutoAccessCatalog} />
            </div>
            <Separator />
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm font-medium'>Crear pedidos por chat</p>
                <p className='text-muted-foreground text-xs'>
                  Permite que el bot cree pedidos cuando el cliente confirme lo que quiere comprar.
                </p>
              </div>
              <Switch checked={orderEnabled} onCheckedChange={setOrderEnabled} />
            </div>
            <Separator />
            <div className='space-y-2'>
              <Label>Tokens máximos por respuesta</Label>
              <Select value={String(maxTokens)} onValueChange={(v) => setMaxTokens(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='512'>512 (respuestas cortas)</SelectItem>
                  <SelectItem value='1024'>1024 (por defecto)</SelectItem>
                  <SelectItem value='2048'>2048 (respuestas largas)</SelectItem>
                  <SelectItem value='4096'>4096 (respuestas muy detalladas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SectionTitle
            icon={Plus}
            title='Preguntas frecuentes'
            description='Los clientes verán estas preguntas como botones rápidos al abrir el chat.'
          />
          <div className='space-y-4'>
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
          </div>

          <SectionTitle
            icon={Calendar}
            title='Google Calendar'
            description='Permite que los clientes verifiquen disponibilidad y agenden citas desde el chat.'
          />
          <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4 rounded-2xl border p-4'>
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
          </div>

          <div className='flex justify-end border-t pt-6'>
            <Button type='submit' disabled={isPending}>
              {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Save className='mr-2 size-4' />}
              Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: ElementType; title: string; description: string }) {
  return (
    <div className='space-y-1 border-b pb-3'>
      <div className='flex items-center gap-2'>
        <Icon className='text-muted-foreground size-4' />
        <h4 className='text-sm font-semibold'>{title}</h4>
      </div>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
}
