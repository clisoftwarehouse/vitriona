import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { EditBusinessWrapper } from '@/modules/businesses/ui/components/edit-business-wrapper';
import { DeleteBusinessButton } from '@/modules/businesses/ui/components/delete-business-button';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface EditBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBusinessPage({ params }: EditBusinessPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

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
    </div>
  );
}
