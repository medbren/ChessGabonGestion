import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Crown,
  ExternalLink,
  Mail,
  MapPin,
  Trophy,
  Upload,
  Users,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Présentation du club d’échecs Chess Gabon et de l’application de gestion des classements.',
};

const FEATURES = [
  {
    icon: Trophy,
    title: 'Classements multi-cadences',
    text: 'Général, Bullet, Blitz, Rapide, mensuel et annuel selon le règlement du club.',
  },
  {
    icon: Users,
    title: 'Gestion des membres',
    text: 'Fiches joueurs, pseudos Lichess / Chess.com et historique des résultats.',
  },
  {
    icon: Upload,
    title: 'Import CSV',
    text: 'Import des classements depuis Lichess, Chess.com ou un format générique.',
  },
] as const;

const CHAMPIONSHIP_POINTS: { rank: string; points: number }[] = [
  { rank: '1er', points: 20 },
  { rank: '2e', points: 16 },
  { rank: '3e', points: 13 },
  { rank: '4e', points: 11 },
  { rank: '5e', points: 9 },
  { rank: '6e', points: 7 },
  { rank: '7e', points: 5 },
  { rank: '8e', points: 4 },
  { rank: '9e', points: 3 },
  { rank: '10e', points: 2 },
  { rank: '11e et +', points: 1 },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="relative flex flex-col items-center gap-4 bg-gradient-to-br from-brand via-brand to-brand-dark px-6 py-10 text-center text-white sm:flex-row sm:text-left">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner ring-1 ring-white/20"
              aria-hidden
            >
              <Crown className="h-10 w-10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Chess Gabon
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/85 sm:justify-start">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  Libreville, Gabon
                </span>
                <span className="hidden opacity-50 sm:inline">·</span>
                <span>Club d’échecs</span>
              </p>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">Le club</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Chess Gabon rassemble les passionnés d’échecs au Gabon. Le club
              organise des tournois multi-cadences (bullet, blitz, rapide) sur
              Lichess et Chess.com, et suit les performances de ses membres via
              des classements officiels.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://lichess.org/team/chess-gabon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand"
              >
                Lichess
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
              <a
                href="https://www.chess.com/club/chess-gabon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-brand hover:text-brand"
              >
                Chess.com
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <section className="animate-fade-in-up mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            Points de championnat
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            À chaque tournoi, le rang final attribue des points au classement
            général du club.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="px-4 py-2.5 font-medium">Rang</th>
                  <th className="px-4 py-2.5 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CHAMPIONSHIP_POINTS.map((row) => (
                  <tr key={row.rank} className="bg-white">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {row.rank}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Les classements Bullet, Blitz et Rapide ne comptent que les tournois
            de la cadence concernée. Les vues mensuelle et annuelle filtrent par
            période.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Cette application
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-700">
            <strong>ChessGabon Gestion</strong> centralise les membres, l’import
            des résultats et l’affichage des classements publics. Projet réalisé
            dans le cadre du <strong>BTS SIO option SLAM</strong>.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Contact</h2>
          <p className="mt-2 text-sm text-gray-700">
            Une question sur le club ou l’application ?
          </p>
          <a
            href="mailto:contact@chessgabon.ga"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
          >
            <Mail className="h-4 w-4" aria-hidden />
            contact@chessgabon.ga
          </a>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
          >
            Voir le classement
          </Link>
          <Link
            href="/tournois"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand"
          >
            Liste des tournois
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
