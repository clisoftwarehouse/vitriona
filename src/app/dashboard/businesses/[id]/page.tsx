import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChatWidgetLoader } from '@/modules/ai-chat/ui/components/chat-widget-loader';
import { ChatbotConfigForm } from '@/modules/ai-chat/ui/components/chatbot-config-form';
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

  const [chatbotConfig, serviceAccountEmail] = await Promise.all([
    getChatbotConfigByBusinessId(id),
    getServiceAccountEmailAction(),
  ]);

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

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del negocio</h3>
        </CardHeader>
        <CardContent>
          <EditBusinessWrapper
            businessId={business.id}
            defaultValues={{
              name: business.name,
              slug: business.slug,
              description: business.description ?? '',
              category: business.category ?? undefined,
              phone: business.phone ?? '',
              email: business.email ?? '',
              address: business.address ?? '',
              whatsappNumber: business.whatsappNumber ?? '',
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className='flex items-center justify-between p-5'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
              <BookOpen className='text-primary size-5' />
            </div>
            <div>
              <h3 className='font-semibold'>Catálogos</h3>
              <p className='text-muted-foreground text-sm'>Gestiona los catálogos de este negocio.</p>
            </div>
          </div>
          <Button variant='outline' asChild>
            <Link href={`/dashboard/businesses/${business.id}/catalogs`}>Ver catálogos</Link>
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className='text-xl font-semibold tracking-tight'>Chatbot de atención al cliente</h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>
          Configura el chatbot con IA para que atienda a tus clientes automáticamente.
        </p>
      </div>

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
                calendarEnabled: chatbotConfig.calendarEnabled,
                googleCalendarId: chatbotConfig.googleCalendarId,
                calendarTimezone: chatbotConfig.calendarTimezone,
                slotDurationMode: chatbotConfig.slotDurationMode,
                slotDurationMinutes: chatbotConfig.slotDurationMinutes,
              }
            : null
        }
      />

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
