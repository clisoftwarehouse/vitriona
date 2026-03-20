import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CategoriesList } from '@/modules/categories/ui/components/categories-list';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface CategoriesPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { id, catalogId } = await params;
  const [business, catalog] = await Promise.all([getBusinessByIdAction(id), getCatalogByIdAction(catalogId)]);

  if (!business || !catalog) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Categorías</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {catalog.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Organiza tus categorías</h3>
          <p className='text-muted-foreground text-sm'>
            Arrastra las categorías para cambiar su orden. Este orden se reflejará en tu catálogo público.
          </p>
        </CardHeader>
        <CardContent>
          <CategoriesList catalogId={catalogId} />
        </CardContent>
      </Card>
    </div>
  );
}
