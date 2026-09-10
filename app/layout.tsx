import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'VokaSync — Asisten Bisnis VokaSync & Visual Marketing Pedagang Pasar & UMKM',
  description:
    'Aplikasi pintar Asisten Bisnis VokaSync dan visual marketing otomatis untuk pedagang pasar tradisional dan pelaku UMKM Indonesia (SDGs 9).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F5F5F5] min-h-screen text-slate-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
