'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { mockProfile } from '@/lib/mock-data';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar
        businessName={mockProfile.business_name}
        ownerName={mockProfile.owner_name}
      />

      {/* Main Content Area (offset by sidebar width on desktop/tablet) */}
      <div className="flex-1 flex flex-col md:pl-16 lg:pl-60 transition-all duration-300">
        <Header
          ownerName={mockProfile.owner_name}
          businessName={mockProfile.business_name}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-28 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}
