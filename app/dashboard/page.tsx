'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  Percent,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { AdvisorCard } from '@/components/dashboard/AdvisorCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { StudioModal } from '@/components/studio/StudioModal';
import {
  mockDashboardMetrics,
  mockTrendData,
  mockInsights,
  mockTransactions,
} from '@/lib/mock-data';
import { AIInsight, DashboardMetrics, Transaction, TrendDayData } from '@/types';

export default function DashboardPage() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    today_income: 0,
    today_income_change: 0,
    today_expense: 0,
    today_expense_change: 0,
    today_profit: 0,
    today_profit_change: 0,
    today_margin: 0,
    today_margin_change: 0,
  });
  const [trendData, setTrendData] = useState<TrendDayData[]>([]);
  const [primaryInsight, setPrimaryInsight] = useState<AIInsight | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Parallelize insights and transactions fetching for instant dashboard display
      const [insightsResult, txResult] = await Promise.allSettled([
        fetch('/api/insights').then((r) => r.json()),
        fetch('/api/transactions').then((r) => r.json()),
      ]);

      if (insightsResult.status === 'fulfilled' && insightsResult.value.success) {
        const data = insightsResult.value;
        if (data.metrics) setMetrics(data.metrics);
        if (data.trendData) setTrendData(data.trendData);
        if (data.primaryInsight) setPrimaryInsight(data.primaryInsight);
      }

      if (txResult.status === 'fulfilled' && txResult.value.success) {
        setTransactions(txResult.value.data || []);
      }
    } catch (e) {
      console.warn('Dashboard live fetch fallback to seed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleShareWhatsAppRekap = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const income = (metrics.today_income ?? 0).toLocaleString('id-ID');
    const expense = (metrics.today_expense ?? 0).toLocaleString('id-ID');
    const profit = (metrics.today_profit ?? 0).toLocaleString('id-ID');
    const margin = (metrics.today_margin ?? 0).toLocaleString('id-ID');

    const message = `📊 *Rekap Keuangan Kios*\n📅 ${todayStr}\n\n• *Uang Masuk:* Rp${income}\n• *Uang Keluar:* Rp${expense}\n• *Untung Bersih:* Rp${profit} (${margin}%)\n\n_Dicatat otomatis oleh VokaSync — Asisten Keuangan Pedagang Pasar & UMKM._`;

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual Marketing Poster Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        productName={primaryInsight?.product_name || 'Bawang Merah Brebes'}
      />

      {/* Ringkasan Hari Ini Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ringkasan Hari Ini
          </h2>

          <button
            type="button"
            onClick={handleShareWhatsAppRekap}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer self-start sm:self-auto border-2 border-[#1EBE5B]"
          >
            <span>📲 Kirim Rekap ke WhatsApp</span>
          </button>
        </div>

        {/* 4 Accessible Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: Uang Masuk (Emerald) */}
          <MetricCard
            title="Uang Masuk"
            description="Total penjualan hari ini"
            value={`Rp${(metrics.today_income ?? 0).toLocaleString('id-ID')}`}
            changePercent={metrics.today_income_change ?? 0}
            variant="emerald"
            icon={<Wallet className="w-6 h-6 stroke-[2.5]" />}
          />

          {/* Card 2: Uang Keluar (White) */}
          <MetricCard
            title="Uang Keluar"
            description="Total belanja & biaya"
            value={`Rp${(metrics.today_expense ?? 0).toLocaleString('id-ID')}`}
            changePercent={metrics.today_expense_change ?? 0}
            variant="white"
            isExpense={true}
            icon={<Receipt className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
          />

          {/* Card 3: Untung Bersih (Lime) */}
          <MetricCard
            title="Untung Bersih"
            description="Sisa uang untuk Anda"
            value={`Rp${(metrics.today_profit ?? 0).toLocaleString('id-ID')}`}
            changePercent={metrics.today_profit_change ?? 0}
            variant="lime"
            icon={<PiggyBank className="w-6 h-6 stroke-[2.5]" />}
          />

          {/* Card 4: Persen Untung (White) */}
          <MetricCard
            title="Persen Untung"
            description="Untung dari setiap penjualan"
            value={`${(metrics.today_margin ?? 0).toLocaleString('id-ID')}%`}
            changePercent={metrics.today_margin_change ?? 0}
            variant="white"
            icon={<Percent className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
          />
        </div>
      </section>

      {/* Bottom Section: Charts, Transactions & Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Trend Chart & Recent Transactions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Grafik 7 Hari Terakhir
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Bandingkan uang masuk dan uang keluar
              </p>
            </div>

            <TrendChart data={trendData} />
          </div>

          <RecentTransactions transactions={transactions} />
        </div>

        {/* Right Column: Saran untuk Anda */}
        <div className="lg:col-span-5">
          <AdvisorCard
            insight={primaryInsight}
            onOpenStudio={() => setIsStudioOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
