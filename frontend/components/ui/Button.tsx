'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white border-transparent shadow-sm hover:bg-brand-dark hover:shadow-md active:bg-brand-dark active:scale-[0.98]',
  secondary:
    'bg-white text-gray-700 border-border shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow active:bg-gray-100 active:scale-[0.98]',
  ghost:
    'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200/80',
  danger:
    'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-[0.98]',
  accent:
    'bg-accent text-gray-900 border-accent-dark shadow-sm hover:bg-accent-dark hover:shadow-md active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs rounded-lg sm:min-h-0',
  md: 'min-h-11 px-4 py-2 text-sm rounded-lg sm:min-h-0',
  lg: 'min-h-12 px-5 py-2.5 text-base rounded-xl sm:min-h-0',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-medium transition-all duration-150 touch-manipulation',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
      )}
      {children}
    </button>
  );
}
