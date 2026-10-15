import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-5 w-5 rounded-full border-2 border-gray-200 border-t-brand animate-spin-slow', className)}
      aria-hidden="true"
    />
  );
}
