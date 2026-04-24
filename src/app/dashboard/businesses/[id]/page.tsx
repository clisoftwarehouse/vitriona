import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bot, Store, QrCode, ArrowLeft, Paintbrush, ChevronDown, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PersistedDetails } from '@/components/ui/persisted-details';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChatWidgetLoader } from '@/modules/ai-chat/ui/components/chat-widget-loader';
import { ChatbotConfigForm } from '@/modules/ai-chat/ui/components/chatbot-config-form';
import { getAiQuotaAction } from '@/modules/ai-chat/server/actions/get-ai-quota.action';
import { EditBusinessWrapper } from '@/modules/businesses/ui/components/edit-business-wrapper';
import { DeleteBusinessButton } from '@/modules/businesses/ui/components/delete-business-button';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getChatbotConfigByBusinessId } from '@/modules/ai-chat/server/actions/get-full-chatbot-config.action';
import { getServiceAccountEmailAction } from '@/modules/ai-chat/server/actions/get-service-account-email.action';

interface EditBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBusinessPage({ params }: EditBusinessPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  const aiQuota = await getAiQuotaAction(id);
  const hasAiAddon = !!aiQuota;

  const [chatbotConfig, serviceAccountEmail] = hasAiAddon
    ? await Promise.all([getChatbotConfigByBusinessId(id), getServiceAccountEmailAction()])
    : [null, null];

  const businessSectionStorageKey = `business-settings:${business.id}:business-section-open`;
  const chatbotSectionStorageKey = `business-settings:${business.id}:chatbot-section-open`;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href='/dashboard/businesses'>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Editar negocio</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Actualiza la información de <strong>{business.name}</strong>.
          </p>
        </div>
      </div>

      <PersistedDetails
        storageKey={businessSectionStorageKey}
        defaultOpen
        className='bg-card rounded-xl border shadow-sm'
        summaryClassName='flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden'
        contentClassName='border-t px-6 py-6'
        summary={
          <>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <Store className='text-primary size-5' />
              </div>
              <div>
                <h3 className='font-semibold'>Información del negocio</h3>
                <p className='text-muted-foreground text-sm'>
                  Edita identidad, contacto, ubicación y configuración regional.
                </p>
              </div>
            </div>
            <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180' />
          </>
        }
      >
        <EditBusinessWrapper
          businessId={business.id}
          defaultValues={{
            name: business.name,
            slug: business.slug,
            description: business.description ?? '',
            category: business.category ?? undefined,
            logoUrl: business.logoUrl ?? '',
            phone: business.phone ?? '',
            email: business.email ?? '',
            whatsappNumber: business.whatsappNumber ?? '',
            website: business.website ?? '',
            address: business.address ?? '',
            country: business.country ?? '',
            city: business.city ?? '',
            state: business.state ?? '',
            zipCode: business.zipCode ?? '',
            currency: business.currency ?? 'USD',
            timezone: business.timezone ?? 'America/Santo_Domingo',
            locale: business.locale ?? 'es',
            instagramUrl: business.instagramUrl ?? '',
            facebookUrl: business.facebookUrl ?? '',
            tiktokUrl: business.tiktokUrl ?? '',
            twitterUrl: business.twitterUrl ?? '',
            youtubeUrl: business.youtubeUrl ?? '',
            taxId: business.taxId ?? '',
            businessHours: business.businessHours ?? undefined,
          }}
        />
      </PersistedDetails>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='flex items-center justify-between p-5'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <Paintbrush className='text-primary size-5' />
              </div>
              <div>
                <h3 className='font-semibold'>Site Builder</h3>
                <p className='text-muted-foreground text-sm'>Personaliza colores, tipografía, hero y más.</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/dashboard/businesses/${business.id}/builder`}>Abrir builder</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='flex items-center justify-between p-5'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <QrCode className='text-primary size-5' />
              </div>
              <div>
                <h3 className='font-semibold'>QR para storefront</h3>
                <p className='text-muted-foreground text-sm'>Genera QR con estilos, colores y logo de tu marca.</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/dashboard/businesses/${business.id}/qr`}>Abrir QR Studio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='flex items-center justify-between p-5'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <ExternalLink className='text-primary size-5' />
              </div>
              <div>
                <h3 className='font-semibold'>Página de Links</h3>
                <p className='text-muted-foreground text-sm'>
                  Tu link bio tipo Linktree con todos tus links y redes sociales.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/dashboard/businesses/${business.id}/links`}>Gestionar links</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {hasAiAddon ? (
        <PersistedDetails
          storageKey={chatbotSectionStorageKey}
          className='bg-card rounded-xl border shadow-sm'
          summaryClassName='flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden'
          contentClassName='border-t px-6 py-6'
          summary={
            <>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                  <Bot className='text-primary size-5' />
                </div>
                <div>
                  <h3 className='font-semibold'>Chatbot de atención al cliente</h3>
                  <p className='text-muted-foreground text-sm'>
                    Configura la IA, su base de conocimiento y sus capacidades desde aquí.
                  </p>
                </div>
              </div>
              <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180' />
            </>
          }
        >
          <ChatbotConfigForm
            businessId={business.id}
            businessName={business.name}
            serviceAccountEmail={serviceAccountEmail}
            initialConfig={
              chatbotConfig
                ? {
                    botName: chatbotConfig.botName,
                    botSubtitle: chatbotConfig.botSubtitle,
                    welcomeMessage: chatbotConfig.welcomeMessage,
                    errorMessage: chatbotConfig.errorMessage,
                    systemPrompt: chatbotConfig.systemPrompt,
                    businessInfo: chatbotConfig.businessInfo,
                    faqs: chatbotConfig.faqs,
                    isEnabled: chatbotConfig.isEnabled,
                    personality: chatbotConfig.personality,
                    tone: chatbotConfig.tone,
                    language: chatbotConfig.language,
                    autoAccessCatalog: chatbotConfig.autoAccessCatalog,
                    orderEnabled: chatbotConfig.orderEnabled,
                    maxTokens: chatbotConfig.maxTokens,
                    calendarEnabled: chatbotConfig.calendarEnabled,
                    googleCalendarId: chatbotConfig.googleCalendarId,
                    calendarTimezone: chatbotConfig.calendarTimezone,
                    slotDurationMode: chatbotConfig.slotDurationMode,
                    slotDurationMinutes: chatbotConfig.slotDurationMinutes,
                  }
                : null
            }
          />
        </PersistedDetails>
      ) : (
        <PersistedDetails
          storageKey={chatbotSectionStorageKey}
          className='bg-card rounded-xl border shadow-sm'
          summaryClassName='flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden'
          contentClassName='border-t px-6 py-6'
          summary={
            <>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10'>
                  <Bot className='size-5 text-amber-500' />
                </div>
                <div>
                  <h3 className='font-semibold'>Chatbot con IA</h3>
                  <p className='text-muted-foreground text-sm'>
                    Activa el add-on de IA para configurar un chatbot que atienda a tus clientes automáticamente.
                  </p>
                </div>
              </div>
              <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180' />
            </>
          }
        >
          <Card className='border-amber-500/20 bg-amber-500/5'>
            <CardContent className='flex items-center justify-between p-5'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10'>
                  <Bot className='size-5 text-amber-500' />
                </div>
                <div>
                  <h3 className='font-semibold'>Chatbot con IA</h3>
                  <p className='text-muted-foreground text-sm'>
                    Activa el add-on de IA para configurar un chatbot que atienda a tus clientes automáticamente.
                  </p>
                </div>
              </div>
              <Button asChild variant='outline'>
                <Link href='/#ai-addon'>Ver planes de IA</Link>
              </Button>
            </CardContent>
          </Card>
        </PersistedDetails>
      )}

      <Card className='border-destructive/50'>
        <CardHeader>
          <h3 className='text-destructive font-semibold'>Zona de peligro</h3>
          <p className='text-muted-foreground text-sm'>
            Eliminar este negocio es una acción irreversible. Se eliminarán todos los datos asociados.
          </p>
        </CardHeader>
        <CardContent>
          <Separator className='mb-4' />
          <DeleteBusinessButton businessId={business.id} businessName={business.name} />
        </CardContent>
      </Card>
      <ChatWidgetLoader businessId={business.id} />
    </div>
  );
}
