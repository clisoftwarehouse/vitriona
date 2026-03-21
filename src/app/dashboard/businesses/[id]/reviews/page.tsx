import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { ReviewsDashboard } from '@/modules/reviews/ui/components/reviews-dashboard';

interface ReviewsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Reseñas</h1>
        <p className='text-muted-foreground text-sm'>Gestiona las reseñas de tus productos.</p>
      </div>

      <ReviewsDashboard businessId={businessId} />
    </div>
  );
}
