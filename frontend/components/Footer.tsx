import Link from 'next/link';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';

const SOCIAL = [
  {
    label: 'Lichess',
    href: 'https://lichess.org/team/chess-gabon',
    description: 'Équipe & arènes',
  },
  {
    label: 'Chess.com',
    href: 'https://www.chess.com/club/chess-gabon',
    description: 'Club en ligne',
  },
] as const;

const NAV = [
  { href: '/', label: 'Classement' },
  { href: '/tournois', label: 'Tournois' },
  { href: '/a-propos', label: 'À propos' },
] as const;

/** Coordonnées bureau — alignées avec la page 404. */
const ADMIN_PHONES = [
  { name: 'Secrétariat', phone: '+241 06 00 00 01', tel: '+24106000001' },
  { name: 'Technique', phone: '+241 06 00 00 02', tel: '+24106000002' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-border bg-white"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="h-1 bg-gradient-to-r from-brand via-accent to-brand" aria-hidden />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Logo href="/" size="sm" />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Club d'échecs Chess Gabon — tournois multi-cadences,
              classements officiels et gestion des membres.
            </p>
            <p className="flex items-start gap-1.5 text-xs text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Libreville, Gabon
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-700 transition hover:text-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted transition hover:text-brand"
                >
                  Espace administration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Plateformes
            </h3>
            <ul className="space-y-2.5">
              {SOCIAL.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-gray-700 transition hover:text-brand"
                  >
                    <span className="font-medium">{item.label}</span>
                    <ExternalLink
                      className="h-3.5 w-3.5 opacity-40 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </a>
                  <p className="text-xs text-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Contact
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:contact@chessgabon.ga"
                  className="inline-flex items-center gap-2 text-sm text-gray-700 transition hover:text-brand"
                >
                  <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  contact@chessgabon.ga
                </a>
              </li>
              {ADMIN_PHONES.map((c) => (
                <li key={c.tel}>
                  <a
                    href={`tel:${c.tel}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-700 transition hover:text-brand"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <span>
                      <span className="block text-xs text-muted">{c.name}</span>
                      <span className="tabular-nums">{c.phone}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© {year} Chess Gabon Gestion · Projet BTS SIO SLAM</p>
          <p className="text-center sm:text-right">
            Bullet · Blitz · Rapide · Classements officiels
          </p>
        </div>
      </div>
    </footer>
  );
}
