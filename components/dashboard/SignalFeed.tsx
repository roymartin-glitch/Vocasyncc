'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import { AIInsight } from '@/types';

interface SignalFeedProps {
  signals: AIInsight[];
}

export function SignalFeed({ signals }: SignalFeedProps) {
  const getSeverityDot = (sev: string) => {
    switch (sev) {
      case 'red':
        return 'bg-rose-500 shadow-rose-200';
      case 'yellow':
        return 'bg-amber-500 shadow-amber-200';
      case 'green':
      default:
        return 'bg-emerald-500 shadow-emerald-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 rounded-md text-slate-600">
            <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">Info Terbaru</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">{signals.length} Sinyal</span>
      </div>

      <div className="space-y-3.5">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors duration-150 border border-transparent hover:border-slate-100"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-xs ${getSeverityDot(
                sig.severity
              )}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {sig.product_name || 'Kondisi Usaha'}
                </span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{sig.created_at}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{sig.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
