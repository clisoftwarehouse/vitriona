import { notFound } from 'next/navigation';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BrandsList } from '@/modules/brands/ui/components/brands-list';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface BrandsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandsPage({ params }: BrandsPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight'>Marcas</h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Gestiona tus marcas</h3>
          <p className='text-muted-foreground text-sm'>
            Organiza tus productos por marca para que los clientes encuentren fácilmente lo que buscan.
          </p>
        </CardHeader>
        <CardContent>
          <BrandsList businessId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
