'use client';

import Image from 'next/image';

/**
 * Semi-transparent tiled watermark overlay for free-plan storefronts.
 * Renders a repeated Vitriona logo pattern over product images.
 * Must be placed inside a `position: relative` container.
 */
export function WatermarkOverlay() {
  return (
    <div className='pointer-events-none absolute inset-0 z-10 overflow-hidden select-none' aria-hidden='true'>
      <div className='absolute flex flex-wrap items-center justify-center gap-6' style={{ inset: '' }}>
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className='opacity-20' style={{ width: 80, height: 80 }}>
            <Image
              src='/images/vitriona-logo-light.png'
              alt=''
              width={80}
              height={80}
              className='size-full object-contain'
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}
