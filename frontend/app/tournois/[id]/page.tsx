'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Trophy, Users } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import {
  PLATFORM_LABELS,
  TIME_CONTROL_LABELS,
  type Platform,
  type TimeControl,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ResultRow {
  id: number;
  points: number;
  championshipPoints: number;
  rank: number | null;
  member: {
    id: number;
    pseudo: string;
    firstName: string;
    lastName: string;
    chesscom?: string | null;
    lichess?: string | null;
  };
}

interface TournamentDetail {
  id: number;
  name: string;
  platform: Platform;
  timeControl: TimeControl;
  date: string;
  results: ResultRow[];
}

type Status = 'loading' | 'idle' | 'error' | 'notfound';

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null)
    return (
      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-1 text-xs text-muted">
        —
      </span>
    );
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-amber-50">
        3
      </span>
    );
  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-1 text-xs font-medium tabular-nums text-gray-500">
      {rank}
    </span>
  );
}

export default function TournamentDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [status, setStatus] = useState<Status>('loading');
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(Number(id))) {
      setStatus('notfound');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tournaments/${id}`);
        if (res.status === 404) {
          if (!cancelled) setStatus('notfound');
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as TournamentDetail | null;
        if (!cancelled) {
          if (!data || !data.id) {
            setStatus('notfound');
            return;
          }
          setTournament(data);
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sortedResults = useMemo(() => {
    if (!tournament?.results) return [];
    return [...tournament.results].sort((a, b) => {
      const ra = a.rank ?? 9999;
      const rb = b.rank ?? 9999;
      if (ra !== rb) return ra - rb;
      return (b.championshipPoints ?? 0) - (a.championshipPoints ?? 0);
    });
  }, [tournament]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <Link
          href="/tournois"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Tous les tournois
        </Link>

        {status === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            variant="offline"
            title="Chargement impossible"
            message="Impossible de récupérer ce tournoi."
            action={
              <Link href="/tournois" className="text-sm font-medium text-brand hover:underline">
                Retour à la liste
              </Link>
            }
          />
        )}

        {status === 'notfound' && (
          <EmptyState
            variant="empty"
            title="Tournoi introuvable"
            message="Ce tournoi n’existe pas ou a été supprimé."
            action={
              <Link href="/tournois" className="text-sm font-medium text-brand hover:underline">
                Voir les tournois
              </Link>
            }
          />
        )}

        {status === 'idle' && tournament && (
          <>
            <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border bg-gradient-to-br from-brand-light/80 to-white px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                      Tournoi
                    </p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                      {tournament.name}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {formatDate(tournament.date)}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {sortedResults.length} joueur
                        {sortedResults.length !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="blue">
                      {PLATFORM_LABELS[tournament.platform] ?? tournament.platform}
                    </Badge>
                    <Badge variant="gray">
                      {TIME_CONTROL_LABELS[tournament.timeControl] ??
                        tournament.timeControl}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Trophy className="h-4 w-4 text-brand" aria-hidden />
                  Classement du tournoi
                </h2>
                <Badge variant="gray">{sortedResults.length}</Badge>
              </div>

              {sortedResults.length === 0 ? (
                <EmptyState
                  variant="empty"
                  title="Aucun résultat"
                  message="Les résultats de ce tournoi n’ont pas encore été importés."
                />
              ) : (
                <>
                  <ul className="divide-y divide-border sm:hidden">
                    {sortedResults.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/membres/${r.member.id}`}
                          className="flex items-center gap-3 px-3 py-3.5 active:bg-gray-50"
                        >
                          <RankBadge rank={r.rank} />
                          <Avatar
                            name={`${r.member.firstName} ${r.member.lastName}`}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {r.member.pseudo}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {r.member.firstName} {r.member.lastName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              {r.championshipPoints}
                              <span className="ml-0.5 text-xs font-normal text-muted">
                                pts
                              </span>
                            </p>
                            <p className="text-[11px] text-muted tabular-nums">
                              score {r.points}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="bg-brand text-white">
                          <th className="w-14 px-3 py-3 text-center font-medium">
                            Rang
                          </th>
                          <th className="px-3 py-3 font-medium">Joueur</th>
                          <th className="px-3 py-3 text-right font-medium">
                            Score
                          </th>
                          <th className="px-3 py-3 text-right font-medium">
                            Pts championnat
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedResults.map((r) => (
                          <tr key={r.id} className="table-row-interactive">
                            <td className="px-3 py-2.5 text-center">
                              <RankBadge rank={r.rank} />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={`${r.member.firstName} ${r.member.lastName}`}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <Link
                                    href={`/membres/${r.member.id}`}
                                    className="font-medium text-blue hover:underline"
                                  >
                                    {r.member.pseudo}
                                  </Link>
                                  <p className="text-xs text-muted">
                                    {r.member.firstName} {r.member.lastName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                              {r.points}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                              {r.championshipPoints}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
