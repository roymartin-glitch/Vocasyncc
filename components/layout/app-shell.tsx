'use client';

import React, { useEffect, useState } from 'react';
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

  const [businessName, setBusinessName] = useState(mockProfile.business_name);
  const [ownerName, setOwnerName] = useState(mockProfile.owner_name);

  // Apply text size to root documentElement and sync profile
  useEffect(() => {
    const applyTextSize = (size: string) => {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.remove('text-size-normal', 'text-size-besar', 'text-size-sangat-besar');
      document.documentElement.classList.add(`text-size-${size || 'normal'}`);
    };

    // 1. Initial text size from localStorage
    const cachedSize = localStorage.getItem('vokasync_text_size') || 'normal';
    applyTextSize(cachedSize);

    // 2. Fetch profile & settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.business_name) setBusinessName(data.data.business_name);
          if (data.data.owner_name) setOwnerName(data.data.owner_name);
          if (data.data.text_size) {
            applyTextSize(data.data.text_size);
            localStorage.setItem('vokasync_text_size', data.data.text_size);
          }
        }
      })
      .catch(() => {});

    // 3. Listen to settings changed event for real-time reactivity without refresh
    const handleSettingsChange = (e: any) => {
      const detail = e.detail;
      if (detail?.text_size) {
        applyTextSize(detail.text_size);
        localStorage.setItem('vokasync_text_size', detail.text_size);
      }
      if (detail?.business_name) setBusinessName(detail.business_name);
      if (detail?.owner_name) setOwnerName(detail.owner_name);
    };

    window.addEventListener('vokasync-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('vokasync-settings-changed', handleSettingsChange);
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar
        businessName={businessName}
        ownerName={ownerName}
      />

      {/* Main Content Area (offset by sidebar width on desktop/tablet) */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 transition-all duration-300">
        <Header
          ownerName={ownerName}
          businessName={businessName}
        />

        <main className="flex-1 px-4 md:px-8 pb-28 md:pb-12 max-w-7xl w-full">
          {children}
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}

