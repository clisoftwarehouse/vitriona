import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Paintbrush } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { EditCatalogWrapper } from '@/modules/catalogs/ui/components/edit-catalog-wrapper';
import { DeleteCatalogButton } from '@/modules/catalogs/ui/components/delete-catalog-button';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface EditCatalogPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function EditCatalogPage({ params }: EditCatalogPageProps) {
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
          <h2 className='text-xl font-semibold tracking-tight'>Editar catálogo</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {catalog.name}
          </p>
        </div>
      </div>

      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <Paintbrush className='text-primary size-5' />
              </div>
              <div>
                <h3 className='font-semibold'>Site Builder</h3>
                <p className='text-muted-foreground text-sm'>Personaliza colores, tipografía, hero y más</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/builder`}>Abrir builder</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del catálogo</h3>
        </CardHeader>
        <CardContent>
          <EditCatalogWrapper
            businessId={id}
            catalogId={catalog.id}
            defaultValues={{
              name: catalog.name,
              slug: catalog.slug ?? '',
              description: catalog.description ?? '',
              imageUrl: catalog.imageUrl ?? '',
              type: catalog.type,
            }}
          />
        </CardContent>
      </Card>

      {!catalog.isDefault && (
        <Card className='border-destructive/50'>
          <CardHeader>
            <h3 className='text-destructive font-semibold'>Zona de peligro</h3>
            <p className='text-muted-foreground text-sm'>
              Eliminar este catálogo es una acción irreversible. Se eliminarán todos los productos asociados.
            </p>
          </CardHeader>
          <CardContent>
            <Separator className='mb-4' />
            <DeleteCatalogButton catalogId={catalog.id} catalogName={catalog.name} businessId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
