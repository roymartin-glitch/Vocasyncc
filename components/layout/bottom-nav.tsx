'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Mic, Package, FileText, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A2619] border-t border-[#123825] shadow-[0_-6px_25px_rgba(0,0,0,0.45)] px-3 py-2 pb-safe select-none">
      <div className="flex items-end justify-between max-w-md mx-auto relative">
        {/* 1. Beranda */}
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isTabActive('/dashboard') ? 'scale-105 bg-[#123825]' : ''}`}>
            <LayoutGrid className={`w-5 h-5 stroke-[2.3] ${isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Beranda
          </span>
        </Link>

        {/* 2. Barang */}
        <Link
          href="/produk"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isTabActive('/produk') ? 'scale-105 bg-[#123825]' : ''}`}>
            <Package className={`w-5 h-5 stroke-[2.3] ${isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Barang
          </span>
        </Link>

        {/* 3. CENTER PROMINENT FLOATING VOICE ACTION BUTTON */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6 z-10">
          <Link
            href="/catat"
            className="group relative flex flex-col items-center cursor-pointer"
            title="Catat Transaksi Suara"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00875A] to-[#22C55E] flex items-center justify-center text-white shadow-lg shadow-emerald-950/70 ring-4 ring-[#0A2619] group-active:scale-95 group-hover:scale-105 transition-all duration-200">
              <Mic className="w-7 h-7 stroke-[2.5]" />
            </div>
            <span className="text-[10px] mt-1 font-black text-[#22C55E] tracking-tight">
              Catat
            </span>
          </Link>
        </div>

        {/* 4. Laporan */}
        <Link
          href="/laporan"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            isTabActive('/laporan') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isTabActive('/laporan') ? 'scale-105 bg-[#123825]' : ''}`}>
            <FileText className={`w-5 h-5 stroke-[2.3] ${isTabActive('/laporan') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isTabActive('/laporan') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Laporan
          </span>
        </Link>

        {/* 5. Pengaturan */}
        <Link
          href="/settings"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isTabActive('/settings') ? 'scale-105 bg-[#123825]' : ''}`}>
            <Settings className={`w-5 h-5 stroke-[2.3] ${isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Pengaturan
          </span>
        </Link>
      </div>
    </nav>
  );
}

