'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BASE_URL } from '@/lib/api';
import type { MemberDetail } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type Status = 'loading' | 'idle' | 'error' | 'notfound';

export default function MemberPublicPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!id) {
      setStatus('notfound');
      return;
    }
    let cancelled = false;
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
  }, [id]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted transition hover:text-brand">Classement</Link>
            <Link href="/tournois" className="text-muted transition hover:text-brand">Tournois</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {status === 'loading' && (
          <div className="space-y-4" role="status">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState variant="offline" title="Connexion impossible" message="Impossible de charger la fiche joueur." />
        )}

        {status === 'notfound' && (
          <EmptyState
            variant="search"
            title="Joueur introuvable"
            message="Ce membre n’existe pas ou n’est plus référencé."
            action={<Link href="/" className="text-sm font-medium text-brand hover:underline">← Retour au classement</Link>}
          />
        )}

        {status === 'idle' && member && (
          <>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-white p-6 text-center shadow-sm sm:flex-row sm:text-left">
              <Avatar name={`${member.firstName} ${member.lastName}`} size="lg" className="h-14 w-14 text-base" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900">{member.pseudo}</h1>
                <p className="text-sm text-muted">{member.firstName} {member.lastName}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {member.lichess && (
                    <a href={`https://lichess.org/@/${member.lichess}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline">♟ {member.lichess}</a>
                  )}
                  {member.chesscom && (
                    <a href={`https://www.chess.com/member/${member.chesscom}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline">♞ {member.chesscom}</a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="brand">{member.totalPoints} pts</Badge>
                <Badge variant="gray">{member.tournamentsPlayed} tournoi{member.tournamentsPlayed !== 1 ? 's' : ''}</Badge>
              </div>
            </div>

            <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">Résultats</h2>
            {!member.results?.length ? (
              <EmptyState variant="empty" title="Pas encore de résultats" message="Ce joueur n’a pas encore de tournoi enregistré." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-brand text-white">
                      <th className="px-4 py-2.5 font-medium">Tournoi</th>
                      <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Date</th>
                      <th className="px-4 py-2.5 text-right font-medium">Rang</th>
                      <th className="px-4 py-2.5 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {member.results.map((r) => (
                      <tr key={r.id} className="table-row-interactive">
                        <td className="px-4 py-2.5 font-medium">
                          {r.tournament.name}
                          <p className="text-xs text-muted sm:hidden">{formatDate(r.tournament.date)}</p>
                        </td>
                        <td className="hidden px-4 py-2.5 text-muted sm:table-cell">{formatDate(r.tournament.date)}</td>
                        <td className="px-4 py-2.5 text-right">{r.rank ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
