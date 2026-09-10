'use client';

import React from 'react';
import { Lightbulb, AlertTriangle, MessageCircle, Sparkles } from 'lucide-react';
import { AIInsight } from '@/types';

interface AdvisorCardProps {
  insight?: AIInsight | null;
  onOpenStudio?: () => void;
}

export function AdvisorCard({ insight, onOpenStudio }: AdvisorCardProps) {
  const isAlert = insight?.severity === 'red' || insight?.severity === 'yellow';
  const prodName = insight?.product_name || 'Produk';

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
      {/* Header with big lightbulb */}
      <div className="flex items-center gap-3.5">
        <div
          className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
            isAlert ? 'bg-amber-500' : 'bg-[#00875A]'
          }`}
        >
          <Lightbulb className="w-7 h-7 stroke-[2.3]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            Saran untuk Anda
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Dari asisten VokaSync
          </p>
        </div>
      </div>

      {/* Dynamic Advice / Alert Body */}
      {isAlert ? (
        <div className="bg-[#FEF3E2] border border-[#FDE68A] rounded-2xl p-4.5 space-y-2 text-slate-800">
          <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 stroke-[2.5] flex-shrink-0" />
            <span>Peringatan Keuntungan {prodName}</span>
          </div>
          <p className="text-xs leading-relaxed font-semibold text-amber-900/90">
            {insight?.message ||
              `Margin keuntungan ${prodName} sedang di bawah batas aman. Pertimbangkan menyesuaikan harga jual atau kulakan.`}
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4.5 space-y-2 text-slate-800">
          <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-700 stroke-[2.5] flex-shrink-0" />
            <span>Kondisi Usaha Normal & Terpantau</span>
          </div>
          <p className="text-xs leading-relaxed font-semibold text-emerald-900/90">
            {insight?.message ||
              'Selamat datang di VokaSync! Catat penjualan atau belanja kulakan pertama Anda hari ini untuk melihat analisa keuntungan otomatis.'}
          </p>
        </div>
      )}

      {/* Action Button: Buat Promo WhatsApp */}
      <div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="w-full flex items-center justify-center gap-2.5 bg-[#00875A] hover:bg-[#059669] text-white text-base font-extrabold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Buat Promo WhatsApp</span>
        </button>
        <p className="text-[11px] text-center text-slate-500 font-semibold mt-2">
          Asisten akan membuatkan gambar dan teks promo yang siap Anda kirim ke pembeli.
        </p>
      </div>
    </div>
  );
}
