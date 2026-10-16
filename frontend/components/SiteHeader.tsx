'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Info, ListOrdered, Menu, Trophy, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Classement', icon: ListOrdered },
  { href: '/tournois', label: 'Tournois', icon: Trophy },
  { href: '/a-propos', label: 'À propos', icon: Info },
] as const;

interface SiteHeaderProps {
  action?: ReactNode;
}

export function SiteHeader({ action }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.closest?.('[data-mobile-drawer]')) {
      active.blur();
    }
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function closeMenu() {
    const drawer = document.querySelector('[data-mobile-drawer]');
    const active = document.activeElement as HTMLElement | null;
    if (active && drawer?.contains(active)) {
      active.blur();
    } else if (active?.closest?.('[data-mobile-drawer]')) {
      active.blur();
    }
    drawer?.querySelectorAll<HTMLElement>('a, button, [tabindex]').forEach((el) => {
      if (el === document.activeElement) el.blur();
    });
    setOpen(false);
    window.setTimeout(() => menuBtnRef.current?.focus(), 0);
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 border-b bg-white/95 pt-safe backdrop-blur-md transition-shadow duration-200 supports-[backdrop-filter]:bg-white/90',
          scrolled
            ? 'border-border/80 shadow-sm shadow-black/5'
            : 'border-border shadow-none'
        )}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-3 sm:h-14 sm:gap-4 sm:px-6">
          <div className="min-w-0 shrink-0">
            <Logo size="sm" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
            <nav
              aria-label="Navigation principale"
              className="hidden items-center gap-1 sm:flex"
            >
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-light text-brand-dark'
                        : 'text-muted hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        'pointer-events-none absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-brand transition-all',
                        active
                          ? 'w-5 opacity-100'
                          : 'w-3 opacity-0 group-hover:opacity-40'
                      )}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </nav>

            {action && (
              <>
                <span
                  className="hidden h-5 w-px shrink-0 bg-border sm:block"
                  aria-hidden
                />
                <div className="hidden shrink-0 sm:block">{action}</div>
              </>
            )}

            <button
              ref={menuBtnRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 active:bg-gray-200 sm:hidden"
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              aria-haspopup="dialog"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => (open ? closeMenu() : setOpen(true))}
            >
              {open ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div data-mobile-drawer className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={closeMenu}
          />

          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl animate-slide-in"
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4 pt-safe">
              <p className="text-sm font-semibold text-gray-900">Menu</p>
              <button
                ref={closeBtnRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
                aria-label="Fermer le menu"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav
              aria-label="Navigation mobile"
              className="flex-1 overflow-y-auto px-3 py-4"
            >
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-brand-light text-brand-dark'
                            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        )}
                        onClick={closeMenu}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            active
                              ? 'bg-brand text-white'
                              : 'bg-surface text-muted'
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {action && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Administration
                  </p>
                  <div className="px-1" onClick={closeMenu}>
                    {action}
                  </div>
                </div>
              )}
            </nav>

            <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-muted">
              Chess Gabon · Libreville
            </div>
          </div>
        </div>
      )}
    </>
  );
}
