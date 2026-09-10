'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, PlusCircle, Package, FileText, History, Settings } from 'lucide-react';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutGrid },
  { name: 'Catat', href: '/catat', icon: PlusCircle },
  { name: 'Barang', href: '/produk', icon: Package },
  { name: 'Laporan', href: '/laporan', icon: FileText },
  { name: 'Riwayat', href: '/riwayat', icon: History },
  { name: 'Setelan', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A2619] border-t border-[#123825] shadow-[0_-4px_25px_rgba(0,0,0,0.35)] px-1 py-1.5 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
                isActive
                  ? 'text-[#22C55E]'
                  : 'text-emerald-100/70 hover:text-white'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive ? 'scale-105 bg-[#123825]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-[#22C55E]' : ''}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isActive ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
