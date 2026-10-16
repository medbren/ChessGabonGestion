'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ré-anime le contenu à chaque changement de route (fade + léger slide).
 * Respecte prefers-reduced-motion via CSS.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
