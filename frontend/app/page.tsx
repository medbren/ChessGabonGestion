'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Timer,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankingSkeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

interface Filter {
  id: string;
  label: string;
  shortLabel: string;
  query: string;
  icon: typeof Trophy;
}

function buildFilters(now = new Date()): Filter[] {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return [
    { id: 'general', label: 'Général', shortLabel: 'Tous', query: '', icon: Trophy },
    { id: 'bullet', label: 'Bullet', shortLabel: 'Bullet', query: '?timeControl=BULLET', icon: Zap },
    { id: 'blitz', label: 'Blitz', shortLabel: 'Blitz', query: '?timeControl=BLITZ', icon: Flame },
    { id: 'rapid', label: 'Rapide', shortLabel: 'Rapide', query: '?timeControl=RAPID', icon: Timer },
    {
      id: 'monthly',
      label: 'Mensuel',
      shortLabel: 'Mois',
      query: `?type=monthly&month=${month}&year=${year}`,
      icon: Calendar,
    },
    {
      id: 'yearly',
      label: 'Annuel',
      shortLabel: 'Année',
      query: `?type=yearly&year=${year}`,
      icon: BarChart3,
    },
  ];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 shadow-sm ring-2 ring-yellow-300/50">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700 shadow-sm">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-amber-50 shadow-sm">
        3
      </span>
    );
  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-1 text-xs font-medium tabular-nums text-gray-500">
      {rank}
    </span>
  );
}

