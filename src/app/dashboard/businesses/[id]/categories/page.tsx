import { notFound } from 'next/navigation';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CategoriesList } from '@/modules/categories/ui/components/categories-list';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface CategoriesPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight'>Categorías</h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Organiza tus categorías</h3>
          <p className='text-muted-foreground text-sm'>
            Arrastra las categorías para cambiar su orden. Este orden se reflejará en tu catálogo público.
          </p>
        </CardHeader>
        <CardContent>
          <CategoriesList businessId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
