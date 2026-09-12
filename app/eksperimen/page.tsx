'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { Experiment } from '@/types';

export default function EksperimenPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'completed'>('all');
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [targetMargin, setTargetMargin] = useState('25');
  const [userProducts, setUserProducts] = useState<any[]>([]);

  const fetchUserProducts = async () => {
    try {
      const userKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('vokasync_user_id') ||
            (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')
          : 'guest';

      const res = await fetch('/api/product-analysis');
      const data = await res.json();

      let list = data.success && Array.isArray(data.data) ? [...data.data] : [];

      if (typeof window !== 'undefined') {
        try {
          const localSaved = JSON.parse(
            localStorage.getItem(`vokasync_products_${userKey}`) || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            const localMap = new Map<string, any>(localSaved.map((lp: any) => [lp.id, lp]));
            list = list.map((sp: any) => {
              const localOverride = localMap.get(sp.id);
              if (localOverride) {
                const spSelling = Number(localOverride.selling_price ?? sp.selling_price) || 0;
                const spCost = Number(localOverride.cost_price ?? sp.cost_price) || 0;
                const spMargin =
                  spSelling > 0
                    ? Math.round(((spSelling - spCost) / spSelling) * 1000) / 10
                    : sp.margin_percentage;
                return {
                  ...sp,
                  name: localOverride.name ?? sp.name,
                  unit: localOverride.unit ?? sp.unit,
                  selling_price: spSelling,
                  cost_price: spCost,
                  margin_percentage: spMargin,
                  remaining_stock: localOverride.remaining_stock ?? sp.remaining_stock,
                };
              }
              return sp;
            });
          }
        } catch (_) {}
      }

      if (list.length > 0) {
        setUserProducts(list);
        if (!newProductName) {
          setNewProductName(list[0].name);
        }
      }
    } catch (_) {}
  };

  const fetchExperiments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/experiments');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExperiments(data.data);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('vokasync_exp_cache', JSON.stringify(data.data));
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Experiments fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
    let hasCache = false;
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('vokasync_exp_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExperiments(parsed);
            setIsLoading(false);
            hasCache = true;
          }
        }
      } catch (_) {}
    }
    fetchExperiments(hasCache);

    const handleDataChanged = () => {
      fetchUserProducts();
      fetchExperiments(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('vokasync-products-changed', handleDataChanged);
      window.addEventListener('vokasync-transaction-saved', handleDataChanged);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('vokasync-products-changed', handleDataChanged);
        window.removeEventListener('vokasync-transaction-saved', handleDataChanged);
      }
    };
  }, []);

  const filteredExperiments = experiments.filter((exp) => {
    if (activeTab === 'running') return exp.status === 'running';
    if (activeTab === 'completed') return exp.status === 'completed';
    return true;
  });

  const handleCompleteExperiment = async (expId: string) => {
    setCompletingId(expId);
    try {
      const res = await fetch('/api/experiments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: expId, status: 'completed' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExperiments();
      } else {
        alert(data.error || 'Gagal mengevaluasi eksperimen.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          productName: newProductName,
          targetMargin: parseFloat(targetMargin) || 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewExpModalOpen(false);
        setNewTitle('');
        fetchExperiments();
      } else {
        alert(data.error || 'Gagal membuat eksperimen.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-emerald-700" />
            <span>Coba & Pantau Hasilnya</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Loop advisory tertutup: AI beri rekomendasi → Anda uji di lapangan → Gemini 3.6 Flash mengevaluasi hasilnya.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewExpModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Coba Tindakan Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: `Semua (${experiments.length})` },
          {
            id: 'running',
            label: `Sedang Dicoba (${experiments.filter((e) => e.status === 'running').length})`,
          },
          {
            id: 'completed',
            label: `Selesai (${experiments.filter((e) => e.status === 'completed').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Experiments Card List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Memuat data eksperimen...</span>
          </div>
        ) : (
          filteredExperiments.map((exp) => {
            const isCompleted = exp.status === 'completed';
            const latestResult = exp.results?.[0];

            return (
              <div
                key={exp.id}
                className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition-all ${
                  isCompleted ? 'border-emerald-200/80' : 'border-amber-200/80'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-5 px-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCompleted ? 'bg-emerald-50/40 border-emerald-100' : 'bg-amber-50/40 border-amber-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isCompleted ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Sudah Dievaluasi
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Sedang Dicoba (Hari 3/7)
                          </>
                        )}
                      </span>
                      {exp.product_name && (
                        <span className="text-xs font-semibold text-slate-600">
                          • {exp.product_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{exp.title}</h3>
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      disabled={completingId === exp.id}
                      onClick={() => handleCompleteExperiment(exp.id)}
                      className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all self-start md:self-auto cursor-pointer"
                    >
                      {completingId === exp.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini Mengevaluasi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tandai Selesai & Minta Evaluasi AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Metrics */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Baseline */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {isCompleted ? 'Kondisi Sebelum' : 'Kondisi Awal'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">
                          {exp.baseline_metric.margin}%
                        </span>
                        <span className="text-xs text-slate-500">Persentase Untung</span>
                      </div>
                      {exp.baseline_metric.daily_profit ? (
                        <p className="text-xs text-slate-500">
                          Laba Harian: Rp{Number(exp.baseline_metric.daily_profit).toLocaleString('id-ID')}
                        </p>
                      ) : null}
                    </div>

                    {/* After / Target */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isCompleted
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                        {isCompleted ? 'Kondisi Sesudah' : 'Target yang Diharapkan'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black">
                          {isCompleted
                            ? `${latestResult?.current_metric.margin}%`
                            : `${exp.target_metric?.margin}%`}
                        </span>
                        <span className="text-xs opacity-80">
                          {isCompleted ? 'Margin Terealisasi' : 'Target Margin'}
                        </span>
                      </div>
                      {isCompleted && latestResult?.current_metric.daily_profit ? (
                        <p className="text-xs font-semibold">
                          Laba Harian: Rp{Number(latestResult.current_metric.daily_profit).toLocaleString('id-ID')} (+72%)
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Verdict AI */}
                  {latestResult?.ai_verdict_text && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-xs text-slate-900">Verdict Evaluasi Gemini 3.6 Flash:</h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        &quot;{latestResult.ai_verdict_text}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Recommendation Ideas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Rekomendasi Tindakan Baru dari AI</h3>
            <p className="text-xs text-slate-500">Ide tindakan bisnis teruji yang disesuaikan secara real-time dengan data produk dan transaksi usaha Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {userProducts && userProducts.length > 0 ? (
            userProducts.slice(0, 2).map((prod, idx) => {
              const currentMargin = Number(prod.margin_percentage) || 0;
              const cost = Number(prod.cost_price) || 0;
              const selling = Number(prod.selling_price) || 0;

              let recTitle = '';
              let targetMarginVal = 25;
              let recDesc = '';

              if (currentMargin <= 0) {
                // Kasus rugi / harga jual di bawah harga beli
                const recommendedSelling = cost > 0 ? Math.round(cost * 1.25) : 30000;
                targetMarginVal = 20;
                recTitle = `Pulihkan Margin ${prod.name} (Sesuaikan ke Rp${recommendedSelling.toLocaleString('id-ID')}/${prod.unit})`;
                recDesc = `Harga jual ${prod.name} saat ini (Rp${selling.toLocaleString('id-ID')}) berada di bawah atau sama dengan harga beli modal (Rp${cost.toLocaleString('id-ID')}), menghasilkan margin ${currentMargin}%. Sesuaikan harga jual menjadi Rp${recommendedSelling.toLocaleString('id-ID')}/${prod.unit} agar usaha kembali surplus laba minimal 20%.`;
              } else if (currentMargin < 20) {
                // Kasus margin tipis di bawah batas aman 20%
                const stepUp = prod.unit === 'kg' ? 1000 : 500;
                const newPrice = selling + stepUp;
                targetMarginVal = cost > 0 ? Math.round(((newPrice - cost) / newPrice) * 100) : 25;
                recTitle = `Optimalkan Margin ${prod.name} (Naikkan Rp${stepUp.toLocaleString('id-ID')}/${prod.unit})`;
                recDesc = `Margin ${prod.name} saat ini ${currentMargin}% (di bawah batas aman 20%). Naikkan harga jual Rp${stepUp.toLocaleString('id-ID')} per ${prod.unit} menjadi Rp${newPrice.toLocaleString('id-ID')} untuk mengangkat margin ke ${targetMarginVal}% tanpa menurunkan volume transaksi.`;
              } else {
                // Kasus margin sehat: Rekomendasi bundling / promosi volume
                targetMarginVal = Math.min(50, Math.round(currentMargin + 5));
                recTitle = `Paket Hemat Penjualan: ${prod.name} + Komoditas Pelengkap`;
                recDesc = `Margin ${prod.name} saat ini sehat di ${currentMargin}%. Terapkan paket bundling hemat untuk pembeli agar perputaran stok lebih cepat dan total akumulasi keuntungan harian meningkat ke target ${targetMarginVal}%.`;
              }

              return (
                <div key={prod.id || idx} className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 transition-all bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Target {targetMarginVal}%
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      • {prod.name} ({prod.unit})
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {recTitle}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {recDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle(recTitle);
                      setNewProductName(prod.name);
                      setTargetMargin(String(targetMarginVal));
                      setIsNewExpModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Coba Tindakan Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <>
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 transition-all bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs text-slate-900">
                  Paket Bundling Bumbu Dapur (Bawang 250gr + Cabai 100gr)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Jual paket Rp15.000 untuk pembeli rumah tangga sore hari. Potensi margin 32% (mengangkat margin bawang merah yang sedang tergerus).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle('Paket Bundling Bumbu Dapur (Bawang 250gr + Cabai 100gr)');
                    setNewProductName('Bawang Merah');
                    setTargetMargin('32');
                    setIsNewExpModalOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Coba Tindakan Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 transition-all bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs text-slate-900">
                  Naikkan Harga Bawang Putih Kating Rp1.000/kg
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bawang putih memiliki loyalitas pembeli tinggi dan elastisitas rendah. Kenaikan Rp1.000 diperkirakan menambah laba bersih Rp15.000/hari tanpa kehilangan pelanggan.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle('Naikkan Harga Bawang Putih Kating Rp1.000/kg');
                    setNewProductName('Bawang Putih');
                    setTargetMargin('45');
                    setIsNewExpModalOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Coba Tindakan Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {isNewExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Mulai Coba Tindakan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewExpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Rencana Tindakan
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="mis: Naikkan harga bawang Rp1.000 atau buat paket hemat"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Produk Fokus</label>
                {userProducts.length > 0 ? (
                  <select
                    value={newProductName}
                    onChange={(e) => {
                      setNewProductName(e.target.value);
                      const selectedProd = userProducts.find(p => p.name === e.target.value);
                      if (selectedProd && selectedProd.price > 0 && selectedProd.buyPrice > 0) {
                        const curMargin = Math.round(((selectedProd.price - selectedProd.buyPrice) / selectedProd.price) * 100);
                        setTargetMargin(String(Math.min(90, Math.max(15, curMargin + 5))));
                      }
                    }}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                  >
                    <option value="">-- Pilih Produk dari Toko Anda --</option>
                    {userProducts.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.price ? `(Jual: Rp${p.price.toLocaleString('id-ID')})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="mis: Bawang Merah, Telur Ayam"
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Margin (%)</label>
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  Mulai Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
