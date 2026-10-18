'use client';

import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  /** URL photo (ex. Chess.com) — fallback initiales si erreur */
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base sm:h-20 sm:w-20 sm:text-lg',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(src) && !broken;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light font-semibold text-brand-dark',
        sizes[size],
        className,
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
