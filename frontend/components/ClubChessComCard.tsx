'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, Users } from 'lucide-react';
import { BASE_URL } from '@/lib/api';

interface ClubProfile {
  name: string;
  clubId: number;
  url: string;
  icon?: string;
  location?: string;
  membersCount: number;
  averageDailyRating?: number;
  descriptionText?: string;
  joinUrl?: string;
  admins: string[];
}

export function ClubChessComCard() {
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/chesscom/club`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ClubProfile;
        if (!cancelled) setClub(data);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !club) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        {club.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.icon}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-border"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              {club.name} sur Chess.com
            </h2>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              Live API
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {club.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {club.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {club.membersCount.toLocaleString('fr-FR')} membres
            </span>
            {club.averageDailyRating != null ? (
              <span>Rating moyen (daily) : {club.averageDailyRating}</span>
            ) : null}
          </div>
          {club.descriptionText ? (
            <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {club.descriptionText.slice(0, 600)}
              {club.descriptionText.length > 600 ? '…' : ''}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={club.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark"
            >
              Voir le club
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            {club.joinUrl ? (
              <a
                href={club.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand"
              >
                Rejoindre
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
