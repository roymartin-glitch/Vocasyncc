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
import { SignalFeed } from '@/components/dashboard/SignalFeed';
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
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboardMetrics);
  const [trendData, setTrendData] = useState<TrendDayData[]>(mockTrendData);
  const [primaryInsight, setPrimaryInsight] = useState<AIInsight>(mockInsights[0]);
  const [signals, setSignals] = useState<AIInsight[]>(mockInsights);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch live insights & metrics
      const res = await fetch('/api/insights');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        if (data.trendData?.length > 0) setTrendData(data.trendData);
        if (data.primaryInsight) setPrimaryInsight(data.primaryInsight);
        if (data.signals?.length > 0) setSignals(data.signals);
      }

      // 2. Fetch live transactions
      const txRes = await fetch('/api/transactions');
      const txData = await txRes.json();
      if (txData.success && txData.data?.length > 0) {
        setTransactions(txData.data);
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

  return (
    <div className="space-y-6">
      {/* AI Virtual Studio Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        productName={primaryInsight.product_name || 'Bawang Merah Brebes'}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4 Metric Cards - lg:col-span-4 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-base text-slate-800 tracking-tight">Kondisi Bisnis Hari Ini</h2>
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-semibold px-2 py-0.5 rounded-full">
              Live Database
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5">
            <MetricCard
              title="Uang Masuk Hari Ini"
              value={`Rp${(metrics.today_income || 0).toLocaleString('id-ID')}`}
              changePercent={metrics.today_income_change}
              icon={<Wallet className="w-4 h-4 text-emerald-600" />}
            />

            <MetricCard
              title="Uang Keluar Hari Ini"
              value={`Rp${(metrics.today_expense || 0).toLocaleString('id-ID')}`}
              changePercent={metrics.today_expense_change}
              isExpense={true}
              icon={<Receipt className="w-4 h-4 text-slate-500" />}
            />

            <MetricCard
              title="Untung Bersih"
              value={`Rp${(metrics.today_profit || 0).toLocaleString('id-ID')}`}
              changePercent={metrics.today_profit_change}
              icon={<PiggyBank className="w-4 h-4 text-emerald-600" />}
            />

            <MetricCard
              title="Untung Hari Ini (%)"
              value={`${metrics.today_margin || 0}%`}
              changePercent={metrics.today_margin_change}
              icon={<Percent className="w-4 h-4 text-indigo-600" />}
            />
          </div>
        </div>

        {/* Center Column: Trend Chart & Recent Transactions - lg:col-span-5 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Tren 7 Hari Terakhir</h3>
                <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran Harian</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Data Nyata Supabase
              </span>
            </div>

            <TrendChart data={trendData} />
          </div>

          {/* Today's Transactions */}
          <RecentTransactions transactions={transactions} />
        </div>

        {/* Right Column: AI Advisor & Live Signals - lg:col-span-3 */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Advisor Card with Quick-Action trigger */}
          <AdvisorCard
            insight={primaryInsight}
            onOpenStudio={() => setIsStudioOpen(true)}
          />

          {/* Business Signal Feed */}
          <SignalFeed signals={signals} />
        </div>
      </div>
    </div>
  );
}
