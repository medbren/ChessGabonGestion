'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Calendar,
  ExternalLink,
  Filter,
} from 'lucide-react';
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
  { id: 'CHESSCOM', label: 'Chess.com' },
  { id: 'LICHESS', label: 'Lichess' },
  { id: 'OTHER', label: 'Autre' },
];

const CADENCE_FILTERS: { id: 'ALL' | TimeControl; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'BULLET', label: 'Bullet' },
  { id: 'BLITZ', label: 'Blitz' },
  { id: 'RAPID', label: 'Rapide' },
  { id: 'CLASSICAL', label: 'Classique' },
];

function isRecent(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 21;
}

export default function TournamentsPublicPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [platform, setPlatform] = useState<'ALL' | Platform>('ALL');
  const [cadence, setCadence] = useState<'ALL' | TimeControl>('ALL');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tournaments`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
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
  }, []);

  const hasActiveFilters = platform !== 'ALL' || cadence !== 'ALL';

  const filtered = useMemo(() => {
    const list = [...tournaments]
      .filter((t) => (platform === 'ALL' ? true : t.platform === platform))
      .filter((t) => (cadence === 'ALL' ? true : t.timeControl === cadence))
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortDir === 'desc' ? db - da : da - db;
      });
    return list;
  }, [tournaments, platform, cadence, sortDir]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Tournois</h1>
          <p className="mt-1 text-sm text-muted">Historique des compétitions du club — clique une carte pour le détail.</p>
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <EmptyState variant="offline" title="Chargement impossible" message="Impossible de récupérer la liste des tournois." />
        )}

        {status !== 'loading' && status !== 'error' && tournaments.length > 0 && (
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                <Filter className="h-3.5 w-3.5" aria-hidden /> Plateforme
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_FILTERS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setPlatform(f.id)}
                    className={cn('rounded-full px-3 py-1 text-xs font-medium transition',
                      platform === f.id ? 'bg-brand text-white' : 'bg-white text-gray-700 ring-1 ring-border hover:bg-gray-50')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Cadence</span>
              <div className="flex flex-wrap gap-1.5">
                {CADENCE_FILTERS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setCadence(f.id)}
                    className={cn('rounded-full px-3 py-1 text-xs font-medium transition',
                      cadence === f.id ? 'bg-brand text-white' : 'bg-white text-gray-700 ring-1 ring-border hover:bg-gray-50')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-border hover:bg-gray-50">
                {sortDir === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden /> : <ArrowUpWideNarrow className="h-3.5 w-3.5" aria-hidden />}
                Date
              </button>
            </div>
          </div>
        )}

        {status === 'idle' && tournaments.length === 0 && (
          <EmptyState variant="empty" title="Aucun tournoi" message="Les tournois importés apparaîtront ici." />
        )}

        {status === 'idle' && tournaments.length > 0 && filtered.length === 0 && (
          <EmptyState variant="empty" title="Aucun résultat" message="Aucun tournoi ne correspond aux filtres."
            action={hasActiveFilters ? (
              <button type="button" onClick={() => { setPlatform('ALL'); setCadence('ALL'); }} className="text-sm font-medium text-brand hover:underline">Réinitialiser les filtres</button>
            ) : undefined}
          />
        )}

        {status === 'idle' && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((t) => {
              const resultCount = Array.isArray(t.results) ? t.results.length : 0;
              const recent = isRecent(t.date);
              return (
                <li key={t.id}>
                  <div className="card-lift group relative flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`/tournois/${t.id}`}
                      className="absolute inset-0 z-0 rounded-xl"
                      aria-label={`Voir le tournoi ${t.name}`}
                    />
                    <div className="relative z-10 flex min-w-0 items-start gap-3 pointer-events-none">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                        <Calendar className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 group-hover:text-brand">{t.name}</p>
                          {recent && <Badge variant="brand" className="text-[10px] uppercase tracking-wide">Récent</Badge>}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDate(t.date)}
                          {resultCount > 0 && <> · {resultCount} résultat{resultCount !== 1 ? 's' : ''}</>}
                        </p>
                        {t.externalUrl ? (
                          <p className="mt-1 truncate text-[11px] text-blue">
                            <span className="text-muted">Lien · </span>
                            {t.externalUrl.replace(/^https?:\/\/(www\.)?/, '')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant="blue">{PLATFORM_LABELS[t.platform as Platform] ?? t.platform}</Badge>
                      <Badge variant="gray">{TIME_CONTROL_LABELS[t.timeControl as TimeControl] ?? t.timeControl}</Badge>
                      {t.externalUrl ? (
                        <a
                          href={t.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:border-brand hover:text-brand"
                          title={t.externalUrl}
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden /> Ouvrir
                        </a>
                      ) : null}
                    </div>
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
