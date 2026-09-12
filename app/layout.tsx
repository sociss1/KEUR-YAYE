import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://keur-yaye-boutique.oscisse369.workers.dev'),
  title: 'KEUR YAYE — Parfumerie sénégalaise',
  description: 'Oud, eaux de parfum et essences de caractère. Livraison à Dakar et partout au Sénégal.',
  openGraph: { title: 'KEUR YAYE — Parfumerie sénégalaise', description: 'Oud, eaux de parfum et essences de caractère.', images: ['/og.png'], locale: 'fr_SN', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'KEUR YAYE — Parfumerie sénégalaise', description: 'Oud, eaux de parfum et essences de caractère.', images: ['/og.png'] },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/logo-ky.png', apple: '/logo-ky.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'KEUR YAYE' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover', themeColor: '#0b2118' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><head><meta name="theme-color" content="#0b2118"/><meta name="mobile-web-app-capable" content="yes"/></head><body>{children}</body></html>; }
