import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { LinkBioManager } from '@/modules/link-bio/ui/components/link-bio-manager';
import { getOrCreateLinkPageAction } from '@/modules/link-bio/server/actions/link-bio.actions';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BusinessLinksPage({ params }: Props) {
  const { id } = await params;
  const business = await getBusinessByIdAction(id);
  if (!business) notFound();

  const { page, links } = await getOrCreateLinkPageAction(id);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon-sm' asChild>
          <Link href={`/dashboard/businesses/${business.id}`}>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Página de Links</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Tu bio link personalizable para <strong>{business.name}</strong>.
          </p>
        </div>
      </div>

      <LinkBioManager businessId={business.id} businessSlug={business.slug} page={page} links={links} />
    </div>
  );
}
