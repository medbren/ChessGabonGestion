import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Variant = 'default' | 'brand' | 'yellow' | 'blue' | 'gray' | 'red';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-light text-brand-dark',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
