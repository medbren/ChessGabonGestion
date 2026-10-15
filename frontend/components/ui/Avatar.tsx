import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark', sizes[size], className)}>
      {getInitials(name)}
    </span>
  );
}
