import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { EditProductWrapper } from '@/modules/products/ui/components/edit-product-wrapper';
import { DeleteProductButton } from '@/modules/products/ui/components/delete-product-button';
import { getProductByIdAction } from '@/modules/products/server/actions/get-products.action';
import { getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface EditProductPageProps {
  params: Promise<{ id: string; catalogId: string; productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, catalogId, productId } = await params;
  const [business, catalog, categories, product] = await Promise.all([
    getBusinessByIdAction(id),
    getCatalogByIdAction(catalogId),
    getCategoriesAction(catalogId),
    getProductByIdAction(productId),
  ]);

  if (!business || !catalog || !product) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Editar producto</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {product.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Información del producto</h3>
        </CardHeader>
        <CardContent>
          <EditProductWrapper
            productId={product.id}
            catalogId={catalogId}
            businessId={id}
            categories={categories}
            defaultValues={{
              name: product.name,
              description: product.description ?? '',
              price: product.price,
              compareAtPrice: product.compareAtPrice ?? '',
              sku: product.sku ?? '',
              stock: product.stock ?? 0,
              categoryId: product.categoryId ?? '',
              status: product.status,
              isFeatured: product.isFeatured,
            }}
          />
        </CardContent>
      </Card>

      <Card className='border-destructive/50'>
        <CardHeader>
          <h3 className='text-destructive font-semibold'>Zona de peligro</h3>
          <p className='text-muted-foreground text-sm'>Eliminar este producto es una acción irreversible.</p>
        </CardHeader>
        <CardContent>
          <Separator className='mb-4' />
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
            businessId={id}
            catalogId={catalogId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
