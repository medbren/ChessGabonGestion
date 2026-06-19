export const metadata = {
  title: 'ChessGabonGestion',
  description: 'Application de gestion des classements Chess Gabon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}