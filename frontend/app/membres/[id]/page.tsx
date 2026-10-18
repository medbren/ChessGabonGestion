'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ExternalLink,
  Link2,
  Share2,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { ChessComAvatar } from '@/components/ui/ChessComAvatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  PLATFORM_LABELS,
  TIME_CONTROL_LABELS,
  type MemberDetail,
  type Platform,
  type TimeControl,
  type TournamentResult,
} from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type Status = 'loading' | 'idle' | 'error' | 'notfound';
type SortKey = 'date' | 'points' | 'rank';
type SortDir = 'desc' | 'asc';

function RankPill({ rank }: { rank: number | null }) {
  if (rank == null) return <span className="text-muted">—</span>;
  if (rank === 1)
    return (
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-yellow-400 px-1.5 text-xs font-bold text-yellow-900">1</span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-300 px-1.5 text-xs font-bold text-gray-700">2</span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-600 px-1.5 text-xs font-bold text-amber-50">3</span>
    );
  return <span className="tabular-nums text-sm text-gray-700">{rank}</span>;
}

function computeStats(results: TournamentResult[]) {
  if (!results.length) {
    return { bestRank: null as number | null, avgPoints: null as number | null, podiums: 0 };
  }
  const ranks = results.map((r) => r.rank).filter((r): r is number => typeof r === 'number' && r > 0);
  const bestRank = ranks.length ? Math.min(...ranks) : null;
  const pts = results.map((r) => r.points ?? 0);
  const avgPoints =
    pts.length > 0 ? Math.round((pts.reduce((a, b) => a + b, 0) / pts.length) * 10) / 10 : null;
  const podiums = ranks.filter((r) => r <= 3).length;
  return { bestRank, avgPoints, podiums };
}

export default function MemberPublicPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setStatus('notfound');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/members/${id}/results`);
        if (res.status === 404) {
          if (!cancelled) setStatus('notfound');
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as MemberDetail;
        if (!cancelled) {
          setMember(data);
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const stats = useMemo(() => computeStats(member?.results ?? []), [member?.results]);

  const sortedResults = useMemo(() => {
    const list = [...(member?.results ?? [])];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = new Date(a.tournament.date).getTime() - new Date(b.tournament.date).getTime();
      } else if (sortKey === 'points') {
        cmp = (a.points ?? 0) - (b.points ?? 0);
      } else {
        cmp = (a.rank ?? 9999) - (b.rank ?? 9999);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [member?.results, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  }

  async function shareProfile() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = member ? `${member.pseudo} — Chess Gabon` : 'Chess Gabon';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié dans le presse-papiers');
      } catch {
        toast.error('Impossible de partager le lien');
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au classement
          </Link>
          {status === 'idle' && member && (
            <button type="button" onClick={() => void shareProfile()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-brand hover:text-brand">
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Partager
            </button>
          )}
        </div>

        {status === 'loading' && (
          <div className="space-y-4" role="status" aria-label="Chargement">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState variant="offline" title="Connexion impossible" message="Impossible de charger la fiche joueur."
            action={<button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-medium text-brand hover:underline">Réessayer</button>} />
        )}

        {status === 'notfound' && (
          <EmptyState variant="search" title="Joueur introuvable" message="Ce membre n’existe pas ou n’est plus référencé."
            action={<Link href="/" className="text-sm font-medium text-brand hover:underline">← Retour au classement</Link>} />
        )}

        {status === 'idle' && member && (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 10% 0%, var(--color-brand) 0, transparent 50%), radial-gradient(circle at 90% 100%, var(--color-accent) 0, transparent 40%)',
                }}
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <ChessComAvatar
                  name={`${member.firstName} ${member.lastName}`}
                  chesscom={member.chesscom}
                  size="xl"
                  className="ring-2 ring-brand/20 ring-offset-2 ring-offset-white"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{member.pseudo}</h1>
                  <p className="text-sm text-muted">
                    {member.firstName} {member.lastName}
                  </p>
                  <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {member.lichess && (
                      <a href={`https://lichess.org/@/${member.lichess}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand">
                        ♟ {member.lichess}
                        <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                      </a>
                    )}
                    {member.chesscom && (
                      <a href={`https://www.chess.com/member/${member.chesscom}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand">
                        ♞ {member.chesscom}
                        <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
                <p className="text-xs font-medium text-muted">Points</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-brand">{member.totalPoints}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
                <p className="text-xs font-medium text-muted">Tournois</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{member.tournamentsPlayed}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
                <p className="text-xs font-medium text-muted">Meilleur rang</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{stats.bestRank != null ? `#${stats.bestRank}` : '—'}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
                <p className="text-xs font-medium text-muted">Podiums</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                  {stats.podiums}
                  {stats.avgPoints != null && (
                    <span className="ml-1.5 text-xs font-normal text-muted">· moy. {stats.avgPoints} pts</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Résultats</h2>
              {member.results?.length ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {([['date', 'Date'], ['points', 'Points'], ['rank', 'Rang']] as [SortKey, string][]).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => toggleSort(key)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                        sortKey === key ? 'border-brand bg-brand text-white' : 'border-border bg-white text-gray-600 hover:border-brand/40',
                      )}>
                      {label}
                      {sortKey === key &&
                        (sortDir === 'desc' ? (
                          <ArrowDownWideNarrow className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowUpWideNarrow className="h-3 w-3" aria-hidden />
                        ))}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {!member.results?.length ? (
              <EmptyState variant="empty" title="Pas encore de résultats" message="Ce joueur n’a pas encore de tournoi enregistré." />
            ) : (
              <>
                <ul className="space-y-2 sm:hidden">
                  {sortedResults.map((r) => (
                    <li key={r.id} className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{r.tournament.name}</p>
                          <p className="mt-0.5 text-xs text-muted">{formatDate(r.tournament.date)}</p>
                        </div>
                        <RankPill rank={r.rank} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="blue">{PLATFORM_LABELS[r.tournament.platform as Platform] ?? r.tournament.platform}</Badge>
                        <Badge variant="gray">{TIME_CONTROL_LABELS[r.tournament.timeControl as TimeControl] ?? r.tournament.timeControl}</Badge>
                        <span className="ml-auto text-sm font-semibold tabular-nums">{r.points ?? 0} pts</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-brand text-white">
                        <th className="px-4 py-2.5 font-medium">Tournoi</th>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium">Plateforme</th>
                        <th className="px-4 py-2.5 text-center font-medium">Rang</th>
                        <th className="px-4 py-2.5 text-right font-medium">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedResults.map((r) => (
                        <tr key={r.id} className="table-row-interactive">
                          <td className="px-4 py-2.5 font-medium">{r.tournament.name}</td>
                          <td className="px-4 py-2.5 text-muted">{formatDate(r.tournament.date)}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="blue">{PLATFORM_LABELS[r.tournament.platform as Platform] ?? r.tournament.platform}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center"><RankPill rank={r.rank} /></td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{r.points ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              Lien permanent : /membres/{id}
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
