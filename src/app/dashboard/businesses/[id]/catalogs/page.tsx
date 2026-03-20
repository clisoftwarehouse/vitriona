import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Plus, Star, BookOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCatalogsAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface CatalogsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CatalogsPage({ params }: CatalogsPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  const catalogs = await getCatalogsAction(id);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon-sm' asChild>
            <Link href='/dashboard/businesses'>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Catálogos</h2>
            <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs/new`}>
            <Plus className='size-4' />
            Nuevo catálogo
          </Link>
        </Button>
      </div>

      {catalogs.length === 0 ? (
        <Card className='py-16'>
          <CardContent className='flex flex-col items-center justify-center text-center'>
            <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
              <BookOpen className='text-muted-foreground size-6' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No tienes catálogos</h3>
            <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
              Crea tu primer catálogo para empezar a organizar tus productos.
            </p>
            <Button asChild className='mt-6'>
              <Link href={`/dashboard/businesses/${id}/catalogs/new`}>
                <Plus className='size-4' />
                Crear catálogo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {catalogs.map((catalog) => (
            <Link key={catalog.id} href={`/dashboard/businesses/${id}/catalogs/${catalog.id}`} className='group'>
              <Card className='flex h-full flex-col transition-shadow group-hover:shadow-md'>
                <CardContent className='flex flex-1 flex-col p-5'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                        <BookOpen className='text-primary size-5' />
                      </div>
                      <div>
                        <h3 className='flex items-center gap-1.5 font-semibold'>
                          {catalog.name}
                          {catalog.isDefault && <Star className='size-3.5 fill-amber-500 text-amber-500' />}
                        </h3>
                      </div>
                    </div>
                    <Badge variant={catalog.isActive ? 'default' : 'secondary'} className='text-[10px]'>
                      {catalog.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <p className='text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm'>
                    {catalog.description || '\u00A0'}
                  </p>

                  <div className='mt-4'>
                    {catalog.isDefault && (
                      <Badge variant='outline' className='text-xs'>
                        Catálogo principal
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
