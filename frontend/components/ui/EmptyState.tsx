import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyVariant = 'empty' | 'error' | 'search' | 'offline';

interface EmptyStateProps {
  message: string;
  title?: string;
  variant?: EmptyVariant;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 120 100" className="h-20 w-24 text-brand" aria-hidden>
      <rect x="20" y="18" width="80" height="64" rx="6" fill="currentColor" opacity="0.12" />
      <rect x="28" y="26" width="64" height="48" rx="3" fill="white" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M28 38h16v12H28zm16 12h16v12H44zm16-12h16v12H60z" fill="currentColor" opacity="0.15" />
      <circle cx="60" cy="44" r="8" fill="currentColor" opacity="0.35" />
      <rect x="54" y="50" width="12" height="10" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="48" y="58" width="24" height="6" rx="3" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 120 100" className="h-20 w-24 text-brand" aria-hidden>
      <circle cx="52" cy="44" r="22" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />
      <circle cx="52" cy="44" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
      <line x1="63" y1="55" x2="82" y2="74" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
      <circle cx="48" cy="42" r="2" fill="currentColor" opacity="0.25" />
      <circle cx="56" cy="42" r="2" fill="currentColor" opacity="0.25" />
      <circle cx="52" cy="48" r="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function IllustrationError() {
  return (
    <svg viewBox="0 0 120 100" className="h-20 w-24 text-red-500" aria-hidden>
      <circle cx="60" cy="48" r="28" fill="currentColor" opacity="0.1" />
      <circle cx="60" cy="48" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      <line x1="48" y1="36" x2="72" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <line x1="72" y1="36" x2="48" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function IllustrationOffline() {
  return (
    <svg viewBox="0 0 120 100" className="h-20 w-24 text-muted" aria-hidden>
      <path d="M30 48c16-16 44-16 60 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
      <path d="M40 56c11-11 29-11 40 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <path d="M50 64c5-5 15-5 20 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <circle cx="60" cy="72" r="4" fill="currentColor" opacity="0.7" />
      <line x1="36" y1="78" x2="84" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

const illustrations: Record<EmptyVariant, () => ReactNode> = {
  empty: IllustrationEmpty,
  search: IllustrationSearch,
  error: IllustrationError,
  offline: IllustrationOffline,
};

export function EmptyState({
  message,
  title,
  variant = 'empty',
  icon,
  action,
  className,
}: EmptyStateProps) {
  const Illustration = illustrations[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-14 text-center',
        className
      )}
      role="status"
    >
      <div className="mb-1">{icon ?? <Illustration />}</div>
      {title && (
        <p className="text-sm font-semibold text-gray-900">{title}</p>
      )}
      <p className="max-w-xs text-sm leading-relaxed text-muted">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
