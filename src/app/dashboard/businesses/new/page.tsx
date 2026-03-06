import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CreateBusinessWrapper } from '@/modules/businesses/ui/components/create-business-wrapper';

export default function NewBusinessPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href='/dashboard/businesses'>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Crear negocio</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>Completa la información de tu nuevo negocio.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del negocio</h3>
          <p className='text-muted-foreground text-sm'>
            Los campos marcados son requeridos. Puedes completar el resto después.
          </p>
        </CardHeader>
        <CardContent>
          <CreateBusinessWrapper />
        </CardContent>
      </Card>
    </div>
  );
}
