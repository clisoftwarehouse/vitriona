'use client';

import { useRef, useEffect, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({ children, className = '', threshold = 0.15 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('animate-in');
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`translate-y-8 opacity-0 transition-all duration-700 ease-out [&.animate-in]:translate-y-0 [&.animate-in]:opacity-100 ${className}`}
    >
      {children}
    </div>
  );
}
