import Link from 'next/link';
import { Crown, Mail, Phone } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';

const ADMIN_CONTACTS = [
  {
    name: 'Secrétariat club',
    phone: '+241 06 00 00 01',
    tel: '+24106000001',
  },
  {
    name: 'Administration technique',
    phone: '+241 06 00 00 02',
    tel: '+24106000002',
  },
] as const;

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div
          className="mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-light text-brand"
          aria-hidden
        >
          <Crown className="h-8 w-8" />
        </div>
        <p className="text-6xl font-bold tracking-tight text-brand">404</p>
        <h1 className="mt-3 text-xl font-semibold text-gray-900">
          Page introuvable
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Cette page n’existe pas, a été déplacée, ou le lien est incorrect.
          Utilisez la navigation ci-dessous ou contactez le bureau du club.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
          >
            Classement
          </Link>
          <Link
            href="/tournois"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand"
          >
            Tournois
          </Link>
          <Link
            href="/a-propos"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand"
          >
            À propos
          </Link>
        </div>

        <div className="mt-10 w-full max-w-sm rounded-xl border border-border bg-white p-5 text-left shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            Contacter un administrateur
          </p>
          <p className="mt-1 text-xs text-muted">
            En cas de lien cassé ou de problème d’accès au site.
          </p>
          <ul className="mt-4 space-y-3">
            {ADMIN_CONTACTS.map((c) => (
              <li key={c.tel}>
                <a
                  href={`tel:${c.tel}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-brand hover:bg-brand-light/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                    <Phone className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{c.name}</span>
                    <span className="block text-sm font-medium tabular-nums text-gray-900">
                      {c.phone}
                    </span>
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                href="mailto:contact@chessgabon.ga"
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-brand hover:bg-brand-light/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted">E-mail</span>
                  <span className="block text-sm font-medium text-gray-900">
                    contact@chessgabon.ga
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
