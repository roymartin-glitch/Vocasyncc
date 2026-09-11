'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Pencil,
  Check,
  Trash2,
  Camera,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { ProductAnalysisItem, ProductActionCategory } from '@/types';
import { StudioModal } from '@/components/studio/StudioModal';

export default function ProdukPage() {
  const [products, setProducts] = useState<ProductAnalysisItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalysisItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [threshold, setThreshold] = useState(20);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tambah Produk Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductSelling, setNewProductSelling] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductImage, setNewProductImage] = useState<string | null>(null);
  const [isUploadingNewPhoto, setIsUploadingNewPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Produk Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductAnalysisItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editSelling, setEditSelling] = useState('');
  const [editStock, setEditStock] = useState('10');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete Product State
  const [productToDelete, setProductToDelete] = useState<ProductAnalysisItem | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);


  // AI Advisor Note State
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});
  const [isLoadingAiNote, setIsLoadingAiNote] = useState(false);

  const getUserKey = () => {
    if (typeof window === 'undefined') return 'guest';
    return localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
  };

  // Fetch product list
  const loadProducts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/product-analysis');
      const data = await res.json();
      if (data.success && data.data) {
        const userKey = getUserKey();
        let list = [...data.data];

        // Merge locally added products for this user
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('vokasync_products_cache'); // purge legacy unscoped
            const localSaved = JSON.parse(localStorage.getItem(`vokasync_products_${userKey}`) || '[]');
            const existingIds = new Set(list.map((p: any) => p.id));
            for (const lp of localSaved) {
              if (lp && lp.id && !existingIds.has(lp.id)) {
                list.unshift(lp);
                existingIds.add(lp.id);
              }
            }
            sessionStorage.setItem(`vokasync_products_cache_${userKey}`, JSON.stringify({
              data: list,
              threshold: data.threshold,
            }));
          } catch (_) { }
        }

        setProducts(list);
        if (data.threshold) setThreshold(data.threshold);
        return list;
      }
    } catch (e) {
      console.warn('Product analysis fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    let hasCache = false;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('vokasync_products_cache'); // purge legacy unscoped
        const userKey = getUserKey();
        const cached = sessionStorage.getItem(`vokasync_products_cache_${userKey}`) || localStorage.getItem(`vokasync_products_${userKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheList = Array.isArray(parsed) ? parsed : parsed.data;
          if (Array.isArray(cacheList) && cacheList.length > 0) {
            setProducts(cacheList);
            setSelectedProduct(cacheList[0]);
            if (parsed.threshold) setThreshold(parsed.threshold);
            setIsLoading(false);
            hasCache = true;
          }
        }
      } catch (_) { }
    }

    loadProducts(hasCache).then((loaded) => {
      if (loaded && loaded.length > 0) {
        setSelectedProduct((prev) => prev || loaded[0]);
      } else if (!hasCache) {
        setSelectedProduct(null);
      }
    });

    const handleSettingsChanged = (e: any) => {
      if (e?.detail?.margin_alert_threshold) {
        setThreshold(e.detail.margin_alert_threshold);
      }
      loadProducts(false);
    };

    window.addEventListener('vokasync-settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('vokasync-settings-changed', handleSettingsChanged);
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
          desc: 'Margin sangat tipis dan modal tertahan. Pertimbangkan kurangi belanja stok harian.',
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
    let cost = parseFloat(newProductCost) || 0;
    let selling = parseFloat(newProductSelling) || 0;
    const stockQty = Math.max(0, parseFloat(newProductStock) || 10);

    if (cost <= 0 && selling <= 0) {
      setAddError('Masukkan minimal salah satu dari harga jual atau harga beli.');
      return;
    }

    if (selling <= 0 && cost > 0) {
      selling = Math.round(cost * 1.25);
    } else if (cost <= 0 && selling > 0) {
      cost = Math.round(selling * 0.8);
    }

    setIsSubmitting(true);
    setAddError('');

    try {
      let createdItem: any = null;

      try {
        const res = await fetch('/api/product-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProductName.trim(),
            unit: newProductUnit,
            costPrice: cost,
            sellingPrice: selling,
            stock: stockQty,
            imageUrl: newProductImage,
          }),
        });

        const result = await res.json();
        if (result.success && result.data) {
          createdItem = result.data;
        }
      } catch (networkErr) {
        console.warn('Network product post fallback:', networkErr);
      }

      // Fallback lokal jika server sedang offline / kendala jaringan
      if (!createdItem) {
        const userKey = getUserKey();
        const marginVal = Math.round(((selling - cost) / (selling || 1)) * 100);
        createdItem = {
          id: 'prod-' + Date.now(),
          name: newProductName.trim(),
          unit: newProductUnit,
          image_url: newProductImage || null,
          cost_price: Math.round(cost),
          selling_price: Math.round(selling),
          margin_percentage: marginVal,
          action_category: marginVal >= 20 ? 'dorong' : 'perbaiki',
          avg_daily_volume: 5,
          total_revenue_7d: selling * 10,
          remaining_stock: stockQty,
          is_stock_low: stockQty <= 2,
          user_id: userKey,
        };
      }

      // Reset form & close modal
      setNewProductName('');
      setNewProductCost('');
      setNewProductSelling('');
      setNewProductStock('10');
      setNewProductImage(null);
      setIsAddModalOpen(false);

      // Instant state update & local persistence for seamless UX
      setProducts((prev) => {
        const next = [createdItem, ...prev.filter((p) => p.id !== createdItem.id && p.name.toLowerCase() !== createdItem.name.toLowerCase())];
        if (typeof window !== 'undefined') {
          try {
            const userKey = getUserKey();
            localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(next));
            sessionStorage.setItem(
              `vokasync_products_cache_${userKey}`,
              JSON.stringify({ data: next, threshold })
            );

            // REAL-TIME SYNC: Catat transaksi belanja stok modal awal ke Riwayat & Laporan
            const initialExpense = Math.round(cost * stockQty);
            if (initialExpense > 0) {
              const txId = 'tx-stok-' + Date.now();
              const newExpenseTx = {
                id: txId,
                user_id: userKey,
                type: 'expense',
                transaction_date: new Date().toISOString(),
                source: 'manual',
                raw_voice_text: `Stok Awal Barang: ${createdItem.name} (${stockQty} ${newProductUnit})`,
                total_amount: initialExpense,
                items: [
                  {
                    id: 'txi-' + Date.now(),
                    transaction_id: txId,
                    product_id: createdItem.id,
                    product_name: createdItem.name,
                    quantity: stockQty,
                    unit: newProductUnit,
                    unit_price: Math.round(cost),
                    subtotal: initialExpense,
                  },
                ],
              };

              const currentTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
              currentTxs.unshift(newExpenseTx);
              localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(currentTxs.slice(0, 100)));

              // Clear caches across Riwayat, Laporan, and Beranda for instantaneous refresh
              sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
              sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
              sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
              sessionStorage.removeItem('vokasync_tx_cache');
              sessionStorage.removeItem('vokasync_dash_cache');
              sessionStorage.removeItem('vokasync_laporan_cache');

              // Sync asynchronously to backend transactions API
              fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'expense',
                  productName: createdItem.name,
                  quantity: stockQty,
                  unit: newProductUnit,
                  totalAmount: initialExpense,
                  source: 'manual',
                  rawVoiceText: `Stok Awal Barang: ${createdItem.name} (${stockQty} ${newProductUnit})`,
                }),
              }).catch(() => { });
            }
          } catch (_) { }
        }
        return next;
      });
      setSelectedProduct(createdItem);

      // Background refresh
      loadProducts(true);
    } catch (err: any) {
      setAddError(err.message || 'Terjadi kesalahan saat menambah produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (p: ProductAnalysisItem) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditUnit(p.unit);
    setEditSelling(String(p.selling_price));
    setEditStock(String(p.remaining_stock ?? 10));
    setEditImageUrl(p.image_url || null);
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Upload photo handler for Tambah Produk modal
  const handleNewProductPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAddError('Pilih file gambar yang valid (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAddError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setIsUploadingNewPhoto(true);
    setAddError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-product-image', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        setNewProductImage(result.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setNewProductImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (_) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingNewPhoto(false);
    }
  };

  // Upload photo handler for edit modal
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editProduct) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Pilih file gambar yang valid (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setEditError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', editProduct.id);

      const res = await fetch('/api/upload-product-image', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        setEditImageUrl(result.url);
      } else {
        // Fallback locally via base64 preview so user experience is uninterrupted
        const reader = new FileReader();
        reader.onload = () => {
          setEditImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (_) {
      // Offline / network fallback with data URL
      const reader = new FileReader();
      reader.onload = () => {
        setEditImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Delete product action
  const executeDeleteProduct = async (id: string) => {
    setIsDeletingProduct(true);
    try {
      const res = await fetch(`/api/product-analysis?id=${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        setProducts((prev) => {
          const next = prev.filter((p) => p.id !== id);
          if (typeof window !== 'undefined') {
            try {
              const userKey = getUserKey();
              localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(next));
              sessionStorage.setItem(
                `vokasync_products_cache_${userKey}`,
                JSON.stringify({ data: next, threshold })
              );
              sessionStorage.removeItem('vokasync_products_cache');
              sessionStorage.removeItem('vokasync_dash_cache');
            } catch (_) { }
          }
          return next;
        });

        if (selectedProduct?.id === id) {
          setSelectedProduct(null);
        }
        setProductToDelete(null);
      } else {
        alert(result.error || 'Gagal menghapus produk.');
      }
    } catch (e: any) {
      alert('Terjadi kesalahan saat menghapus produk.');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Submit edit handler
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    if (!editName.trim()) {
      setEditError('Nama produk wajib diisi.');
      return;
    }
    const selling = parseFloat(editSelling) || 0;
    const stockQty = Math.max(0, parseFloat(editStock) || 0);

    if (selling <= 0) {
      setEditError('Harga jual ke pembeli harus lebih dari 0.');
      return;
    }

    setIsEditSubmitting(true);
    setEditError('');
    try {
      const body: Record<string, any> = {
        id: editProduct.id,
        name: editName.trim(),
        unit: editUnit,
        sellingPrice: selling,
        stock: stockQty,
        imageUrl: editImageUrl,
      };

      const res = await fetch('/api/product-analysis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memperbarui produk.');

      setIsEditModalOpen(false);

      // Instant state update & local persistence
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === editProduct.id
            ? {
              ...p,
              name: editName.trim(),
              unit: editUnit,
              selling_price: selling,
              remaining_stock: stockQty,
              is_stock_low: stockQty <= 2,
              image_url: editImageUrl,
            }
            : p
        );
        if (typeof window !== 'undefined') {
          try {
            const userKey = getUserKey();
            localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(next));
            sessionStorage.setItem(
              `vokasync_products_cache_${userKey}`,
              JSON.stringify({ data: next, threshold })
            );
          } catch (_) { }
        }
        return next;
      });

      setSelectedProduct((prev) =>
        prev?.id === editProduct.id
          ? {
            ...prev,
            name: editName.trim(),
            unit: editUnit,
            selling_price: selling,
            remaining_stock: stockQty,
            is_stock_low: stockQty <= 2,
            image_url: editImageUrl,
          }
          : prev
      );

      loadProducts(true);
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Calculate live preview margin in modal
  const modalCostNum = parseFloat(newProductCost) || 0;
  const modalSellingNum = parseFloat(newProductSelling) || 0;
  const modalNetProfit = modalSellingNum - modalCostNum;
  const modalMargin =
    modalSellingNum > 0 ? Math.round((modalNetProfit / modalSellingNum) * 100) : 0;

  // Calculate live preview margin in edit modal
  const editSellingNum = parseFloat(editSelling) || 0;
  const editCostNum = editProduct?.cost_price || 0;
  const editNetProfit = editSellingNum - editCostNum;
  const editMargin =
    editSellingNum > 0 ? Math.round((editNetProfit / editSellingNum) * 100) : 0;

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
                Anda tidak wajib mendaftarkan produk di sini. Produk akan <strong>otomatis dibuatkan dan aktif</strong> saat Bapak menyebutkan transaksi di menu <strong>Catat Transaksi</strong>.
              </p>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Foto Produk Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Foto Produk / Komoditas <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {newProductImage ? (
                      <img
                        src={newProductImage}
                        alt="Preview Produk"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-7 h-7 text-slate-300" />
                    )}
                    {isUploadingNewPhoto && (
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 shadow-xs transition-colors cursor-pointer active:scale-95">
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{newProductImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewProductPhotoUpload}
                          disabled={isUploadingNewPhoto}
                          className="hidden"
                        />
                      </label>
                      {newProductImage && (
                        <button
                          type="button"
                          onClick={() => setNewProductImage(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Format JPG, PNG, atau WEBP (Maks. 5 MB)
                    </p>
                  </div>
                </div>
              </div>

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
                  Satuan Jual / Beli Stok <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['kg', 'ikat', 'butir', 'liter', 'bungkus', 'karung', 'pcs', 'renteng'].map(
                    (unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setNewProductUnit(unit)}
                        className={`text-xs py-1.5 px-2 rounded-xl font-bold border transition-all cursor-pointer ${newProductUnit === unit
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Stok Awal ({newProductUnit}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Contoh: 10"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Berapa banyak stok barang ini yang saat ini tersedia di kios Anda
                </p>
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
                      className={`font-black px-2 py-0.5 rounded-md ${modalMargin >= threshold
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

      {/* ===== MODAL EDIT PRODUK (E-COMMERCE STYLE) ===== */}
      {isEditModalOpen && editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Edit Komoditas</h3>
                  <p className="text-xs text-slate-500">Kelola harga jual, satuan, dan stok komoditas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">

              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditProduct} className="space-y-4">
                {/* Foto Produk */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Foto Produk / Komoditas
                  </label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      {editImageUrl ? (
                        <img
                          src={editImageUrl}
                          alt={editName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-slate-300" />
                      )}
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 shadow-xs transition-colors cursor-pointer active:scale-95">
                          <Camera className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{editImageUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="hidden"
                          />
                        </label>
                        {editImageUrl && (
                          <button
                            type="button"
                            onClick={() => setEditImageUrl(null)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Format JPG, PNG, atau WEBP (Maks. 5 MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Penjualan</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['kg', 'ikat', 'butir', 'liter', 'bungkus', 'karung', 'pcs', 'renteng'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditUnit(u)}
                        className={`text-xs py-1.5 px-2 rounded-xl font-bold border transition-all cursor-pointer ${editUnit === u
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual ke Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      value={editSelling}
                      onChange={(e) => setEditSelling(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Stok Saat Ini ({editUnit}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="Contoh: 10"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Perbarui jumlah fisik stok komoditas yang tersedia di kios
                  </p>
                </div>

                {/* Live Margin Calculation Preview in Edit Modal */}
                {editSellingNum > 0 && editCostNum > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Harga Beli Modal Terakhir:</span>
                      <span className="font-bold text-slate-700">
                        Rp{editCostNum.toLocaleString('id-ID')} / {editUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimasi Untung Bersih:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Rp{editNetProfit.toLocaleString('id-ID')} / {editUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimasi Persentase Untung:</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded-md ${editMargin >= threshold
                          ? 'text-emerald-800 bg-emerald-100/70 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                      >
                        {editMargin}% {editMargin < threshold && `(Di bawah target ${threshold}%)`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isEditSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                    ) : (
                      <><Check className="w-4 h-4" /><span>Simpan Perubahan</span></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KONFIRMASI HAPUS PRODUK ===== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl flex-shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Produk Ini?</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus produk dari toko Anda.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              Produk <strong>{productToDelete.name}</strong> beserta riwayat pencatatan stoknya akan dihapus permanen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteProduct(productToDelete.id)}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Produk</span>
                  </>
                )}
              </button>
            </div>
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

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
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
            onClick={() => setIsStudioOpen(true)}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs px-3 py-2 rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer"
            title="Buat Brosur & Pesan Promosi WhatsApp dengan AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 stroke-[2.5]" />
            <span className="hidden sm:inline">Promosi</span>
          </button>

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
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === tab.id
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
                  className={`bg-white rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden ${isSelected
                    ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/15'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center flex-shrink-0 font-black overflow-hidden shadow-2xs">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-7 h-7 sm:w-8 sm:h-8" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-slate-900 tracking-tight truncate">{p.name}</h3>
                              {p.is_stock_low && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                  <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                                  Stok Tipis
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              ~{p.avg_daily_volume || 1} {p.unit}/hari • 7 Hari: Rp{(p.total_revenue_7d || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                          >
                            <BadgeIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{badge.label}</span>
                          </span>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit produk dan foto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus produk dari toko"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Margin Bar */}
                      <div className="space-y-1 my-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Persentase Untung:</span>
                          <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {p.margin_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${(p.margin_percentage || 0) >= 30
                              ? 'bg-emerald-600'
                              : (p.margin_percentage || 0) >= 20
                                ? 'bg-blue-600'
                                : (p.margin_percentage || 0) >= 10
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            style={{ width: `${Math.min(Math.max((p.margin_percentage || 0) * 2, 8), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Beli: </span>
                        <span className="font-semibold text-slate-800">Rp{(p.cost_price || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Jual: </span>
                        <span className="font-bold text-slate-900">Rp{(p.selling_price || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="font-semibold text-slate-700">
                        Stok: <span className={`${p.is_stock_low ? 'text-amber-700 font-bold' : ''}`}>{p.remaining_stock ?? 10} {p.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Product Detail */}
        {selectedProduct ? (
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs sticky top-24 overflow-hidden">
              {/* Product Header Banner */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white flex-shrink-0 overflow-hidden shadow-sm">
                      {selectedProduct.image_url ? (
                        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 sm:w-10 sm:h-10" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                        KOMODITAS DAGANGAN
                      </span>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        {selectedProduct.name}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedProduct)}
                    className="flex items-center gap-1.5 bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-emerald-50 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3 text-emerald-700" />
                    Edit Data
                  </button>
                </div>
                {selectedProduct.is_stock_low && (
                  <div className="mt-4 bg-amber-400 text-amber-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Peringatan: Stok Menipis — Segera belanja ke pemasok</span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      DETAIL ANALISIS PRODUK
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                      {selectedProduct.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200/80">
                      Satuan: {selectedProduct.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedProduct)}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductToDelete(selectedProduct)}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      title="Hapus produk"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Harga Beli dari Supplier:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      Rp{(selectedProduct.cost_price || 0).toLocaleString('id-ID')} / {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Harga Jual ke Pembeli:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      Rp{(selectedProduct.selling_price || 0).toLocaleString('id-ID')} / {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Untung per Satuan:</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                      Rp{((selectedProduct.selling_price || 0) - (selectedProduct.cost_price || 0)).toLocaleString('id-ID')} / {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Persentase Untung:</span>
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-md border ${selectedProduct.margin_percentage >= threshold
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
                      className={`font-black px-2.5 py-0.5 rounded-md text-xs ${selectedProduct.is_stock_low
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                    >
                      {selectedProduct.remaining_stock ?? 10} {selectedProduct.unit}
                      {selectedProduct.is_stock_low ? ' (Perlu Belanja Stok)' : ' (Aman)'}
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
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Produk Dipilih</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Pilih produk di sebelah kiri atau tambah barang baru untuk melihat estimasi untung rugi dan saran bisnis cerdas dari AI.
            </p>
          </div>
        )}
      </div>

      {/* Studio Promosi Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        productName={selectedProduct?.name || products[0]?.name || 'Bawang Merah Brebes'}
        price={selectedProduct?.selling_price || products[0]?.selling_price || 40000}
        unit={selectedProduct?.unit || products[0]?.unit || 'kg'}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
    </div>
  );
}
