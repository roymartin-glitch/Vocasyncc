'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Calendar,
  Wallet,
  Receipt,
  PiggyBank,
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  RefreshCw,
  History,
  Share2,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardMetrics, Transaction, TrendDayData } from '@/types';

type ReportPeriod = 'today' | 'week' | 'month' | 'all';

export default function LaporanPage() {
  const [period, setPeriod] = useState<ReportPeriod>('today');
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trendData, setTrendData] = useState<TrendDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchRealTimeData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [insightsRes, txRes] = await Promise.allSettled([
        fetch('/api/insights').then((r) => r.json()),
        fetch('/api/transactions').then((r) => r.json()),
      ]);

      let nextMetrics: DashboardMetrics | null = null;
      let nextTrend: TrendDayData[] | null = null;
      let nextTx: Transaction[] | null = null;

      if (insightsRes.status === 'fulfilled' && insightsRes.value.success) {
        const d = insightsRes.value;
        if (d.metrics) {
          setMetrics(d.metrics);
          nextMetrics = d.metrics;
        }
        if (d.trendData) {
          setTrendData(d.trendData);
          nextTrend = d.trendData;
        }
      }

      if (txRes.status === 'fulfilled' && txRes.value.success) {
        let txList = [...(txRes.value.data || [])];
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const localTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
            const existingIds = new Set(txList.map((t: any) => t.id));
            for (const l of localTxs) {
              if (l && l.id && !existingIds.has(l.id)) {
                if (l.user_id && l.user_id === userKey) {
                  txList.unshift(l);
                  existingIds.add(l.id);
                }
              }
            }
          } catch (_) {}
        }
        setTransactions(txList);
        nextTx = txList;
      }

      // Persist to session cache for instant future transitions
      if (typeof window !== 'undefined' && nextMetrics && nextTx) {
        try {
          const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
          sessionStorage.setItem(`vokasync_laporan_cache_${userKey}`, JSON.stringify({
            metrics: nextMetrics,
            trendData: nextTrend || [],
            transactions: nextTx,
          }));
        } catch (_) {}
      }

      setLastRefreshed(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Report fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 0ms instant hydrate from session cache if available
    let hasCache = false;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('vokasync_laporan_cache'); // purge legacy unscoped
        const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
        const cached = sessionStorage.getItem(`vokasync_laporan_cache_${userKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.metrics) setMetrics(parsed.metrics);
          if (parsed.trendData) setTrendData(parsed.trendData);
          if (parsed.transactions) setTransactions(parsed.transactions);
          setIsLoading(false);
          hasCache = true;
        }
      } catch (_) {}
    }
    // Revalidate in background
    fetchRealTimeData(hasCache);

    // Listen to real-time events from Catat / Transaksi / Settings
    const handleSync = () => {
      if (typeof window !== 'undefined') {
        const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
        sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
        sessionStorage.removeItem('vokasync_laporan_cache');
      }
      fetchRealTimeData(false);
    };

    window.addEventListener('vokasync-settings-changed', handleSync);
    window.addEventListener('vokasync-transaction-saved', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('vokasync-settings-changed', handleSync);
      window.removeEventListener('vokasync-transaction-saved', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return transactions.filter((tx) => {
      const txDate = tx.transaction_date.split('T')[0];
      if (period === 'today') {
        return txDate === todayStr;
      }
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= weekAgo.toISOString().split('T')[0];
      }
      if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return txDate >= monthStart.toISOString().split('T')[0];
      }
      return true; // 'all'
    });
  }, [transactions, period]);

  // Group by products to show top selling items & calculate true unit profit
  const productBreakdown = useMemo(() => {
    // 1. Collect unit costs for each product from all expense transactions
    const costMap = new Map<string, { totalExpense: number; expenseQty: number; latestUnitCost: number }>();
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        tx.items?.forEach((item) => {
          const key = (item.product_name || 'Lainnya').toLowerCase();
          const q = Number(item.quantity) || 1;
          const p = Number(item.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
          const current = costMap.get(key) || { totalExpense: 0, expenseQty: 0, latestUnitCost: p };
          current.totalExpense += p * q;
          current.expenseQty += q;
          current.latestUnitCost = p;
          costMap.set(key, current);
        });
      }
    });

    // 2. Compute sold items in filtered period and gross profit
    const salesMap = new Map<
      string,
      {
        name: string;
        qty: number;
        unit: string;
        totalIncome: number;
        estimatedProfit: number;
        marginPercent: number;
      }
    >();

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        tx.items?.forEach((item) => {
          const originalName = item.product_name || 'Lainnya';
          const key = originalName.toLowerCase();
          const qty = Number(item.quantity) || 1;
          const sellingPrice = Number(item.unit_price) || (tx.total_amount ? tx.total_amount / qty : 0);
          const income = qty * sellingPrice || tx.total_amount || 0;

          // Determine unit cost
          const costInfo = costMap.get(key);
          let unitCost = costInfo?.latestUnitCost || (costInfo && costInfo.expenseQty > 0 ? costInfo.totalExpense / costInfo.expenseQty : 0);
          // If no purchase recorded, fallback to standard 20% margin (unit cost = 80% of selling)
          if (!unitCost || unitCost >= sellingPrice) {
            unitCost = Math.round(sellingPrice * 0.8);
          }

          const profit = Math.max(0, income - (qty * unitCost));

          const existing = salesMap.get(key) || {
            name: originalName,
            qty: 0,
            unit: item.unit || 'kg',
            totalIncome: 0,
            estimatedProfit: 0,
            marginPercent: 0,
          };

          existing.qty += qty;
          existing.totalIncome += income;
          existing.estimatedProfit += profit;
          existing.marginPercent = existing.totalIncome > 0
            ? Math.round((existing.estimatedProfit / existing.totalIncome) * 100)
            : 20;

          salesMap.set(key, existing);
        });
      }
    });

    return Array.from(salesMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);
  }, [transactions, filteredTransactions]);

  // Compute total aggregates synchronized with product sales and inventory
  const reportTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      const amt = t.total_amount || 0;
      if (t.type === 'income') inc += amt;
      else exp += amt;
    });

    // Sum profit from sold items
    let grossProfit = 0;
    productBreakdown.forEach((p) => {
      grossProfit += p.estimatedProfit;
    });
    if (grossProfit === 0 && inc > 0) {
      grossProfit = Math.round(inc * 0.2);
    }

    const margin = inc > 0 ? Number(((grossProfit / inc) * 100).toFixed(1)) : 0;

    return {
      income: inc,
      expense: exp,
      profit: grossProfit,
      margin,
      txCount: filteredTransactions.length,
    };
  }, [filteredTransactions, productBreakdown]);

  const handleShareWhatsAppLaporan = () => {
    const periodLabel =
      period === 'today'
        ? 'Hari Ini'
        : period === 'week'
        ? '7 Hari Terakhir'
        : period === 'month'
        ? 'Bulan Ini'
        : 'Semua Waktu';

    const inc = reportTotals.income.toLocaleString('id-ID');
    const exp = reportTotals.expense.toLocaleString('id-ID');
    const prof = reportTotals.profit.toLocaleString('id-ID');
    const mrg = reportTotals.margin.toLocaleString('id-ID');

    const message = `*Laporan Keuangan Toko*\nPeriode: ${periodLabel}\n\n• *Total Uang Masuk:* Rp${inc}\n• *Total Uang Keluar:* Rp${exp}\n• *Untung Bersih (Sisa):* Rp${prof} (${mrg}%)\n• *Jumlah Transaksi:* ${reportTotals.txCount} catatan\n\n_Dicatat otomatis oleh VokaSync — Asisten Keuangan Pedagang Pasar & UMKM._`;

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* =========================================================
          PRINT-ONLY EXCEL SPREADSHEET VIEW
          ========================================================= */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="border-b-2 border-slate-900 pb-3">
          <h1 className="text-2xl font-black uppercase tracking-wide">
            LAPORAN KEUANGAN & BUKU KAS
          </h1>
          <p className="text-sm font-bold text-slate-700 mt-1">
            VokaSync Financial Ledger System • Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-600">
            Periode: {period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari Terakhir' : period === 'month' ? 'Bulan Ini' : 'Semua Catatan'}
          </p>
        </div>

        {/* Excel Summary Table */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider mb-1">I. Ringkasan Eksekutif Keuangan</h2>
          <table className="excel-print-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Indikator Keuangan</th>
                <th style={{ width: '30%', textAlign: 'right' }}>Nilai (Rupiah / Persen)</th>
                <th style={{ width: '30%' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Uang Masuk (Penjualan)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp{reportTotals.income.toLocaleString('id-ID')}</td>
                <td>Penerimaan bruto dari pembeli</td>
              </tr>
              <tr>
                <td>Total Uang Keluar (Belanja Modal & Operasional)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp{reportTotals.expense.toLocaleString('id-ID')}</td>
                <td>Total kulakan & belanja stok</td>
              </tr>
              <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                <td>Untung Bersih (Sisa Uang)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp{reportTotals.profit.toLocaleString('id-ID')}</td>
                <td>Laba bersih usaha</td>
              </tr>
              <tr>
                <td>Persentase Margin Keuntungan</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{reportTotals.margin}%</td>
                <td>Efisiensi keuntungan usaha</td>
              </tr>
              <tr>
                <td>Total Catatan Transaksi</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{reportTotals.txCount} transaksi</td>
                <td>Aktivitas tercatat pada periode ini</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Excel Product Table */}
        <div className="pt-3">
          <h2 className="text-sm font-black uppercase tracking-wider mb-1">II. Rincian Penjualan Komoditas & Barang Dagangan</h2>
          <table className="excel-print-table">
            <thead>
              <tr>
                <th style={{ width: '8%', textAlign: 'center' }}>No</th>
                <th style={{ width: '35%' }}>Nama Barang / Produk</th>
                <th style={{ width: '17%', textAlign: 'right' }}>Volume Terjual</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Total Omzet</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Estimasi Laba Bersih</th>
              </tr>
            </thead>
            <tbody>
              {productBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '12px' }}>Tidak ada transaksi penjualan barang pada periode ini.</td>
                </tr>
              ) : (
                productBreakdown.map((item, idx) => (
                  <tr key={item.name}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>{item.qty} {item.unit}</td>
                    <td style={{ textAlign: 'right' }}>Rp{item.totalIncome.toLocaleString('id-ID')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp{item.estimatedProfit.toLocaleString('id-ID')} ({item.marginPercent}%)</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Daily Trend Table */}
        <div className="pt-3">
          <h2 className="text-sm font-black uppercase tracking-wider mb-1">III. Rekapitulasi Arus Kas Harian</h2>
          <table className="excel-print-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Hari / Tanggal</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Uang Masuk</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Uang Keluar</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Sisa Arus Kas</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((d) => (
                <tr key={d.dayName}>
                  <td style={{ fontWeight: 'bold' }}>{d.dayName}</td>
                  <td style={{ textAlign: 'right' }}>Rp{(d.income || 0).toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'right' }}>Rp{(d.expense || 0).toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp{((d.income || 0) - (d.expense || 0)).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          SCREEN INTERACTIVE UI (HIDDEN DURING PRINT)
          ========================================================= */}
      <div className="print:hidden space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#00875A] stroke-[2.5]" />
              <span>Laporan Keuangan Toko</span>
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Buku kas dan rangkuman keuntungan yang selalu sinkron dengan Beranda & Catatan Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 self-stretch sm:self-auto w-full sm:w-auto">
            <Link
              href="/riwayat"
              className="flex items-center justify-center gap-1.5 bg-white border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/60 text-emerald-900 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
              title="Buka Catatan Riwayat Lengkap"
            >
              <History className="w-3.5 h-3.5 text-[#00875A] stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Riwayat</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchRealTimeData(false)}
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs text-center"
              title="Perbarui Data Real Time"
            >
              <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="truncate">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsAppLaporan}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 border border-[#1EBE5B] text-center"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Rekap WA</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#059669] text-white px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 text-center"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Cetak</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00875A] stroke-[2.5]" />
          <span className="text-sm font-black text-slate-800">Pilih Periode:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua Catatan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id as ReportPeriod)}
              className={`text-sm font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer ${period === tab.id
                  ? 'bg-[#00875A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized 4 Metrics Cards Grid (Exact Dashboard Parity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <MetricCard
          title="Total Uang Masuk"
          description={period === 'today' ? 'Total penjualan hari ini' : 'Total penjualan periode ini'}
          value={period === 'today' && metrics.today_income ? `Rp${(metrics.today_income ?? 0).toLocaleString('id-ID')}` : `Rp${reportTotals.income.toLocaleString('id-ID')}`}
          changePercent={metrics.today_income_change ?? 0}
          variant="emerald"
          icon={<Wallet className="w-6 h-6 stroke-[2.5]" />}
        />

        <MetricCard
          title="Total Uang Keluar"
          description={period === 'today' ? 'Total belanja & biaya' : 'Total belanja periode ini'}
          value={period === 'today' && metrics.today_expense !== undefined && metrics.today_income > 0 ? `Rp${(metrics.today_expense ?? 0).toLocaleString('id-ID')}` : `Rp${reportTotals.expense.toLocaleString('id-ID')}`}
          changePercent={metrics.today_expense_change ?? 0}
          variant="white"
          isExpense={true}
          icon={<Receipt className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
        />

        <MetricCard
          title="Untung Bersih (Sisa Uang)"
          description="Uang bersih untuk tabungan & keluarga"
          value={period === 'today' && metrics.today_profit ? `Rp${(metrics.today_profit ?? 0).toLocaleString('id-ID')}` : `Rp${reportTotals.profit.toLocaleString('id-ID')}`}
          changePercent={metrics.today_profit_change ?? 0}
          variant="lime"
          icon={<PiggyBank className="w-6 h-6 stroke-[2.5]" />}
        />

        <MetricCard
          title="Persen Keuntungan"
          description="Rata-rata untung dari setiap rupiah"
          value={period === 'today' && metrics.today_margin ? `${(metrics.today_margin ?? 0).toLocaleString('id-ID')}%` : `${reportTotals.margin.toLocaleString('id-ID')}%`}
          changePercent={metrics.today_margin_change ?? 0}
          variant="white"
          icon={<Percent className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
        />
      </div>

      {/* Top Selling Products Breakdown */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Penjualan Tiap Barang Dagangan
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Rincian barang paling laris dan menghasilkan uang pada periode ini
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
            {productBreakdown.length} Jenis Barang
          </span>
        </div>

        {productBreakdown.length === 0 ? (
          <p className="text-center py-8 text-sm font-semibold text-slate-400">
            Belum ada penjualan barang pada periode ini.
          </p>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {productBreakdown.map((item, idx) => {
              return (
                <div key={item.name} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-black text-slate-900">{item.name}</h4>
                      <p className="text-xs font-semibold text-slate-500">
                        Terjual: {item.qty} {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Uang Masuk</span>
                      <span className="text-base font-black text-[#00875A]">
                        Rp{item.totalIncome.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold block">Estimasi Untung</span>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="text-base font-black text-emerald-800">
                          Rp{item.estimatedProfit.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.2 rounded-md">
                          {item.marginPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buku Kas Ringkas Aliran Harian */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Ringkasan Aliran Kas 7 Hari Terakhir
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Buku kas harian yang menunjukkan selisih uang masuk dan belanja per hari
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-50 text-xs uppercase font-black text-slate-500 border-b-2 border-slate-100">
              <tr>
                <th className="py-3 px-4">Hari</th>
                <th className="py-3 px-4 text-[#00875A]">Uang Masuk</th>
                <th className="py-3 px-4 text-rose-600">Uang Keluar</th>
                <th className="py-3 px-4 text-right">Sisa Uang Harian</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 font-bold">
              {trendData.map((d) => {
                const sisa = (d.income || 0) - (d.expense || 0);

                return (
                  <tr key={d.dayName} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-black text-slate-900">{d.dayName}</td>
                    <td className="py-3.5 px-4 text-[#00875A]">
                      Rp{(d.income || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-rose-600">
                      Rp{(d.expense || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      Rp{sisa.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
