'use client';

import Link from 'next/link';
import { Calendar, Plus, Clock, Settings, TrendingUp } from 'lucide-react';

interface HeaderProps {
  ownerName?: string;
  businessName?: string;
}

export function Header({ ownerName = 'Pak Budi', businessName = 'Kios Berkah Sayur' }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Selamat datang,</span>
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
              {ownerName}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{businessName}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Pantauan Finansial & Advisor Real-time</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{currentDate}</span>
          </div>

          <Link
            href="/catat"
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <TrendingUp className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-800 leading-tight">VokaSync</h1>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{ownerName} • {businessName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/riwayat"
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Catatan Transaksi"
          >
            <Clock className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
