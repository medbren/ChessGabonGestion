import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { ToastContainer } from '@/components/ui/Toast';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chessgabon-gestion.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ChessGabon Gestion',
    template: '%s — ChessGabon Gestion',
  },
  description:
    'Classements officiels et gestion des tournois multi-cadences du club d’échecs Chess Gabon (Libreville).',
  applicationName: 'ChessGabon Gestion',
  authors: [{ name: 'Chess Gabon' }],
  keywords: [
    'échecs',
    'Gabon',
    'Chess Gabon',
    'classement',
    'tournoi',
    'blitz',
    'bullet',
    'rapide',
    'Libreville',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'fr_GA',
    url: siteUrl,
    siteName: 'ChessGabon Gestion',
    title: 'ChessGabon Gestion',
    description:
      'Classements officiels et tournois multi-cadences du club d’échecs Chess Gabon.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChessGabon Gestion — classements et tournois',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChessGabon Gestion',
    description:
      'Classements officiels et tournois multi-cadences du club d’échecs Chess Gabon.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: 'ChessGabon',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#009E60' },
    { media: '(prefers-color-scheme: dark)', color: '#007A4A' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const themeInitScript = `(function(){try{var k='chessgabon-theme';var m=localStorage.getItem(k)||'system';var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.dataset.theme=m;}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <PageTransition>{children}</PageTransition>
        <ToastContainer />
      </body>
    </html>
  );
}
