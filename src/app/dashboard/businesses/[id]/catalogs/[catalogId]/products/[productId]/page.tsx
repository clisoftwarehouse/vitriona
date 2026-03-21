import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getBrandsAction } from '@/modules/brands/server/actions/get-brands.action';
import { EditProductWrapper } from '@/modules/products/ui/components/edit-product-wrapper';
import { ProductImageUpload } from '@/modules/products/ui/components/product-image-upload';
import { getAttributesAction } from '@/modules/attributes/server/actions/attribute.actions';
import { DeleteProductButton } from '@/modules/products/ui/components/delete-product-button';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { ProductVariantsEditor } from '@/modules/products/ui/components/product-variants-editor';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getProductVariantsAction } from '@/modules/products/server/actions/product-variants.action';
import { getCatalogsAction, getCatalogByIdAction } from '@/modules/catalogs/server/actions/get-catalogs.action';
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
  params: Promise<{ id: string; catalogId: string; productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, catalogId, productId } = await params;
  const [
    business,
    catalog,
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
    getCatalogByIdAction(catalogId),
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
            catalogs={allCatalogs}
            brands={brands}
            attributes={attributes}
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
              catalogIds: productCatalogIds.length > 0 ? productCatalogIds : [catalogId],
              attributeValues: attrValues,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Imágenes</h3>
        </CardHeader>
        <CardContent>
          <ProductImageUpload productId={product.id} initialImages={images} />
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
                <Link href={`/dashboard/businesses/${id}/catalogs/${catalogId}/products/${product.id}/inventory`}>
                  Gestionar inventario
                </Link>
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
