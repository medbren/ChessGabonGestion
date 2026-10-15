'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankingSkeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Filter {
  label: string;
  query: string;
  icon: string;
}

const FILTERS: Filter[] = [
  { label: 'Général', query: '', icon: '🏆' },
  { label: 'Bullet', query: '?timeControl=BULLET', icon: '⚡' },
  { label: 'Blitz', query: '?timeControl=BLITZ', icon: '🔥' },
  { label: 'Rapide', query: '?timeControl=RAPID', icon: '⏱' },
  { label: 'Mensuel', query: '?type=monthly&month=6&year=2026', icon: '📅' },
  { label: 'Annuel', query: '?type=yearly&year=2026', icon: '📊' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 shadow-sm">1</span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700">2</span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-amber-50">3</span>
    );
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">{rank}</span>
  );
}

function Podium({ players }: { players: Player[] }) {
  const top = players.slice(0, 3);
  if (top.length < 1) return null;
  const orders = [top[1], top[0], top[2]];
  const heights = ['h-16', 'h-24', 'h-14'];

  return (
    <div className="mb-6 flex items-end justify-center gap-2 sm:gap-3">
      {orders.map((p, i) => {
        if (!p) return <div key={i} className="w-20 sm:w-24" />;
        const isFirst = p.rank === 1;
        return (
          <div key={p.id} className="flex w-20 flex-col items-center sm:w-24">
            <Avatar
              name={p.fullName || p.pseudo}
              size={isFirst ? 'md' : 'sm'}
              className={cn(isFirst && 'h-10 w-10 text-xs ring-2 ring-yellow-400 ring-offset-1')}
            />
            <Link
              href={`/membres/${p.id}`}
              className="mt-1.5 max-w-full truncate text-center text-xs font-semibold text-gray-900 hover:text-brand sm:text-sm"
            >
              {p.pseudo}
            </Link>
            <p className="text-[11px] text-muted tabular-nums">{p.points} pts</p>
            <div
              className={cn(
                'mt-2 flex w-full items-start justify-center rounded-t-lg pt-2 text-base font-bold text-white',
                heights[i],
                isFirst && 'bg-brand',
                p.rank === 2 && 'bg-gray-400',
                p.rank === 3 && 'bg-amber-600'
              )}
            >
              {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [rankings, setRankings] = useState<Player[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>(FILTERS[0]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

  const loadRankings = useCallback(async (filter: Filter) => {
    setActiveFilter(filter);
    setStatus('loading');
    setRankings([]);
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
    void loadRankings(FILTERS[0]);
  }, [loadRankings]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/tournois" className="hidden text-sm text-muted transition hover:text-brand sm:inline">Tournois</Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-dark bg-accent px-3.5 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all duration-150 hover:bg-accent-dark hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark/40 focus-visible:ring-offset-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Administration</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Classements officiels</h1>
          <p className="mt-1.5 text-sm text-muted">Club d'échecs Chess Gabon — tournois multi-cadences</p>
        </div>

        <nav aria-label="Filtres de classement" className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => void loadRankings(f)}
              aria-pressed={activeFilter.label === f.label}
              className={cn(
                'pill inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium',
                activeFilter.label === f.label
                  ? 'border-brand bg-brand text-white shadow-md ring-2 ring-brand/20'
                  : 'border-border bg-white text-gray-600'
              )}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </nav>

        {status === 'loading' && <RankingSkeleton />}

        {status === 'idle' && rankings.length >= 1 && <Podium players={rankings} />}

        {status !== 'loading' && (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">Classement {activeFilter.label}</h2>
              <Badge variant="gray">{`${rankings.length} joueur${rankings.length !== 1 ? 's' : ''}`}</Badge>
            </div>

            {status === 'error' && (
              <EmptyState variant="offline" title="Connexion impossible" message="Impossible de contacter le serveur. Vérifiez votre connexion réseau." />
            )}
            {status === 'idle' && rankings.length === 0 && (
              <EmptyState variant="empty" title="Classement vide" message="Aucun joueur dans ce classement pour le moment." />
            )}
            {status === 'idle' && rankings.length > 0 && (
              <>
                <ul className="divide-y divide-border sm:hidden">
                  {rankings.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                      <RankBadge rank={p.rank} />
                      <Avatar name={p.fullName || p.pseudo} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/membres/${p.id}`} className="block truncate font-medium text-blue hover:underline">{p.pseudo || '—'}</Link>
                        <p className="truncate text-xs text-muted">{p.fullName || '—'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {p.points ?? '—'}
                          <span className="ml-0.5 text-xs font-normal text-muted">pts</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          ♞ {p.tournaments ?? 0}
                          {p.rawPoints != null ? ` · ${p.rawPoints}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="bg-brand text-white">
                        <th className="w-16 px-4 py-3 text-center font-medium">Rang</th>
                        <th className="px-4 py-3 font-medium">Joueur</th>
                        <th className="px-4 py-3 font-medium">Nom complet</th>
                        <th className="px-4 py-3 text-right font-medium">Points</th>
                        <th className="px-4 py-3 text-right font-medium">Score brut</th>
                        <th className="px-4 py-3 text-right font-medium">Tournois</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rankings.map((p) => (
                        <tr key={p.id} className="table-row-interactive">
                          <td className="px-4 py-3 text-center"><RankBadge rank={p.rank} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={p.fullName || p.pseudo} size="sm" />
                              <Link href={`/membres/${p.id}`} className="font-medium text-blue hover:underline">{p.pseudo || '—'}</Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted">{p.fullName || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{p.points ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-muted">{p.rawPoints ?? '—'}</td>
                          <td className="px-4 py-3 text-right"><Badge variant="gray">♞ {p.tournaments ?? 0}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
