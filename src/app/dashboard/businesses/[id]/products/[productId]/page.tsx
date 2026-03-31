import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { db } from '@/db/drizzle';
import { productVariants } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getBrandsAction } from '@/modules/brands/server/actions/get-brands.action';
import { getCatalogsAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
import { EditProductWrapper } from '@/modules/products/ui/components/edit-product-wrapper';
import { ProductImageUpload } from '@/modules/products/ui/components/product-image-upload';
import { getAttributesAction } from '@/modules/attributes/server/actions/attribute.actions';
import { DeleteProductButton } from '@/modules/products/ui/components/delete-product-button';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { ProductVariantsEditor } from '@/modules/products/ui/components/product-variants-editor';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getProductVariantsAction } from '@/modules/products/server/actions/product-variants.action';
import {
  getProductImagesAction,
  getAllProductImagesAction,
} from '@/modules/products/server/actions/product-images.action';
import {
  getProductByIdAction,
  getProductCatalogIdsAction,
  getProductAttributeValuesAction,
} from '@/modules/products/server/actions/get-products.action';

interface EditProductPageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, productId } = await params;
  const [
    business,
    categories,
    product,
    images,
    allImages,
    attributes,
    attrValues,
    allCatalogs,
    productCatalogIds,
    brands,
    variants,
  ] = await Promise.all([
    getBusinessByIdAction(id),
    getCategoriesAction(id),
    getProductByIdAction(productId),
    getProductImagesAction(productId),
    getAllProductImagesAction(productId),
    getAttributesAction(id),
    getProductAttributeValuesAction(productId),
    getCatalogsAction(id),
    getProductCatalogIdsAction(productId),
    getBrandsAction(id),
    getProductVariantsAction(productId),
  ]);

  if (!business || !product) notFound();

  // Direct DB check for variant count (bypasses action ownership check)
  const variantRows = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .limit(1);
  const hasVariants = variantRows.length > 0;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/products`}>
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

      <Card className='pb-4'>
        <CardHeader>
          <h3 className='font-semibold'>Información del producto</h3>
        </CardHeader>
        <CardContent className='space-y-8'>
          <ProductImageUpload productId={product.id} initialImages={images} />
          <Separator />
          <EditProductWrapper
            productId={product.id}
            businessId={id}
            categories={categories}
            catalogs={allCatalogs}
            brands={brands}
            attributes={attributes}
            hasVariants={hasVariants}
            defaultValues={{
              name: product.name,
              description: product.description ?? '',
              price: product.price,
              compareAtPrice: product.compareAtPrice ?? '',
              sku: product.sku ?? '',
              stock: product.stock ?? 0,
              categoryId: product.categoryId ?? '',
              brandId: product.brandId ?? '',
              status: product.status,
              isFeatured: product.isFeatured,
              type: product.type as 'product' | 'service',
              weight: product.weight ?? '',
              minStock: product.minStock ?? 0,
              trackInventory: product.trackInventory,
              tags: product.tags?.join(', ') ?? '',
              catalogIds: productCatalogIds,
              attributeValues: attrValues,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Variantes</h3>
        </CardHeader>
        <CardContent>
          <ProductVariantsEditor
            productId={product.id}
            initialVariants={variants}
            initialVariantImages={allImages.filter((img) => img.variantId !== null)}
          />
        </CardContent>
      </Card>

      {product.trackInventory && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold'>Inventario</h3>
                <p className='text-muted-foreground text-sm'>
                  Stock actual: {product.stock ?? 0}
                  {(product.stock ?? 0) <= (product.minStock ?? 0) && (
                    <span className='ml-2 text-red-500'>(Stock bajo)</span>
                  )}
                </p>
              </div>
              <Button variant='outline' size='sm' asChild>
                <Link href={`/dashboard/businesses/${id}/products/${product.id}/inventory`}>Gestionar inventario</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card className='border-destructive/50'>
        <CardHeader>
          <h3 className='text-destructive font-semibold'>Zona de peligro</h3>
          <p className='text-muted-foreground text-sm'>Eliminar este producto es una acción irreversible.</p>
        </CardHeader>
        <CardContent>
          <Separator className='mb-4' />
          <DeleteProductButton productId={product.id} productName={product.name} businessId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
