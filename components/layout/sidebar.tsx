'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  PlusCircle,
  BarChart3,
  FlaskConical,
  Clock,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  ownerName?: string;
  businessName?: string;
}

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: Home },
  { name: 'Catat', href: '/catat', icon: PlusCircle },
  { name: 'Produk', href: '/produk', icon: BarChart3 },
  { name: 'Eksperimen', href: '/eksperimen', icon: FlaskConical },
  { name: 'Riwayat', href: '/riwayat', icon: Clock },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ businessName = 'Kios Berkah Sayur' }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col fixed top-0 left-0 h-screen z-30 bg-white border-r border-slate-200 transition-all duration-300 md:w-16 lg:w-60">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-slate-100 justify-center lg:justify-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <h1 className="font-bold text-slate-800 text-base tracking-tight leading-tight">VokaSync</h1>
          <p className="text-xs text-slate-400 truncate max-w-[130px]">{businessName}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 justify-center lg:justify-start ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={item.name}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action / Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={async () => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
              try {
                const { createClient } = await import('@/lib/supabase/client');
                await createClient().auth.signOut();
              } catch (e) {
                console.warn('SignOut info:', e);
              }
              window.location.href = '/login';
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors justify-center lg:justify-start cursor-pointer"
          title="Keluar Akun"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-slate-400" />
          <span className="hidden lg:inline">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
