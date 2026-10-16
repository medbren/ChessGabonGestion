'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Calendar, Filter } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import {
  PLATFORM_LABELS,
  TIME_CONTROL_LABELS,
  type Platform,
  type TimeControl,
  type Tournament,
} from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type Status = 'loading' | 'idle' | 'error';
type SortDir = 'desc' | 'asc';

const PLATFORM_FILTERS: { id: 'ALL' | Platform; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'LICHESS', label: 'Lichess' },
  { id: 'CHESSCOM', label: 'Chess.com' },
  { id: 'OTHER', label: 'Autre' },
];

const CADENCE_FILTERS: { id: 'ALL' | TimeControl; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'BULLET', label: 'Bullet' },
  { id: 'BLITZ', label: 'Blitz' },
  { id: 'RAPID', label: 'Rapide' },
  { id: 'CLASSICAL', label: 'Classique' },
];

const RECENT_MS = 30 * 24 * 60 * 60 * 1000;

function isRecent(dateStr: string): boolean {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= RECENT_MS && t <= Date.now() + RECENT_MS;
}

export default function TournamentsPublicPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [platform, setPlatform] = useState<'ALL' | Platform>('ALL');
  const [cadence, setCadence] = useState<'ALL' | TimeControl>('ALL');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tournaments`);
        if (!res.ok) throw new Error(String(res.status));
        const data: unknown = await res.json();
        if (!cancelled) {
          setTournaments(Array.isArray(data) ? (data as Tournament[]) : []);
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const hasActiveFilters = platform !== 'ALL' || cadence !== 'ALL';

  const filtered = useMemo(() => {
    const list = [...tournaments]
      .filter((t) => (platform === 'ALL' ? true : t.platform === platform))
      .filter((t) => (cadence === 'ALL' ? true : t.timeControl === cadence));
    list.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });
    return list;
  }, [tournaments, platform, cadence, sortDir]);

  function resetFilters() {
    setPlatform('ALL');
    setCadence('ALL');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Tournois
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Tournois multi-cadences organisés par le club
            </p>
          </div>
          {status === 'idle' && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gray">
                {filtered.length} tournoi{filtered.length !== 1 ? 's' : ''}
              </Badge>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand"
                aria-label={
                  sortDir === 'desc'
                    ? 'Tri : plus récents d’abord. Cliquer pour inverser.'
                    : 'Tri : plus anciens d’abord. Cliquer pour inverser.'
                }
              >
                {sortDir === 'desc' ? (
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ArrowUpWideNarrow className="h-3.5 w-3.5" aria-hidden />
                )}
                {sortDir === 'desc' ? 'Plus récents' : 'Plus anciens'}
              </button>
            </div>
          )}
        </div>

        {status !== 'loading' && status !== 'error' && tournaments.length > 0 && (
          <div className="mb-6 space-y-3 rounded-xl border border-border bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Filtres
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted">Plateforme</span>
                {PLATFORM_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPlatform(f.id)}
                    className={cn(
                      'pill rounded-full border px-2.5 py-1 text-xs font-medium',
                      platform === f.id
                        ? 'border-brand bg-brand text-white shadow-sm'
                        : 'border-border bg-white text-gray-600'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted">Cadence</span>
                {CADENCE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCadence(f.id)}
                    className={cn(
                      'pill rounded-full border px-2.5 py-1 text-xs font-medium',
                      cadence === f.id
                        ? 'border-brand bg-brand text-white shadow-sm'
                        : 'border-border bg-white text-gray-600'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-3" role="status" aria-label="Chargement">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            variant="offline"
            title="Connexion impossible"
            message="Impossible de charger les tournois. Vérifiez votre connexion."
            action={
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-sm font-medium text-brand hover:underline"
              >
                Réessayer
              </button>
            }
          />
        )}

        {status === 'idle' && tournaments.length === 0 && (
          <EmptyState
            variant="empty"
            title="Aucun tournoi"
            message="Les tournois publiés par l’administration apparaîtront ici."
          />
        )}

        {status === 'idle' && tournaments.length > 0 && filtered.length === 0 && (
          <EmptyState
            variant="search"
            title="Aucun résultat"
            message="Aucun tournoi ne correspond à ces filtres."
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-brand hover:underline"
              >
                Réinitialiser les filtres
              </button>
            }
          />
        )}

        {status === 'idle' && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((t) => {
              const resultCount = Array.isArray(t.results) ? t.results.length : 0;
              const recent = isRecent(t.date);
              return (
                <li
                  key={t.id}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                      <Calendar className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 group-hover:text-brand">
                          {t.name}
                        </p>
                        {recent && (
                          <Badge variant="brand" className="text-[10px] uppercase tracking-wide">
                            Récent
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(t.date)}
                        {resultCount > 0 && (
                          <>
                            {' '}
                            · {resultCount} résultat
                            {resultCount !== 1 ? 's' : ''}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Badge variant="blue">
                      {PLATFORM_LABELS[t.platform as Platform] ?? t.platform}
                    </Badge>
                    <Badge variant="gray">
                      {TIME_CONTROL_LABELS[t.timeControl as TimeControl] ??
                        t.timeControl}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
