export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'chessgabon-theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Applique la classe `dark` sur <html> et met à jour color-scheme. */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  root.dataset.theme = mode;
  return resolved;
}

export function setTheme(mode: ThemeMode): 'light' | 'dark' {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  return applyTheme(mode);
}

/** Cycle light → dark → system → light */
export function cycleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode =
    current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
  setTheme(next);
  return next;
}
