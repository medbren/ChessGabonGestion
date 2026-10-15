'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400 outline-none transition-all duration-150',
          'hover:border-gray-300',
          'focus:border-brand focus:ring-2 focus:ring-brand/25 focus:shadow-sm',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border',
          error &&
            'border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
