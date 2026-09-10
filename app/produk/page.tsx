'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Sparkles,
  Search,
  Flame,
  ShieldCheck,
  AlertTriangle,
  MinusCircle,
  FlaskConical,
  Share2,
  Loader2,
  Plus,
  X,
  RefreshCw,
  Package,
} from 'lucide-react';
import { mockProducts, mockProfile } from '@/lib/mock-data';
import { ProductAnalysisItem, ProductActionCategory } from '@/types';
import { StudioModal } from '@/components/studio/StudioModal';

export default function ProdukPage() {
  const [products, setProducts] = useState<ProductAnalysisItem[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalysisItem>(mockProducts[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [threshold, setThreshold] = useState(mockProfile.margin_alert_threshold);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tambah Produk Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductSelling, setNewProductSelling] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // AI Advisor Note State
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});
  const [isLoadingAiNote, setIsLoadingAiNote] = useState(false);

  // Fetch product list
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/product-analysis');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setProducts(data.data);
        if (data.threshold) setThreshold(data.threshold);
        return data.data;
      }
    } catch (e) {
      console.warn('Product analysis fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    loadProducts().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setSelectedProduct(loaded[0]);
      }
    });
  }, [loadProducts]);

  // Fetch or generate dynamic Gemini AI note for selected product
  const fetchAiAdvisorNote = useCallback(async (product: ProductAnalysisItem, forceRefresh = false) => {
    if (!product) return;
    const cacheKey = `${product.id}-${product.cost_price}-${product.selling_price}`;

    if (!forceRefresh && aiNotes[cacheKey]) {
      return;
    }

    setIsLoadingAiNote(true);
    try {
      const res = await fetch('/api/product-analysis/advisor-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          costPrice: product.cost_price,
          sellingPrice: product.selling_price,
          margin: product.margin_percentage,
          actionCategory: product.action_category,
          unit: product.unit,
        }),
      });

      const data = await res.json();
      if (data.success && data.note) {
        setAiNotes((prev) => ({
          ...prev,
          [cacheKey]: data.note,
        }));
      }
    } catch (err) {
      console.error('Error fetching AI Advisor note:', err);
    } finally {
      setIsLoadingAiNote(false);
    }
  }, [aiNotes]);

  // Trigger AI note fetch whenever selected product changes
  useEffect(() => {
    if (selectedProduct) {
      fetchAiAdvisorNote(selectedProduct);
    }
  }, [selectedProduct?.id, fetchAiAdvisorNote]);

  const getActionBadge = (category: ProductActionCategory) => {
    switch (category) {
      case 'dorong':
        return {
          label: 'Perbanyak Jual',
          icon: Flame,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          desc: 'Margin sangat tinggi (>35%). Sangat menguntungkan untuk dipromosikan lebih giat ke pembeli.',
        };
      case 'pertahankan':
        return {
          label: 'Sudah Bagus',
          icon: ShieldCheck,
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          desc: 'Margin sehat dan perputaran stabil. Jaga ketersediaan pasokan dari agen.',
        };
      case 'perbaiki':
        return {
          label: 'Perlu Diperbaiki',
          icon: AlertTriangle,
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          desc: `Margin tergerus di bawah target ${threshold}%. Perlu penyesuaian harga atau bundling produk.`,
        };
      case 'kurangi':
      default:
        return {
          label: 'Kurangi Stok',
          icon: MinusCircle,
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          desc: 'Margin sangat tipis dan modal tertahan. Pertimbangkan kurangi kuota kulakan harian.',
        };
    }
  };

  // Submit Handler for Tambah Produk
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setAddError('Nama produk wajib diisi.');
      return;
    }
    const cost = parseFloat(newProductCost) || 0;
    const selling = parseFloat(newProductSelling) || 0;

    if (cost <= 0 || selling <= 0) {
      setAddError('Harga beli dari supplier dan harga jual harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setAddError('');

    try {
      const res = await fetch('/api/product-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          unit: newProductUnit,
          costPrice: cost,
          sellingPrice: selling,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan produk baru.');
      }

      // Reset form & close modal
      setNewProductName('');
      setNewProductCost('');
      setNewProductSelling('');
      setIsAddModalOpen(false);

      // Refresh list
      const updatedList = await loadProducts();
      if (updatedList && updatedList.length > 0) {
        const newlyAdded =
          updatedList.find(
            (p: ProductAnalysisItem) =>
              p.name.toLowerCase() === newProductName.trim().toLowerCase()
          ) || updatedList[0];
        setSelectedProduct(newlyAdded);
      }
    } catch (err: any) {
      setAddError(err.message || 'Terjadi kesalahan saat menambah produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate live preview margin in modal
  const modalCostNum = parseFloat(newProductCost) || 0;
  const modalSellingNum = parseFloat(newProductSelling) || 0;
  const modalNetProfit = modalSellingNum - modalCostNum;
  const modalMargin =
    modalSellingNum > 0 ? Math.round((modalNetProfit / modalSellingNum) * 100) : 0;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.action_category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentCacheKey = selectedProduct
    ? `${selectedProduct.id}-${selectedProduct.cost_price}-${selectedProduct.selling_price}`
    : '';
  const currentAiNote = selectedProduct
    ? aiNotes[currentCacheKey] || getActionBadge(selectedProduct.action_category).desc
    : '';

  return (
    <div className="space-y-6">
      {/* Studio Modal for Marketing */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        productName={selectedProduct?.name || 'Bawang Merah'}
      />

      {/* Modal Tambah Produk Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Tambah Produk Dagangan</h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan komoditas untuk dipantau labanya oleh AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catatan Jalur Opsional */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Jalur Opsional (Sebelum Transaksi)</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Anda tidak wajib mendaftarkan produk di sini. Produk akan <strong>otomatis dibuatkan dan aktif</strong> saat Pak Roy menyebutkan transaksi di menu <strong>Catat Transaksi</strong>.
              </p>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bawang Bombay, Telur Ayam, Minyak Goreng"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Satuan Jual / Kulak <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['kg', 'ikat', 'butir', 'liter', 'bungkus', 'karung', 'pcs', 'renteng'].map(
                    (unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setNewProductUnit(unit)}
                        className={`text-xs py-1.5 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                          newProductUnit === unit
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {unit}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Beli dari Supplier <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="25000"
                      value={newProductCost}
                      onChange={(e) => setNewProductCost(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual Eceran <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="31250"
                      value={newProductSelling}
                      onChange={(e) => setNewProductSelling(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Live Financial Margin Preview */}
              {modalSellingNum > 0 && modalCostNum > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Estimasi Untung Bersih:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      Rp{modalNetProfit.toLocaleString('id-ID')} / {newProductUnit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimasi Persentase Untung:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md ${
                        modalMargin >= threshold
                          ? 'text-emerald-800 bg-emerald-100/70 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {modalMargin}% {modalMargin < threshold && `(Di bawah target ${threshold}%)`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Simpan Produk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-700" />
            <span>Produk Saya</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mengetahui produk yang paling <strong>menguntungkan</strong> — didukung diagnosis taktis AI Gemini.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600 font-medium">
              Batas Untung Minimum:{' '}
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60 font-black">
                {threshold}%
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            title="Jalur opsional: Produk biasanya otomatis terbentuk saat Anda mencatat transaksi suara"
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Tambah Produk</span>
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold">
              Opsional
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Semua Produk' },
            { id: 'dorong', label: 'Perbanyak Jual' },
            { id: 'pertahankan', label: 'Sudah Bagus' },
            { id: 'perbaiki', label: 'Perlu Diperbaiki' },
            { id: 'kurangi', label: 'Kurangi Stok' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk dagangan..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-emerald-600 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product List */}
        <div className="lg:col-span-7 space-y-3.5">
          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Memuat data produk & komoditas...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-700">Tidak ada produk ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci lain atau tambahkan produk baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Sekarang</span>
              </button>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const badge = getActionBadge(p.action_category);
              const BadgeIcon = badge.icon;
              const isSelected = selectedProduct?.id === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`bg-white p-5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/15'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rata-rata {p.avg_daily_volume} {p.unit}/hari • Total Penjualan 7 Hari: Rp{p.total_revenue_7d.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                          p.is_stock_low
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <span>Stok tersisa:</span>
                          <strong className="font-black">{p.remaining_stock ?? 10} {p.unit}</strong>
                          {p.is_stock_low && <span className="text-[10px] bg-amber-200 text-amber-950 px-1 rounded font-black">⚠️ Menipis</span>}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Margin Visual Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Persentase Untung:</span>
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {p.margin_percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.margin_percentage >= 30
                            ? 'bg-emerald-600'
                            : p.margin_percentage >= 20
                            ? 'bg-blue-600'
                            : p.margin_percentage >= 10
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(Math.max(p.margin_percentage * 2, 8), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Harga Beli dari Supplier: </span>
                      <span className="font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                        Rp{p.cost_price.toLocaleString('id-ID')}/{p.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Harga Jual: </span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        Rp{p.selling_price.toLocaleString('id-ID')}/{p.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Product Detail */}
        {selectedProduct && (
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs sticky top-24 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    DETAIL ANALISIS PRODUK
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                    {selectedProduct.name}
                  </h2>
                </div>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200/80">
                  Satuan: {selectedProduct.unit}
                </span>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Harga Beli dari Supplier:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    Rp{selectedProduct.cost_price.toLocaleString('id-ID')} / {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Harga Jual ke Pembeli:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    Rp{selectedProduct.selling_price.toLocaleString('id-ID')} / {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Untung per Kg/Pcs:</span>
                  <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    Rp{(selectedProduct.selling_price - selectedProduct.cost_price).toLocaleString('id-ID')} / {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Persentase Untung:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-md border ${
                      selectedProduct.margin_percentage >= threshold
                        ? 'text-emerald-800 bg-emerald-100/70 border-emerald-200'
                        : 'text-rose-800 bg-rose-50 border-rose-200'
                    }`}
                  >
                    {selectedProduct.margin_percentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Saran VokaSync:</span>
                  <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md uppercase border border-slate-200/70">
                    {getActionBadge(selectedProduct.action_category).label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500">Stok Tersisa Saat Ini:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-md text-xs ${
                      selectedProduct.is_stock_low
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {selectedProduct.remaining_stock ?? 10} {selectedProduct.unit}
                    {selectedProduct.is_stock_low ? ' ⚠️ (Perlu Kulakan Segera)' : ' (Cukup)'}
                  </span>
                </div>
              </div>

              {/* Dynamic AI Advisor Diagnostic Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 relative transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs text-emerald-900">Catatan AI Advisor</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300/60">
                      Gemini 3.6 Flash
                    </span>
                  </div>

                  <button
                    type="button"
                    title="Minta diagnosis taktis baru dari Gemini AI"
                    onClick={() => fetchAiAdvisorNote(selectedProduct, true)}
                    disabled={isLoadingAiNote}
                    className="text-[11px] flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded-lg border border-emerald-200/60 font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAiNote ? 'animate-spin' : ''}`} />
                    <span>{isLoadingAiNote ? 'Menganalisis...' : 'Cek Ulang'}</span>
                  </button>
                </div>

                {isLoadingAiNote ? (
                  <div className="py-2 flex items-center gap-2 text-xs text-emerald-800">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span className="animate-pulse">
                      Gemini AI sedang menghitung taktik margin untuk {selectedProduct.name}...
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {currentAiNote}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudioOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Buat Promosi WhatsApp Produk Ini</span>
                </button>

                <a
                  href="/eksperimen"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all active:scale-98"
                >
                  <FlaskConical className="w-4 h-4 text-slate-600" />
                  <span>Coba & Pantau Perubahan Harga</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
