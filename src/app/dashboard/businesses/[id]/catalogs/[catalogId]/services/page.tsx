import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { ServicesManager } from '@/modules/services/ui/components/services-manager';
import { getServicesAction } from '@/modules/services/server/actions/service.actions';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface ServicesPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const { id, catalogId } = await params;
  const [business, catalog, servicesList, categories] = await Promise.all([
    getBusinessByIdAction(id),
    getCatalogByIdAction(catalogId),
    getServicesAction(catalogId),
    getCategoriesAction(catalogId),
  ]);

  if (!business || !catalog) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Servicios</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {catalog.name}
          </p>
        </div>
      </div>

      <ServicesManager catalogId={catalogId} initialServices={servicesList} categories={categories} />
    </div>
  );
}
