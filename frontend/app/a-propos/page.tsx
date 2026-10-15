import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Présentation du club d’échecs Chess Gabon et de l’application de gestion des classements.',
};

export default function AboutPage() {
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
      <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">À propos</h1>
        <p className="mt-2 text-sm text-muted">Club d’échecs Chess Gabon · Libreville</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Le club</h2>
            <p className="mt-2">Chess Gabon rassemble les passionnés d’échecs au Gabon. Le club organise des tournois multi-cadences (bullet, blitz, rapide) sur Lichess et Chess.com, et suit les performances de ses membres via des classements officiels.</p>
          </section>
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Cette application</h2>
            <p className="mt-2"><strong>ChessGabon Gestion</strong> permet de centraliser les membres, d’importer les résultats de tournois (CSV) et d’afficher les classements publics. Projet réalisé dans le cadre du BTS SIO option SLAM.</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-muted">
              <li>Classements général, par cadence, mensuel et annuel</li>
              <li>Gestion des membres et des comptes Lichess / Chess.com</li>
              <li>Import de classements CSV et suivi des tournois</li>
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Contact</h2>
            <p className="mt-2">Écrivez-nous à <a href="mailto:contact@chessgabon.ga" className="font-medium text-brand hover:underline">contact@chessgabon.ga</a>.</p>
            <p className="mt-2 text-muted">Retrouvez-nous aussi sur <a href="https://lichess.org/team/chess-gabon" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Lichess</a> et <a href="https://www.chess.com/club/chess-gabon" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Chess.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
