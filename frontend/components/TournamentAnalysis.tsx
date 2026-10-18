'use client';

import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChessComAvatar } from '@/components/ui/ChessComAvatar';

export interface AnalysisGame {
  white: string;
  black: string;
  whiteResult?: string;
  blackResult?: string;
  whiteRating?: number;
  blackRating?: number;
  url?: string;
  pgn?: string;
  eco?: string;
  round: number;
}

function isDraw(result?: string): boolean {
  if (!result) return false;
  return [
    'agreed',
    'stalemate',
    'repetition',
    'insufficient',
    'timevsinsufficient',
    '50move',
  ].includes(result.toLowerCase());
}

function isWin(result?: string): boolean {
  return result?.toLowerCase() === 'win';
}

function resultLabel(result?: string): string {
  if (!result) return '—';
  if (isWin(result)) return '1';
  if (isDraw(result)) return '½';
  return '0';
}

interface Props {
  status: 'idle' | 'loading' | 'error' | 'ready';
  games: AnalysisGame[];
  externalUrl?: string | null;
  manualUrl: string;
  onManualUrl: (v: string) => void;
  onLoad: (url: string) => void;
  onRetry: () => void;
}

export function TournamentAnalysis({
  status,
  games,
  externalUrl,
  manualUrl,
  onManualUrl,
  onLoad,
  onRetry,
}: Props) {
  const [expandedPgn, setExpandedPgn] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!games.length) return null;
    let whiteWins = 0,
      blackWins = 0,
      draws = 0,
      ratingSum = 0,
      ratingN = 0;
    const ecoCount = new Map<string, number>();
    const upsets: (AnalysisGame & { gap: number })[] = [];
    for (const g of games) {
      if (isWin(g.whiteResult)) whiteWins += 1;
      else if (isWin(g.blackResult)) blackWins += 1;
      else if (isDraw(g.whiteResult) || isDraw(g.blackResult)) draws += 1;
      if (g.whiteRating != null) {
        ratingSum += g.whiteRating;
        ratingN += 1;
      }
      if (g.blackRating != null) {
        ratingSum += g.blackRating;
        ratingN += 1;
      }
      if (g.eco?.trim())
        ecoCount.set(g.eco.trim(), (ecoCount.get(g.eco.trim()) ?? 0) + 1);
      if (
        g.whiteRating != null &&
        g.blackRating != null &&
        isWin(g.whiteResult) &&
        g.whiteRating < g.blackRating
      )
        upsets.push({ ...g, gap: g.blackRating - g.whiteRating });
      else if (
        g.whiteRating != null &&
        g.blackRating != null &&
        isWin(g.blackResult) &&
        g.blackRating < g.whiteRating
      )
        upsets.push({ ...g, gap: g.whiteRating - g.blackRating });
    }
    upsets.sort((a, b) => b.gap - a.gap);
    return {
      total: games.length,
      whiteWins,
      blackWins,
      draws,
      avgRating: ratingN ? Math.round(ratingSum / ratingN) : null,
      openings: [...ecoCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      upsets: upsets.slice(0, 8),
    };
  }, [games]);

  async function copyPgn(key: string, pgn: string) {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* */
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <BarChart3 className="h-4 w-4 text-brand" aria-hidden />
            Synthèse
          </h2>
        </div>
        {!externalUrl && status === 'idle' && (
          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-sm text-muted">
              Colle le lien Chess.com du tournoi pour analyser les parties.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => onManualUrl(e.target.value)}
                placeholder="https://www.chess.com/tournament/live/…"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                disabled={!manualUrl.trim()}
                onClick={() => onLoad(manualUrl.trim())}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Charger
              </button>
            </div>
          </div>
        )}
        {status === 'loading' && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}
        {status === 'error' && (
          <EmptyState
            variant="offline"
            title="Analyse indisponible"
            message="Impossible de charger les parties depuis Chess.com."
            action={
              <button type="button" onClick={onRetry} className="text-sm font-medium text-brand hover:underline">
                Réessayer
              </button>
            }
          />
        )}
        {status === 'ready' && stats && (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
            {(
              [
                ['Parties', stats.total],
                ['Victoires blancs', stats.whiteWins],
                ['Victoires noirs', stats.blackWins],
                ['Nulles', stats.draws],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="rounded-xl border border-border bg-surface px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{val}</p>
              </div>
            ))}
            {stats.avgRating != null && (
              <div className="col-span-2 rounded-xl border border-border bg-surface px-3 py-3 sm:col-span-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Elo moyen</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{stats.avgRating}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {status === 'ready' && stats && stats.openings.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">Ouvertures (ECO)</h2>
          </div>
          <ul className="divide-y divide-border">
            {stats.openings.map(([eco, count]) => (
              <li key={eco} className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="font-mono text-sm font-medium">{eco}</span>
                <span className="text-sm tabular-nums text-muted">{count}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {status === 'ready' && stats && stats.upsets.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">Surprises (écart Elo)</h2>
            <p className="text-xs text-muted">Victoires contre un adversaire mieux classé</p>
          </div>
          <ul className="divide-y divide-border">
            {stats.upsets.map((g, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                  <ChessComAvatar
                    name={isWin(g.whiteResult) ? g.white : g.black}
                    chesscom={isWin(g.whiteResult) ? g.white : g.black}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {isWin(g.whiteResult) ? g.white : g.black}
                      <span className="mx-1.5 font-normal text-muted">bat</span>
                      {isWin(g.whiteResult) ? g.black : g.white}
                    </p>
                    <p className="text-xs text-muted">
                      Ronde {g.round} · écart {g.gap} Elo
                    </p>
                  </div>
                </div>
                {g.url ? (
                  <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand hover:underline">
                    Analyser
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {status === 'ready' && games.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-900">Parties & PGN</h2>
            <p className="text-xs text-muted">Analyse Chess.com ou copie du PGN</p>
          </div>
          <ul className="divide-y divide-border">
            {games.map((g, i) => {
              const key = `${g.round}-${i}`;
              const open = expandedPgn === key;
              return (
                <li key={key} className="px-3 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <div className="flex -space-x-1.5">
                        <ChessComAvatar name={g.white} chesscom={g.white} size="sm" className="ring-2 ring-white" />
                        <ChessComAvatar name={g.black} chesscom={g.black} size="sm" className="ring-2 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {g.white} <span className="text-muted">–</span> {g.black}
                        </p>
                        <p className="text-xs text-muted">
                          R{g.round}
                          {g.eco ? ` · ${g.eco}` : ''} ·{' '}
                          {resultLabel(g.whiteResult)}–{resultLabel(g.blackResult)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.url ? (
                        <a href={g.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">
                          <Sparkles className="h-3 w-3" /> Analyser
                        </a>
                      ) : null}
                      {g.pgn ? (
                        <>
                          <button type="button" onClick={() => void copyPgn(key, g.pgn!)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">
                            <Copy className="h-3 w-3" /> {copiedKey === key ? 'Copié' : 'PGN'}
                          </button>
                          <button type="button" onClick={() => setExpandedPgn(open ? null : key)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium">
                            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Voir
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {open && g.pgn ? (
                    <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-surface p-3 text-[11px] leading-relaxed text-gray-700">
                      {g.pgn}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
