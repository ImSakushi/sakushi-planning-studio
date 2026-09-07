import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Sakushi · Planning Studio',
  description:
    'Crée ton planning de streams, personnalise ton dialogue Undertale et exporte ton image.',
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
