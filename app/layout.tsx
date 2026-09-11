import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'KEUR YAYE — Parfumerie sénégalaise', description: 'Oud, eaux de parfum et essences de caractère. Livraison à Dakar et partout au Sénégal.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
