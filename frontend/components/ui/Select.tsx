'use client';

import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({
  className,
  label,
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full cursor-pointer rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900',
          'outline-none transition-all duration-150',
          'hover:border-gray-300',
          'focus:border-brand focus:ring-2 focus:ring-brand/25 focus:shadow-sm',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
