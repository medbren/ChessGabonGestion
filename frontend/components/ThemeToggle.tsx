'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  type ThemeMode,
  applyTheme,
  cycleTheme,
  getStoredTheme,
  resolveTheme,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

const LABELS: Record<ThemeMode, string> = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Système',
};

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setMode(stored);
    setResolved(applyTheme(stored));
    setReady(true);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      const current = getStoredTheme();
      if (current === 'system') {
        setResolved(applyTheme('system'));
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function onClick() {
    const next = cycleTheme(mode);
    setMode(next);
    setResolved(resolveTheme(next));
  }

  const Icon = mode === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-gray-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-light hover:text-brand-dark dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        className,
      )}
      title={`Thème : ${LABELS[mode]} (cliquer pour changer)`}
      aria-label={`Thème ${LABELS[mode]}. Passer au suivant.`}
    >
      {ready ? (
        <Icon className="h-4 w-4" aria-hidden />
      ) : (
        <span className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      )}
    </button>
  );
}
