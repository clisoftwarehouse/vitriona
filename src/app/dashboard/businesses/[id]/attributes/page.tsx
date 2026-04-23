import { eq, and, asc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { businesses, productAttributes } from '@/db/schema';
import { AttributesManager } from '@/modules/attributes/ui/components/attributes-manager';

interface AttributesPageProps {
  params: Promise<{ id: string }>;
}

export default async function AttributesPage({ params }: AttributesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const { id: businessId } = await params;

  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  if (!business) notFound();

  const attributes = await db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.businessId, businessId))
    .orderBy(asc(productAttributes.sortOrder));

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Atributos</h1>
        <p className='text-muted-foreground text-sm'>Gestiona los atributos de productos para {business.name}.</p>
      </div>

      <AttributesManager businessId={businessId} initialAttributes={attributes} />
    </div>
  );
}
