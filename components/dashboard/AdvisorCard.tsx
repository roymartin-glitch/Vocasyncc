'use client';

import React from 'react';
import { Sparkles, AlertCircle, ArrowRight, Share2, CheckCircle2 } from 'lucide-react';
import { AIInsight } from '@/types';

interface AdvisorCardProps {
  insight: AIInsight;
  onOpenStudio?: () => void;
}

export function AdvisorCard({ insight, onOpenStudio }: AdvisorCardProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'red':
        return {
          label: '⚠️ Hati-hati, Untung Menipis!',
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: AlertCircle,
          dotColor: 'bg-rose-500',
        };
      case 'yellow':
        return {
          label: 'Perhatian Pasokan',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: AlertCircle,
          dotColor: 'bg-amber-500',
        };
      case 'green':
      default:
        return {
          label: 'Performa Optimal',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: CheckCircle2,
          dotColor: 'bg-emerald-500',
        };
    }
  };

  const badge = getSeverityBadge(insight.severity);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-gradient-to-br from-white via-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-200/60 shadow-xs relative overflow-hidden">
      {/* Decorative accent element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-700 rounded-lg text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-800 tracking-tight">Asisten Bisnis VokaSync</span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} animate-pulse`} />
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Message / Root-Cause Explanation */}
      <div className="relative z-10 space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed font-normal">
          {insight.message}
        </p>

        {insight.product_name && (
          <div className="inline-block bg-slate-100/80 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
            Fokus: <span className="font-semibold text-slate-800">{insight.product_name}</span>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      {insight.has_quick_action && (
        <div className="mt-5 pt-4 border-t border-slate-100 relative z-10">
          <button
            type="button"
            onClick={onOpenStudio}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-98 group cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Buat Promosi WhatsApp (AI Studio)</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Otomatis hapus background foto, pasang frame pasar, dan buatkan teks promo via WA
          </p>
        </div>
      )}
    </div>
  );
}
