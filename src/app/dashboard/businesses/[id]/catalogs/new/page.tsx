import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CreateCatalogWrapper } from '@/modules/catalogs/ui/components/create-catalog-wrapper';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface NewCatalogPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewCatalogPage({ params }: NewCatalogPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Crear catálogo</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del catálogo</h3>
        </CardHeader>
        <CardContent>
          <CreateCatalogWrapper businessId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
