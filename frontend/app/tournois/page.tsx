'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
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
import { formatDate } from '@/lib/utils';

type Status = 'loading' | 'idle' | 'error';

export default function TournamentsPublicPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
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
  }, []);

  const sorted = [...tournaments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted transition hover:text-brand">Classement</Link>
            <span className="font-medium text-brand">Tournois</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Tournois</h1>
          <p className="mt-1.5 text-sm text-muted">Liste des tournois enregistrés par le club</p>
        </div>

        {status === 'loading' && (
          <div className="space-y-3" role="status" aria-label="Chargement">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <EmptyState variant="offline" title="Connexion impossible" message="Impossible de charger les tournois. Vérifiez votre connexion." />
        )}

        {status === 'idle' && sorted.length === 0 && (
          <EmptyState variant="empty" title="Aucun tournoi" message="Les tournois publiés par l’administration apparaîtront ici." />
        )}

        {status === 'idle' && sorted.length > 0 && (
          <ul className="space-y-3">
            {sorted.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(t.date)}
                    {t.results != null && (
                      <> · {Array.isArray(t.results) ? t.results.length : 0} résultat{(Array.isArray(t.results) ? t.results.length : 0) !== 1 ? 's' : ''}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="blue">{PLATFORM_LABELS[t.platform as Platform] ?? t.platform}</Badge>
                  <Badge variant="gray">{TIME_CONTROL_LABELS[t.timeControl as TimeControl] ?? t.timeControl}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
