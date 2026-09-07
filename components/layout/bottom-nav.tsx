'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, BarChart3, FlaskConical, Clock } from 'lucide-react';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: Home },
  { name: 'Produk', href: '/produk', icon: BarChart3 },
  { name: 'Catat', href: '/catat', icon: Plus, isAction: true },
  { name: 'Eksperimen', href: '/eksperimen', icon: FlaskConical },
  { name: 'Riwayat', href: '/riwayat', icon: Clock },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          if (item.isAction) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center -mt-5 relative group"
                title="Catat Transaksi Baru"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 ring-4 ring-white transition-all transform active:scale-90">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Catat</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 text-emerald-700 scale-105' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'font-black text-emerald-800' : 'font-medium'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

