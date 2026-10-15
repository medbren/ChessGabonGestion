import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Administration' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Administration — ChessGabonGestion',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}