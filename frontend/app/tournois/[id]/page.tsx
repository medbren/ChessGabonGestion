'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Gamepad2,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { TournamentAnalysis } from '@/components/TournamentAnalysis';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { ChessComAvatar } from '@/components/ui/ChessComAvatar';
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
import { cn, formatDate } from '@/lib/utils';

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
  externalUrl?: string | null;
  results: ResultRow[];
}

interface GameRow {
  white: string;
  black: string;
  whiteResult?: string;
  blackResult?: string;
  whiteRating?: number;
  blackRating?: number;
  url?: string;
  endTime?: string;
  pgn?: string;
  eco?: string;
  fen?: string;
}

interface GamesPayload {
  name: string;
  url: string;
  status: string;
  totalGames: number;
  rounds: { round: number; games: GameRow[] }[];
}

type Status = 'loading' | 'idle' | 'error' | 'notfound';
type Tab = 'standings' | 'games' | 'analysis';

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null)
    return (
      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-1 text-xs text-muted">—</span>
    );
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900">1</span>
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
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-1 text-xs font-medium tabular-nums text-gray-500">{rank}</span>
  );
}

function resultLabel(result?: string): string {
  if (!result) return '—';
  const r = result.toLowerCase();
  if (r === 'win') return '1';
  if (['agreed', 'stalemate', 'repetition', 'insufficient', 'timevsinsufficient', '50move'].includes(r)) return '½';
  return '0';
}

function resultTone(result?: string): string {
  if (!result) return 'text-muted';
  const r = result.toLowerCase();
  if (r === 'win') return 'text-brand font-semibold';
  if (['agreed', 'stalemate', 'repetition', 'insufficient', 'timevsinsufficient', '50move'].includes(r))
    return 'text-amber-700 dark:text-amber-400';
  return 'text-muted';
}

