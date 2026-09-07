'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  changePercent: number;
  subtitle?: string;
  icon?: React.ReactNode;
  isExpense?: boolean;
}

export function MetricCard({
  title,
  value,
  changePercent,
  subtitle = 'vs kemarin',
  icon,
  isExpense = false,
}: MetricCardProps) {
  // For income/profit/margin, positive is good. For expense, negative is good.
  const isPositive = changePercent >= 0;
  const isFavorable = isExpense ? !isPositive : isPositive;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <div className="p-2 bg-slate-50 rounded-xl text-slate-600">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isFavorable
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
              : 'bg-rose-50 text-rose-700 border border-rose-200/50'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <TrendingDown className="w-3 h-3 stroke-[2.5]" />
          )}
          <span>{isPositive ? `+${changePercent}%` : `${changePercent}%`}</span>
        </span>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>
    </div>
  );
}
