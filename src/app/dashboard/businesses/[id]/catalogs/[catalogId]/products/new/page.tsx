import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getBrandsAction } from '@/modules/brands/server/actions/get-brands.action';
import { getAttributesAction } from '@/modules/attributes/server/actions/attribute.actions';
import { CreateProductWrapper } from '@/modules/products/ui/components/create-product-wrapper';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getCatalogsAction, getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';

interface NewProductPageProps {
  params: Promise<{ id: string; catalogId: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { id, catalogId } = await params;
  const [business, catalog, categories, attributes, allCatalogs, brands] = await Promise.all([
    getBusinessByIdAction(id),
    getCatalogByIdAction(catalogId),
    getCategoriesAction(id),
    getAttributesAction(id),
    getCatalogsAction(id),
    getBrandsAction(id),
  ]);

  if (!business || !catalog) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Nuevo producto</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {catalog.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del producto</h3>
        </CardHeader>
        <CardContent>
          <CreateProductWrapper
            catalogId={catalogId}
            businessId={id}
            categories={categories}
            attributes={attributes}
            catalogs={allCatalogs}
            brands={brands}
          />
        </CardContent>
      </Card>
    </div>
  );
}