function Podium({ players }: { players: Player[] }) {
  const top = players.slice(0, 3);
  if (top.length < 1) return null;
  const orders = [top[1], top[0], top[2]];
  const heights = ['h-14 sm:h-16', 'h-20 sm:h-24', 'h-12 sm:h-14'];

  return (
    <div className="mb-5 flex items-end justify-center gap-1.5 px-1 sm:mb-6 sm:gap-3">
      {orders.map((p, i) => {
        if (!p) return <div key={i} className="w-[4.5rem] sm:w-24" />;
        const isFirst = p.rank === 1;
        return (
          <Link
            key={p.id}
            href={`/membres/${p.id}`}
            className={cn(
              'flex w-[4.5rem] flex-col items-center rounded-xl p-1 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/40 sm:w-24 sm:p-1.5',
              isFirst && 'relative z-[1]',
            )}
          >
            <Avatar
              name={p.fullName || p.pseudo}
              size={isFirst ? 'md' : 'sm'}
              className={cn(
                isFirst &&
                  'h-11 w-11 text-xs ring-2 ring-yellow-400 ring-offset-2 sm:h-12 sm:w-12',
              )}
            />
            <p className="mt-1.5 max-w-full truncate text-center text-[11px] font-semibold text-gray-900 hover:text-brand sm:mt-2 sm:text-sm">
              {p.pseudo}
            </p>
            <p className="text-[10px] tabular-nums text-muted sm:text-[11px]">
              {p.points} pts
            </p>
            <div
              className={cn(
                'mt-1.5 flex w-full items-start justify-center rounded-t-lg pt-1.5 text-sm font-bold text-white sm:mt-2 sm:pt-2 sm:text-base',
                heights[i],
                isFirst && 'bg-brand shadow-md shadow-brand/25',
                p.rank === 2 && 'bg-gray-400',
                p.rank === 3 && 'bg-amber-600',
              )}
            >
              {p.rank}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function filterSubtitle(filter: Filter, now: Date): string | null {
  if (filter.id === 'monthly') {
    const label = now.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  if (filter.id === 'yearly') return `Année ${now.getFullYear()}`;
  return null;
}

export default function HomePage() {
  const now = useMemo(() => new Date(), []);
  const filters = useMemo(() => buildFilters(now), [now]);
  const [rankings, setRankings] = useState<Player[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>(filters[0]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

  const [search, setSearch] = useState('');
  const [onlyWithPoints, setOnlyWithPoints] = useState(true);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);

  const loadRankings = useCallback(async (filter: Filter) => {
    setActiveFilter(filter);
    setStatus('loading');
    setRankings([]);
    setPage(1);
    try {
      const res = await fetch(`${BASE_URL}/rankings${filter.query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      setRankings(Array.isArray(data) ? (data as Player[]) : []);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadRankings(filters[0]);
  }, [loadRankings, filters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rankings.filter((p) => {
      if (onlyWithPoints && !(p.points > 0)) return false;
      if (!q) return true;
      const hay = [p.pseudo, p.fullName, String(p.rank), String(p.points)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rankings, search, onlyWithPoints]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, onlyWithPoints, pageSize, activeFilter.id]);

  const periodHint = filterSubtitle(activeFilter, now);

  const podiumPlayers = useMemo(() => {
    const withPts = rankings.filter((p) => p.points > 0);
    return (withPts.length ? withPts : rankings).slice(0, 3);
  }, [rankings]);

  const withPointsCount = useMemo(
    () => rankings.filter((p) => p.points > 0).length,
    [rankings],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--color-brand) 0, transparent 45%), radial-gradient(circle at 80% 0%, var(--color-accent) 0, transparent 35%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Chess Gabon
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
                Classements officiels
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Tournois multi-cadences · club d'échecs de Libreville
              </p>
            </div>
            {status === 'idle' && rankings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm">
                  <Users className="h-4 w-4 text-brand" aria-hidden />
                  <span className="tabular-nums font-semibold text-gray-900">
                    {rankings.length}
                  </span>
                  <span className="text-muted">joueurs</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm">
                  <Trophy className="h-4 w-4 text-accent-dark" aria-hidden />
                  <span className="tabular-nums font-semibold text-gray-900">
                    {withPointsCount}
                  </span>
                  <span className="text-muted">classés</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <nav
          aria-label="Filtres de classement"
          className="-mx-3 mb-5 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:mb-6 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
        >
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => void loadRankings(f)}
                aria-pressed={active}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                  active
                    ? 'border-brand bg-brand text-white shadow-md ring-2 ring-brand/20'
                    : 'border-border bg-white text-gray-600 hover:border-brand/30 hover:bg-brand-light hover:text-brand-dark',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="sm:hidden">{f.shortLabel}</span>
                <span className="hidden sm:inline">{f.label}</span>
              </button>
            );
          })}
        </nav>

        {status === 'loading' && <RankingSkeleton />}

        {status === 'idle' && podiumPlayers.length >= 1 && (
          <Podium players={podiumPlayers} />
        )}

        {status !== 'loading' && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="space-y-3 border-b border-border px-3 py-3 sm:px-5 sm:py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Classement {activeFilter.label}
                  </h2>
                  {periodHint ? (
                    <p className="text-xs text-muted">{periodHint}</p>
                  ) : null}
                </div>
                <Badge variant="gray">
                  {status === 'idle'
                    ? `${filtered.length} / ${rankings.length}`
                    : '…'}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un joueur…"
                    className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    aria-label="Rechercher dans le classement"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                      aria-label="Effacer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-gray-700 sm:min-h-0 sm:py-2">
                    <input
                      type="checkbox"
                      checked={onlyWithPoints}
                      onChange={(e) => setOnlyWithPoints(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="whitespace-nowrap">Avec points</span>
                  </label>
                  <label className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-sm text-gray-600 sm:min-h-0 sm:py-1.5">
                    <span className="hidden sm:inline">Par page</span>
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        setPageSize(
                          Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                        )
                      }
                      className="rounded-lg border-0 bg-transparent py-1.5 pr-1 text-sm outline-none focus:ring-0"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {status === 'error' && (
              <EmptyState
                variant="offline"
                title="Connexion impossible"
                message="Impossible de contacter le serveur. Vérifiez votre connexion réseau."
                action={
                  <button
                    type="button"
                    onClick={() => void loadRankings(activeFilter)}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Réessayer
                  </button>
                }
              />
            )}

            {status === 'idle' && rankings.length === 0 && (
              <EmptyState
                variant="empty"
                title={
                  activeFilter.id === 'monthly' || activeFilter.id === 'yearly'
                    ? 'Aucun résultat sur cette période'
                    : 'Classement vide'
                }
                message={
                  activeFilter.id === 'monthly' || activeFilter.id === 'yearly'
                    ? `Pas encore de tournoi enregistré pour ${periodHint ?? 'cette période'}.`
                    : 'Aucun joueur dans ce classement pour le moment.'
                }
                action={
                  activeFilter.id !== 'general' ? (
                    <button
                      type="button"
                      onClick={() => void loadRankings(filters[0])}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Voir le classement général
                    </button>
                  ) : (
                    <Link
                      href="/tournois"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Voir les tournois
                    </Link>
                  )
                }
              />
            )}

            {status === 'idle' && rankings.length > 0 && filtered.length === 0 && (
              <EmptyState
                variant="search"
                title="Aucun résultat"
                message="Aucun joueur ne correspond à la recherche ou au filtre."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setOnlyWithPoints(false);
                    }}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                }
              />
            )}

            {status === 'idle' && filtered.length > 0 && (
              <>
                <ul className="divide-y divide-border sm:hidden">
                  {pageSlice.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/membres/${p.id}`}
                        className="flex items-center gap-3 px-3 py-3.5 active:bg-gray-50"
                      >
                        <RankBadge rank={p.rank} />
                        <Avatar name={p.fullName || p.pseudo} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">
                            {p.pseudo || '—'}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {p.fullName || '—'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-gray-900">
                            {p.points ?? '—'}
                            <span className="ml-0.5 text-xs font-normal text-muted">
                              pts
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {p.tournaments ?? 0} t.
                            {p.rawPoints != null ? ` · ${p.rawPoints}` : ''}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="bg-brand text-white">
                        <th className="w-14 px-3 py-3 text-center font-medium lg:w-16 lg:px-4">
                          Rang
                        </th>
                        <th className="px-3 py-3 font-medium lg:px-4">Joueur</th>
                        <th className="hidden px-3 py-3 font-medium md:table-cell lg:px-4">
                          Nom complet
                        </th>
                        <th className="px-3 py-3 text-right font-medium lg:px-4">
                          Points
                        </th>
                        <th className="hidden px-3 py-3 text-right font-medium lg:table-cell lg:px-4">
                          Score brut
                        </th>
                        <th className="px-3 py-3 text-right font-medium lg:px-4">
                          Tournois
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pageSlice.map((p) => (
                        <tr key={p.id} className="table-row-interactive">
                          <td className="px-3 py-3 text-center lg:px-4">
                            <RankBadge rank={p.rank} />
                          </td>
                          <td className="px-3 py-3 lg:px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={p.fullName || p.pseudo}
                                size="sm"
                              />
                              <Link
                                href={`/membres/${p.id}`}
                                className="font-medium text-blue hover:underline"
                              >
                                {p.pseudo || '—'}
                              </Link>
                            </div>
                          </td>
                          <td className="hidden px-3 py-3 text-muted md:table-cell lg:px-4">
                            {p.fullName || '—'}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums lg:px-4">
                            {p.points ?? '—'}
                          </td>
                          <td className="hidden px-3 py-3 text-right tabular-nums text-muted lg:table-cell lg:px-4">
                            {p.rawPoints ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-muted lg:px-4">
                            {p.tournaments ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-3 sm:px-5">
                  <p className="text-xs text-muted">
                    {(safePage - 1) * pageSize + 1}–
                    {Math.min(safePage * pageSize, filtered.length)} sur{' '}
                    {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 sm:rounded-lg"
                      aria-label="Page précédente"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-gray-700">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 sm:rounded-lg"
                      aria-label="Page suivante"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
