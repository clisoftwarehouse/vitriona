'use client';

import { ExternalLink } from 'lucide-react';

interface CatalogLinkProps {
  slug: string;
}

export function CatalogLink({ slug }: CatalogLinkProps) {
  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`https://vitriona.app/${slug}`, '_blank', 'noopener,noreferrer');
      }}
      className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors'
    >
      <ExternalLink className='size-3' />
      Ver catálogo
    </button>
  );
}
