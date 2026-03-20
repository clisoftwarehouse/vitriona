import { notFound } from 'next/navigation';

import { ProductsGrid } from '@/modules/products/ui/components/products-grid';
import { getCategoriesAction } from '@/modules/categories/server/actions/get-categories.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface ProductsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { id } = await params;

  const [business, categories] = await Promise.all([getBusinessByIdAction(id), getCategoriesAction(id)]);

  if (!business) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight'>Productos</h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>{business.name}</p>
      </div>

      <ProductsGrid businessId={id} categories={categories} />
    </div>
  );
}
