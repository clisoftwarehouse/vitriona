import Link from 'next/link';
import Image from 'next/image';
import { Plus, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CatalogLink } from '@/modules/businesses/ui/components/catalog-link';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';

export default async function BusinessesPage() {
  const businesses = await getBusinessesAction();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Mis Negocios</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>Gestiona tus negocios y catálogos digitales.</p>
        </div>
        <Button asChild>
          <Link href='/dashboard/businesses/new'>
            <Plus className='size-4' />
            Nuevo negocio
          </Link>
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className='py-16'>
          <CardContent className='flex flex-col items-center justify-center text-center'>
            <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
              <Store className='text-muted-foreground size-6' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No tienes negocios aún</h3>
            <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
              Crea tu primer negocio para empezar a gestionar tus catálogos digitales y recibir pedidos.
            </p>
            <Button asChild className='mt-6'>
              <Link href='/dashboard/businesses/new'>
                <Plus className='size-4' />
                Crear mi primer negocio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {businesses.map((business) => (
            <Link key={business.id} href={`/dashboard/businesses/${business.id}`} className='group'>
              <Card className='flex h-full flex-col transition-shadow group-hover:shadow-md'>
                <CardContent className='flex flex-1 flex-col p-5'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      {business.logoUrl ? (
                        <div className='relative size-10 shrink-0 overflow-hidden rounded-lg'>
                          <Image
                            src={business.logoUrl}
                            alt={business.name}
                            fill
                            className='object-cover'
                            sizes='40px'
                          />
                        </div>
                      ) : (
                        <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg'>
                          <Store className='text-primary size-5' />
                        </div>
                      )}
                      <div>
                        <h3 className='font-semibold'>{business.name}</h3>
                        <p className='text-muted-foreground text-xs'>vitriona.app/{business.slug}</p>
                      </div>
                    </div>
                    <Badge variant={business.isActive ? 'default' : 'secondary'} className='text-[10px]'>
                      {business.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <p className='text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm'>
                    {business.description || '\u00A0'}
                  </p>

                  <div className='mt-4 flex items-center justify-between'>
                    <Badge variant='outline' className='text-xs capitalize'>
                      {business.plan}
                    </Badge>
                    <CatalogLink slug={business.slug} />
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
