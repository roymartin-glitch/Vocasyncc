'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Plus } from 'lucide-react';

interface HeaderProps {
  ownerName?: string;
  businessName?: string;
}

export function Header({ ownerName = 'Pedagang', businessName = 'Toko Saya' }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-transparent px-4 md:px-8 pt-6 pb-2">
      {/* Desktop Header Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Halo, {ownerName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-sm font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>{businessName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            <span>{currentDate}</span>
          </div>

          <Link
            href="/catat"
            className="flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Mobile Header Layout */}
      <div className="flex md:hidden flex-col gap-3.5">
        <div>
          <div className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight flex-wrap">
            <span>Selamat datang,</span>
            <span className="bg-[#A3E635] text-slate-950 px-3 py-0.5 rounded-xl font-black">
              {ownerName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{businessName}</span>
            <span className="text-slate-300">•</span>
            <span>Buku Keuangan Sederhana</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            <span>{currentDate}</span>
          </div>

          <Link
            href="/catat"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#00875A] text-white font-bold text-xs py-2.5 px-3 rounded-2xl shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
