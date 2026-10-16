import { Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md';
}

export function Logo({ className, href = '/', size = 'md' }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-brand text-white shadow-sm',
          size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
        )}
      >
        <Crown
          className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')}
          aria-hidden
        />
      </div>
      <div className="leading-tight">
        <span
          className={cn(
            'font-semibold tracking-tight',
            size === 'sm' ? 'text-base' : 'text-lg'
          )}
        >
          <span className="text-brand">Chess</span>
          <span className="text-gray-900">Gabon</span>
        </span>
        <span className="ml-1 hidden text-gray-400 font-normal sm:inline">
          Gestion
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}