export default function TournamentDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [status, setStatus] = useState<Status>('loading');
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [tab, setTab] = useState<Tab>('standings');
  const [gamesStatus, setGamesStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [games, setGames] = useState<GamesPayload | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(Number(id))) { setStatus('notfound'); return; }
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tournaments/${id}`);
        if (res.status === 404) { if (!cancelled) setStatus('notfound'); return; }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as TournamentDetail | null;
        if (!cancelled) {
          if (!data || !data.id) { setStatus('notfound'); return; }
          setTournament(data);
          setStatus('idle');
        }
      } catch { if (!cancelled) setStatus('error'); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const sortedResults = useMemo(() => {
    if (!tournament?.results) return [];
    return [...tournament.results].sort((a, b) => {
      const ra = a.rank ?? 9999, rb = b.rank ?? 9999;
      if (ra !== rb) return ra - rb;
      return (b.championshipPoints ?? 0) - (a.championshipPoints ?? 0);
    });
  }, [tournament]);

  const loadGames = useCallback(async (url: string) => {
    setGamesStatus('loading');
    setGames(null);
    try {
      const res = await fetch(`${BASE_URL}/chesscom/tournament-games?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(String(res.status));
      setGames((await res.json()) as GamesPayload);
      setGamesStatus('ready');
    } catch { setGamesStatus('error'); }
  }, []);

  useEffect(() => {
    if (tab !== 'games' && tab !== 'analysis') return;
    if (gamesStatus === 'ready' || gamesStatus === 'loading') return;
    const url = tournament?.externalUrl?.trim();
    if (url) void loadGames(url);
  }, [tab, tournament?.externalUrl, gamesStatus, loadGames]);

  const allGamesFlat = useMemo(() => {
    if (!games) return [];
    const out: (GameRow & { round: number })[] = [];
    for (const r of games.rounds) for (const g of r.games) out.push({ ...g, round: r.round });
    return out;
  }, [games]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <Link href="/tournois" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tous les tournois
        </Link>

        {status === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState variant="offline" title="Chargement impossible" message="Impossible de récupérer ce tournoi."
            action={<Link href="/tournois" className="text-sm font-medium text-brand hover:underline">Retour à la liste</Link>} />
        )}

        {status === 'notfound' && (
          <EmptyState variant="empty" title="Tournoi introuvable" message="Ce tournoi n’existe pas ou a été supprimé."
            action={<Link href="/tournois" className="text-sm font-medium text-brand hover:underline">Voir les tournois</Link>} />
        )}

        {status === 'idle' && tournament && (
          <>
            <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border bg-gradient-to-br from-brand-light/80 to-white px-4 py-5 sm:px-6 dark:from-brand-light/40 dark:to-transparent">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">Tournoi</p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{tournament.name}</h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden />{formatDate(tournament.date)}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{sortedResults.length} joueur{sortedResults.length !== 1 ? 's' : ''}</span>
                    </p>
                    {tournament.externalUrl ? (
                      <a href={tournament.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-blue hover:underline" title={tournament.externalUrl}>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{tournament.externalUrl}</span>
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="blue">{PLATFORM_LABELS[tournament.platform] ?? tournament.platform}</Badge>
                    <Badge variant="gray">{TIME_CONTROL_LABELS[tournament.timeControl] ?? tournament.timeControl}</Badge>
                    {tournament.externalUrl ? (
                      <a href={tournament.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand">
                        <ExternalLink className="h-3 w-3" aria-hidden /> Chess.com
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto border-b border-border px-2 pt-2 sm:px-4">
                {([{ id: 'standings' as const, label: 'Classement', icon: Trophy }, { id: 'games' as const, label: 'Parties', icon: Swords }, { id: 'analysis' as const, label: 'Analyses', icon: Sparkles }] as const).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} type="button" onClick={() => setTab(t.id)}
                      className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-sm font-medium transition',
                        tab === t.id ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-gray-900')}>
                      <Icon className="h-4 w-4" aria-hidden />{t.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {tab === 'standings' && (
              <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Trophy className="h-4 w-4 text-brand" aria-hidden />Classement du tournoi</h2>
                  <Badge variant="gray">{sortedResults.length}</Badge>
                </div>
                {sortedResults.length === 0 ? (
                  <EmptyState variant="empty" title="Aucun résultat" message="Les résultats de ce tournoi n’ont pas encore été importés." />
                ) : (
                  <>
                    <ul className="divide-y divide-border sm:hidden">
                      {sortedResults.map((r) => (
                        <li key={r.id}>
                          <Link href={`/membres/${r.member.id}`} className="flex items-center gap-3 px-3 py-3.5 active:bg-gray-50">
                            <RankBadge rank={r.rank} />
                            <ChessComAvatar name={`${r.member.firstName} ${r.member.lastName}`} chesscom={r.member.chesscom || r.member.pseudo} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-900">{r.member.pseudo}</p>
                              <p className="truncate text-xs text-muted">{r.member.firstName} {r.member.lastName}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold tabular-nums">{r.championshipPoints}<span className="ml-0.5 text-xs font-normal text-muted">pts</span></p>
                              <p className="text-[11px] text-muted tabular-nums">score {r.points}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead><tr className="bg-brand text-white">
                          <th className="w-14 px-3 py-3 text-center font-medium">Rang</th>
                          <th className="px-3 py-3 font-medium">Joueur</th>
                          <th className="px-3 py-3 text-right font-medium">Score</th>
                          <th className="px-3 py-3 text-right font-medium">Pts championnat</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                          {sortedResults.map((r) => (
                            <tr key={r.id} className="table-row-interactive">
                              <td className="px-3 py-2.5 text-center"><RankBadge rank={r.rank} /></td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <ChessComAvatar name={`${r.member.firstName} ${r.member.lastName}`} chesscom={r.member.chesscom || r.member.pseudo} size="sm" />
                                  <div className="min-w-0">
                                    <Link href={`/membres/${r.member.id}`} className="font-medium text-blue hover:underline">{r.member.pseudo}</Link>
                                    <p className="text-xs text-muted">{r.member.firstName} {r.member.lastName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{r.points}</td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{r.championshipPoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )}

            {tab === 'games' && (
              <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Gamepad2 className="h-4 w-4 text-brand" aria-hidden />Parties
                    {games?.totalGames != null ? <span className="font-normal text-muted">· {games.totalGames}</span> : null}
                  </h2>
                  {games?.url ? (
                    <a href={games.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                      Voir sur Chess.com <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
                {!tournament.externalUrl && gamesStatus === 'idle' && (
                  <div className="space-y-3 p-4 sm:p-5">
                    <p className="text-sm text-muted">Colle le lien Chess.com pour charger les parties.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input type="url" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://www.chess.com/tournament/live/…"
                        className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                      <button type="button" disabled={!manualUrl.trim()} onClick={() => void loadGames(manualUrl.trim())}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Charger</button>
                    </div>
                  </div>
                )}
                {gamesStatus === 'loading' && (
                  <div className="space-y-3 p-4" role="status">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                    <p className="text-center text-xs text-muted">Récupération depuis Chess.com…</p>
                  </div>
                )}
                {gamesStatus === 'error' && (
                  <EmptyState variant="offline" title="Parties indisponibles" message="Impossible de charger les parties."
                    action={<button type="button" onClick={() => { setGamesStatus('idle'); const u = tournament.externalUrl?.trim() || manualUrl.trim(); if (u) void loadGames(u); }} className="text-sm font-medium text-brand hover:underline">Réessayer</button>} />
                )}
                {gamesStatus === 'ready' && games && games.totalGames === 0 && (
                  <EmptyState variant="empty" title="Aucune partie" message="Chess.com n’a renvoyé aucune partie." />
                )}
                {gamesStatus === 'ready' && games && games.totalGames > 0 && games.rounds.map((round) => (
                  <div key={round.round} className="border-b border-border last:border-b-0">
                    <div className="bg-surface/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted sm:px-5">
                      Ronde {round.round}<span className="ml-2 font-normal normal-case">{round.games.length} partie{round.games.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {round.games.map((g, gi) => {
                        const content = (
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                              <ChessComAvatar name={g.white} chesscom={g.white} size="md" className="ring-2 ring-white shadow-sm" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{g.white}</p>
                                <p className="text-[11px] text-muted">
                                  Blancs{g.whiteRating != null ? ` · ${g.whiteRating}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-sm font-bold tabular-nums shadow-sm ring-1 ring-border">
                                <span className={resultTone(g.whiteResult)}>{resultLabel(g.whiteResult)}</span>
                                <span className="text-muted">–</span>
                                <span className={resultTone(g.blackResult)}>{resultLabel(g.blackResult)}</span>
                              </div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted">vs</span>
                            </div>
                            <div className="flex min-w-0 items-center justify-end gap-2.5 sm:gap-3">
                              <div className="min-w-0 text-right">
                                <p className="truncate text-sm font-semibold text-gray-900">{g.black}</p>
                                <p className="text-[11px] text-muted">
                                  Noirs{g.blackRating != null ? ` · ${g.blackRating}` : ''}
                                </p>
                              </div>
                              <ChessComAvatar name={g.black} chesscom={g.black} size="md" className="ring-2 ring-white shadow-sm" />
                            </div>
                          </div>
                        );
                        return (
                          <li key={`${round.round}-${gi}`}>
                            {g.url ? (
                              <a href={g.url} target="_blank" rel="noopener noreferrer" className="block transition hover:bg-brand-light/40">
                                {content}
                              </a>
                            ) : (
                              content
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {tab === 'analysis' && (
              <TournamentAnalysis
                status={gamesStatus}
                games={allGamesFlat}
                externalUrl={tournament.externalUrl}
                manualUrl={manualUrl}
                onManualUrl={setManualUrl}
                onLoad={(url) => void loadGames(url)}
                onRetry={() => {
                  setGamesStatus('idle');
                  const url = tournament.externalUrl?.trim() || manualUrl.trim();
                  if (url) void loadGames(url);
                }}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
