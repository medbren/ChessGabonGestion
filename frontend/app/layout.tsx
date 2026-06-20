import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Home — ChessGabonGestion',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html>
    <body>
      <>{children}</>;
    </body>
  </html>
}