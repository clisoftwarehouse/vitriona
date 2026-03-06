'use client';

import { ExternalLink } from 'lucide-react';

interface CatalogLinkProps {
  slug: string;
}

export function CatalogLink({ slug }: CatalogLinkProps) {
  return (
    <a
      href={`https://${slug}.vitriona.app`}
      target='_blank'
      rel='noopener noreferrer'
      onClick={(e) => e.stopPropagation()}
      className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors'
    >
      <ExternalLink className='size-3' />
      Ver catálogo
    </a>
  );
}
