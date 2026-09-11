'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Receipt,
  PiggyBank,
  Percent,
  Share2,
  FileText,
  TrendingUp,
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
      // Parallelize insights and transactions fetching with limit for instant display
      const [insightsResult, txResult] = await Promise.allSettled([
        fetch('/api/insights').then((r) => r.json()),
        fetch('/api/transactions?limit=6').then((r) => r.json()),
      ]);

      let newMetrics: DashboardMetrics | null = null;
      let newTrend: TrendDayData[] | null = null;
      let newInsight: AIInsight | null = null;
      let newTx: Transaction[] = [];

      if (insightsResult.status === 'fulfilled' && insightsResult.value.success) {
        const data = insightsResult.value;
        if (data.metrics) {
          setMetrics(data.metrics);
          newMetrics = data.metrics;
        }
        if (data.trendData) {
          setTrendData(data.trendData);
          newTrend = data.trendData;
        }
        if (data.primaryInsight) {
          setPrimaryInsight(data.primaryInsight);
          newInsight = data.primaryInsight;
        }
      }

      if (txResult.status === 'fulfilled' && txResult.value.success) {
        const items = txResult.value.data || [];
        setTransactions(items);
        newTx = items;
      }

      // Persist to session cache for 0ms instant display next time
      try {
        const userKey = typeof window !== 'undefined' ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')) : 'guest';
        sessionStorage.setItem(
          `vokasync_dash_cache_${userKey}`,
          JSON.stringify({
            metrics: newMetrics,
            trendData: newTrend,
            primaryInsight: newInsight,
            transactions: newTx,
          })
        );
      } catch (_) {}
    } catch (e) {
      console.warn('Dashboard live fetch fallback to seed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Instant 0ms cache hydrate
    try {
      sessionStorage.removeItem('vokasync_dash_cache'); // purge legacy unscoped
      const userKey = typeof window !== 'undefined' ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')) : 'guest';
      const cached = sessionStorage.getItem(`vokasync_dash_cache_${userKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.metrics) setMetrics(parsed.metrics);
        if (parsed.trendData?.length) setTrendData(parsed.trendData);
        if (parsed.primaryInsight) setPrimaryInsight(parsed.primaryInsight);
        if (parsed.transactions) setTransactions(parsed.transactions);
      }
    } catch (_) {}

    // 2. Fetch fresh data in background
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
        productName={primaryInsight?.product_name || 'Produk Pilihan'}
      />

      {/* Ringkasan Hari Ini Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ringkasan Hari Ini
          </h2>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Link
              href="/eksperimen"
              className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-2 border-emerald-300 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Coba & Pantau Prediksi Keuntungan"
            >
              <TrendingUp className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>Coba & Pantau</span>
            </Link>

            <Link
              href="/laporan"
              className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50/70 text-emerald-900 border-2 border-emerald-300 hover:border-emerald-500 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#00875A] stroke-[2.5]" />
              <span>Lihat Laporan</span>
            </Link>

            <button
              type="button"
              onClick={handleShareWhatsAppRekap}
              className="inline-flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer border-2 border-emerald-600/80"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Kirim Rekap WhatsApp</span>
            </button>
          </div>
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
