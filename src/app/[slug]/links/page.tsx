import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLinkPageBySlug } from '@/modules/link-bio/server/queries/get-link-bio-data';
import { LinkBioPublicPage } from '@/modules/link-bio/ui/components/link-bio-public-page';
import { getDefaultCatalog, getCatalogSettings } from '@/modules/storefront/server/queries/get-storefront-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLinkPageBySlug(slug);
  if (!data) return {};

  const { business, page } = data;
  const title = page.seoTitle || page.title || business.name;
  const description = page.seoDescription || page.bio || business.description || `Links de ${business.name}`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    ...(business.logoUrl ? { icons: { icon: business.logoUrl } } : {}),
  };
}

export default async function LinkBioPage({ params }: Props) {
  const { slug } = await params;
  const data = await getLinkPageBySlug(slug);

  if (!data) notFound();

  const { business, page, links } = data;

  // Optionally load storefront theme if useStorefrontTheme is enabled
  let storefrontTheme = null;
  if (page.useStorefrontTheme) {
    const catalog = await getDefaultCatalog(business.id);
    if (catalog) {
      const settings = await getCatalogSettings(catalog.id);
      if (settings) {
        storefrontTheme = {
          primaryColor: settings.primaryColor ?? '#000000',
          backgroundColor: settings.backgroundColor ?? '#ffffff',
          textColor: settings.textColor ?? '#111827',
          borderRadius: settings.borderRadius ?? 12,
        };
      }
    }
  }

  return <LinkBioPublicPage business={business} page={page} links={links} storefrontTheme={storefrontTheme} />;
}
