'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendDayData } from '@/types';

interface TrendChartProps {
  data: TrendDayData[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      const jt = (val / 1000000).toFixed(1).replace('.0', '').replace('.', ',');
      return `${jt}jt`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}rb`;
    }
    return val.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-lg text-xs space-y-1.5 font-bold">
          <p className="text-slate-900 font-black">{label}</p>
          <div className="flex items-center justify-between gap-4 text-[#00875A]">
            <span>Uang Masuk:</span>
            <span>Rp{(payload[0]?.value || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-600">
            <span>Uang Keluar:</span>
            <span>Rp{(payload[1]?.value || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isMounted) {
    return (
      <div className="h-64 bg-slate-50/50 rounded-2xl flex items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
        Memuat data grafik...
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Custom Header & Legend matching screenshot 2 */}
      <div className="flex items-center gap-5 mb-4 text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#00875A]" />
          <span>Uang Masuk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#99D5B3]" />
          <span>Uang Keluar</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#334155', fontSize: 13, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="income"
              name="Uang Masuk"
              fill="#00875A"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expense"
              name="Uang Keluar"
              fill="#99D5B3"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
