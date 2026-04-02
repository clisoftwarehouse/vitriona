import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { normalizeStorefrontQrSettings } from '@/modules/storefront/lib/storefront-qr';
import { StorefrontQrStudio } from '@/modules/storefront/ui/components/storefront-qr-studio';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface BusinessQrPageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessQrPage({ params }: BusinessQrPageProps) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);

  if (!business) notFound();

  const hasPersistedSettings = Boolean(business.qrSettings);
  const initialSettings = normalizeStorefrontQrSettings({
    value: business.qrSettings,
    businessSlug: business.slug,
    businessLogoUrl: business.logoUrl,
  });

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${business.id}`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>QR para storefront</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Genera un QR personalizado para compartir <strong>{business.name}</strong>.
          </p>
        </div>
      </div>

      <StorefrontQrStudio
        businessId={business.id}
        businessName={business.name}
        businessSlug={business.slug}
        businessLogoUrl={business.logoUrl}
        initialSettings={initialSettings}
        hasPersistedSettings={hasPersistedSettings}
      />
    </div>
  );
}
