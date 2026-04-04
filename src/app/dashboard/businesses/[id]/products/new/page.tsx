import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getBrandsAction } from '@/modules/brands/server/actions/get-brands.action';
import { getCatalogsAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getAttributesAction } from '@/modules/attributes/server/actions/attribute.actions';
import { CreateProductWrapper } from '@/modules/products/ui/components/create-product-wrapper';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getBundleComponentOptionsAction } from '@/modules/products/server/actions/get-products.action';

interface NewProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { id } = await params;
  const [business, categories, attributes, allCatalogs, brands, bundleComponentOptions] = await Promise.all([
    getBusinessByIdAction(id),
    getCategoriesAction(id),
    getAttributesAction(id),
    getCatalogsAction(id),
    getBrandsAction(id),
    getBundleComponentOptionsAction(id),
  ]);

  if (!business) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/products`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Nuevo producto</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
        </div>
      </div>

      <Card className='pb-4'>
        <CardHeader>
          <h3 className='font-semibold'>Información del producto</h3>
        </CardHeader>
        <CardContent>
          <CreateProductWrapper
            businessId={id}
            categories={categories}
            attributes={attributes}
            catalogs={allCatalogs}
            brands={brands}
            bundleComponentOptions={bundleComponentOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
