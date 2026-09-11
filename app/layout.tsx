import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://keur-yaye-parfumerie.csamba625.chatgpt.site'),
  title: 'KEUR YAYE — Parfumerie sénégalaise',
  description: 'Oud, eaux de parfum et essences de caractère. Livraison à Dakar et partout au Sénégal.',
  openGraph: { title: 'KEUR YAYE — Parfumerie sénégalaise', description: 'Oud, eaux de parfum et essences de caractère.', images: ['/og.png'], locale: 'fr_SN', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'KEUR YAYE — Parfumerie sénégalaise', description: 'Oud, eaux de parfum et essences de caractère.', images: ['/og.png'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
