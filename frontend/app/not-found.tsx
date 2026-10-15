import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-6xl font-bold text-brand">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted">Cette page n’existe pas ou a été déplacée.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark">Classement</Link>
          <Link href="/tournois" className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand">Tournois</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
