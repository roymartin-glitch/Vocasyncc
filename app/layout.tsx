import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'VokaSync — Asisten Bisnis Pedagang Pasar & UMKM',
  description:
    'Aplikasi pintar asisten bisnis dan visual marketing otomatis untuk pedagang pasar tradisional dan pelaku UMKM Indonesia (SDGs 9).',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F4F6F4] min-h-screen text-slate-900 font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
