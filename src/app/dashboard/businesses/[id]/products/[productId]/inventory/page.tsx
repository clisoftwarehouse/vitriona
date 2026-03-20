import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { InventoryPanel } from '@/modules/inventory/ui/components/inventory-panel';
import { getProductByIdAction } from '@/modules/products/server/actions/get-products.action';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getInventoryMovementsAction } from '@/modules/inventory/server/actions/inventory.actions';

interface InventoryPageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { id, productId } = await params;
  const [business, product, movements] = await Promise.all([
    getBusinessByIdAction(id),
    getProductByIdAction(productId),
    getInventoryMovementsAction(productId),
  ]);

  if (!business || !product) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${id}/products/${productId}`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Inventario</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {business.name} — {product.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className='font-semibold'>Control de inventario</h3>
        </CardHeader>
        <CardContent>
          <InventoryPanel
            productId={product.id}
            productName={product.name}
            currentStock={product.stock ?? 0}
            minStock={product.minStock ?? 0}
            movements={movements}
          />
        </CardContent>
      </Card>
    </div>
  );
}
