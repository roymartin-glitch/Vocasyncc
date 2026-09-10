'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';
import { TransactionType } from '@/types';
import { findSimilarProduct } from '@/lib/calculations/financial';

export default function CatatPage() {
  const router = useRouter();

  // Form states (for manual fallback)
  const [type, setType] = useState<TransactionType>('income');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<string>('5');
  const [unit, setUnit] = useState('kg');
  const [totalAmount, setTotalAmount] = useState<string>('200000');
  const [rawVoiceText, setRawVoiceText] = useState<string | null>(null);
  const [source, setSource] = useState<'manual' | 'voice'>('manual');

  // Voice recording & hands-free auto-save states
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSavedInfo, setAutoSavedInfo] = useState<{
    productName: string;
    quantity: number;
    unit: string;
    totalAmount: number;
    type: string;
    isNewProduct?: boolean;
  } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 1-Tap Similar Product Confirmation Modal
  const [similarityPrompt, setSimilarityPrompt] = useState<{
    isOpen: boolean;
    candidateName: string;
    existingProduct: { id: string; name: string };
    parsedData: any;
    rawVoiceText: string;
  } | null>(null);

  // Autocomplete suggestions
  const [productsList, setProductsList] = useState<any[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch products from database
  useEffect(() => {
    fetch('/api/product-analysis')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setProductsList(data.data);
        }
      })
      .catch((err) => console.warn('Product list fallback:', err));
  }, []);

  const handleProductChange = (val: string) => {
    setProductName(val);
    if (val.trim()) {
      const matches = productsList.filter((p) =>
        p.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredProducts(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectProduct = (name: string, defaultUnit: string, price: number) => {
    setProductName(name);
    setUnit(defaultUnit || 'kg');
    setShowSuggestions(false);
    const qty = parseFloat(quantity) || 1;
    setTotalAmount((qty * price).toString());
  };

  // Save transaction executor (supports auto-creating products & opening stock batches)
  const executeSaveTransaction = async (
    finalProductName: string,
    d: any,
    transcript: string,
    forceNew: boolean = false
  ) => {
    setIsAutoSaving(true);
    try {
      const saveRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: d.type || 'income',
          productName: finalProductName,
          quantity: d.quantity || 1,
          unit: d.unit || 'kg',
          totalAmount: d.total_price || 0,
          source: 'voice',
          rawVoiceText: transcript,
        }),
      });

      const saveResult = await saveRes.json();
      if (saveResult.success) {
        const isNew = Boolean(saveResult.data?.isNewProduct || forceNew);
        setAutoSavedInfo({
          productName: finalProductName,
          quantity: d.quantity || 1,
          unit: d.unit || 'kg',
          totalAmount: d.total_price || 0,
          type: d.type || 'income',
          isNewProduct: isNew,
        });
        setShowSuccessToast(true);

        // Background update product list so next transactions recognize it
        fetch('/api/product-analysis')
          .then((r) => r.json())
          .then((pData) => {
            if (pData.success && pData.data?.length > 0) {
              setProductsList(pData.data);
            }
          })
          .catch(() => {});

        // Redirect after brief confirmation
        setTimeout(() => {
          router.push(isNew ? '/produk' : '/dashboard');
        }, 1900);
      } else {
        alert(saveResult.error || 'Gagal menyimpan transaksi.');
      }
    } catch (saveErr) {
      console.error('Error executing save transaction:', saveErr);
      alert('Terjadi kesalahan saat menyimpan transaksi ke database.');
    } finally {
      setIsAutoSaving(false);
    }
  };

  // HANDS-FREE VOICE PIPELINE: Parse via Gemini -> Similarity Check -> Auto-Save
  const processVoiceWithGeminiAndAutoSave = async (transcript: string) => {
    setIsProcessingVoice(true);
    setRawVoiceText(`"${transcript}"`);

    try {
      // Step 1: Gemini 3.6 Flash parsing
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setType(d.type || 'income');
        setProductName(d.product_name);
        setQuantity(d.quantity?.toString() || '1');
        setUnit(d.unit || 'kg');
        setTotalAmount(d.total_price?.toString() || '0');
        setSource('voice');

        setIsProcessingVoice(false);

        // Step 2: Cek kemiripan produk dengan master data yang sudah ada
        const simCheck = findSimilarProduct(d.product_name, productsList);

        // KASUS A: Nama mirip tetapi tidak persis sama -> Tampilkan konfirmasi 1 ketukan!
        if (simCheck.isSimilar && simCheck.matchedProduct) {
          setSimilarityPrompt({
            isOpen: true,
            candidateName: d.product_name,
            existingProduct: simCheck.matchedProduct,
            parsedData: d,
            rawVoiceText: transcript,
          });
          return;
        }

        // KASUS B: Nama persis sama (sudah ada) -> Simpan otomatis langsung
        if (simCheck.isExact && simCheck.matchedProduct) {
          await executeSaveTransaction(
            simCheck.matchedProduct.name,
            d,
            transcript,
            false
          );
          return;
        }

        // KASUS C: Produk baru (belum pernah ada sama sekali) -> Otomatis buat produk & simpan instan!
        await executeSaveTransaction(d.product_name, d, transcript, true);
      }
    } catch (err) {
      console.error('Error in voice auto-save flow:', err);
      alert('Gagal memproses suara. Silakan coba kembali.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Web Speech API
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Web Speech API langsung. Anda dapat mencoba tombol Preset Suara di bawah.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setRawVoiceText('Mendengarkan suara Anda...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        processVoiceWithGeminiAndAutoSave(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setRawVoiceText('Tidak ada suara terdeteksi. Silakan coba bicara lebih dekat dengan mikrofon.');
        } else if (event.error === 'not-allowed') {
          setRawVoiceText('Izin akses mikrofon ditolak di browser. Harap izinkan akses mikrofon.');
        } else if (event.error !== 'aborted') {
          console.warn('Speech event info:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Submit manual form (requires manual click)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity || !totalAmount) {
      alert('Harap lengkapi semua kolom transaksi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productName,
          quantity: parseFloat(quantity),
          unit,
          totalAmount: parseFloat(totalAmount),
          source: 'manual',
          rawVoiceText: null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setShowSuccessToast(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        alert(result.error || 'Gagal menyimpan transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <span className="text-xs text-slate-400 font-medium">Pencatatan Otomatis Hands-Free</span>
      </div>

      {/* Hands-free Auto-Saved Notification */}
      {showSuccessToast && autoSavedInfo && (
        <div className="bg-emerald-800 text-white p-5 rounded-3xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-600">
          <div className="flex items-center gap-2.5">
            {autoSavedInfo.isNewProduct ? (
              <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce" />
            ) : (
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce" />
            )}
            <h4 className="font-extrabold text-sm tracking-tight">
              {autoSavedInfo.isNewProduct
                ? 'Produk Baru Otomatis Terbentuk & Tersimpan!'
                : 'Otomatis Tersimpan ke Supabase Tanpa Klik!'}
            </h4>
          </div>

          {autoSavedInfo.isNewProduct && (
            <p className="text-xs text-emerald-100 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/60 leading-relaxed">
              Pak Roy tidak perlu repot setup tabel produk. Produk <strong>{autoSavedInfo.productName}</strong> langsung masuk ke <strong>Produk Saya</strong> dan batch stoknya telah otomatis aktif!
            </p>
          )}

          <div className="bg-emerald-950/50 p-3 rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm">{autoSavedInfo.productName}</span>
              <span className="text-emerald-200 ml-2">
                ({autoSavedInfo.quantity} {autoSavedInfo.unit})
              </span>
            </div>
            <span className="font-black text-amber-300 text-sm">
              {autoSavedInfo.type === 'income' ? '+' : '-'}Rp
              {autoSavedInfo.totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>
              {autoSavedInfo.isNewProduct
                ? 'Mengalihkan ke halaman Produk Saya...'
                : 'Mengalihkan kembali ke Beranda untuk melihat pembaruan margin...'}
            </span>
          </p>
        </div>
      )}

      {/* MODAL KONFIRMASI SATU KETUKAN: APAKAH INI PRODUK YANG SAMA? */}
      {similarityPrompt?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <div className="inline-flex p-3 bg-amber-100 text-amber-800 rounded-2xl">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Apakah ini produk yang sama?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda menyebutkan <strong className="text-slate-900">&quot;{similarityPrompt.candidateName}&quot;</strong>. Sistem mendeteksi nama ini mirip dengan produk yang sudah ada di toko Anda:
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Opsi 1: Pakai produk yang sudah ada (Satu Ketukan) */}
              <button
                type="button"
                onClick={() => {
                  const { existingProduct, parsedData, rawVoiceText } = similarityPrompt;
                  setSimilarityPrompt(null);
                  executeSaveTransaction(existingProduct.name, parsedData, rawVoiceText, false);
                }}
                className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-500/80 text-left transition-all group cursor-pointer shadow-xs active:scale-98 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="text-xs font-black text-emerald-900 group-hover:text-emerald-950">
                      {similarityPrompt.existingProduct.name}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Gunakan produk yang sudah ada di toko
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-200/70 px-2.5 py-1 rounded-xl">
                  Sudah Ada
                </span>
              </button>

              {/* Opsi 2: Buat produk baru terpisah (Satu Ketukan) */}
              <button
                type="button"
                onClick={() => {
                  const { candidateName, parsedData, rawVoiceText } = similarityPrompt;
                  setSimilarityPrompt(null);
                  executeSaveTransaction(candidateName, parsedData, rawVoiceText, true);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300/80 text-left transition-all group cursor-pointer shadow-2xs active:scale-98 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">➕</span>
                  <div>
                    <div className="text-xs font-black text-slate-800 group-hover:text-slate-900">
                      {similarityPrompt.candidateName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Simpan sebagai produk baru terpisah
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-xl">
                  Produk Baru
                </span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setSimilarityPrompt(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Batal & ulangi bicara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catat Transaksi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Bicara natural → AI Gemini mem-parsing → <strong>Otomatis tersimpan instan</strong> tanpa perlu menekan tombol simpan.
          </p>
        </div>

        {/* 1. Voice Recognition Section (HANDS-FREE AUTO-SAVE) */}
        <div className="bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white border-2 border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
          {/* Badge Hands-free */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Fitur Suara: Otomatis Simpan Instan</span>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={startSpeechRecognition}
              disabled={isProcessingVoice || isAutoSaving}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white scale-110 shadow-rose-200 animate-pulse'
                  : isProcessingVoice || isAutoSaving
                  ? 'bg-amber-600 text-white animate-spin shadow-amber-200'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-105 active:scale-95 shadow-emerald-200'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10" />
              ) : isProcessingVoice || isAutoSaving ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">
              {isListening
                ? 'Mendengarkan suara Anda... Katakan transaksi Anda.'
                : isProcessingVoice
                ? 'Gemini 3.6 Flash sedang mem-parsing suara...'
                : isAutoSaving
                ? 'Menyimpan langsung ke database...'
                : 'Tekan mikrofon & bicara (Langsung tersimpan)'}
            </p>
            <p className="text-xs text-slate-500">
              Cukup sebutkan dagangan, jumlah, dan uangnya. Contoh: <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">&quot;Jual bawang merah 5 kg dapat 200 ribu&quot;</span>
            </p>
          </div>

          {/* Quick Presets for Demo */}
          <div className="pt-3 border-t border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Contoh Percakapan Transaksi Cepat:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {/* Preset 1: Beli Kangkung (Produk Baru Otomatis) */}
              <button
                type="button"
                disabled={isProcessingVoice || isAutoSaving}
                onClick={() =>
                  processVoiceWithGeminiAndAutoSave('Beli kangkung 10 kg bayar 100 ribu')
                }
                className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>&quot;Beli kangkung 10 kg bayar 100 ribu&quot; (Produk Baru)</span>
              </button>

              {/* Preset 2: Beli Bawang Merah Brebes (Nama Mirip -> Konfirmasi 1 Ketukan) */}
              <button
                type="button"
                disabled={isProcessingVoice || isAutoSaving}
                onClick={() =>
                  processVoiceWithGeminiAndAutoSave('Beli bawang merah brebes 5 kg bayar 150 ribu')
                }
                className="text-[11px] bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-bold border border-amber-300/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3 h-3 text-amber-600" />
                <span>&quot;Beli bawang merah brebes 5 kg bayar 150 ribu&quot; (Uji Nama Mirip)</span>
              </button>

              {/* Preset 3: Jual Bawang Merah (Transaksi Normal) */}
              <button
                type="button"
                disabled={isProcessingVoice || isAutoSaving}
                onClick={() =>
                  processVoiceWithGeminiAndAutoSave('Jual bawang merah 5 kg dapat 200 ribu')
                }
                className="text-[11px] bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              >
                &quot;Jual bawang merah 5 kg dapat 200 ribu&quot;
              </button>

              {/* Preset 4: Kulakan Cabai Rawit */}
              <button
                type="button"
                disabled={isProcessingVoice || isAutoSaving}
                onClick={() =>
                  processVoiceWithGeminiAndAutoSave('Beli cabai rawit merah 10 kilo modal 450 ribu')
                }
                className="text-[11px] bg-rose-50 hover:bg-rose-100/80 text-rose-900 font-bold border border-rose-300/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              >
                &quot;Beli cabai rawit 10 kg modal 450 ribu&quot;
              </button>
            </div>
          </div>

          {rawVoiceText && (
            <div className="bg-white border border-emerald-300 p-3 rounded-2xl text-left text-xs space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 tracking-wider">
                Transkrip Terdeteksi:
              </span>
              <p className="text-slate-800 font-bold italic pt-1">{rawVoiceText}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400 absolute">
            atau formulir manual (Klik Simpan Manual)
          </span>
        </div>

        {/* 2. Manual Form */}
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Segmented Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran (Beli Modal)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Pemasukan (Jual Dagangan)</span>
              </button>
            </div>
          </div>

          {/* Product Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Produk / Bahan Baku
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => handleProductChange(e.target.value)}
              placeholder="Ketik nama dagangan (mis: Bawang Merah, Cabai)..."
              required
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-emerald-600 transition-all font-medium text-slate-900"
            />

            {showSuggestions && filteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      handleSelectProduct(
                        p.name,
                        p.unit || 'kg',
                        type === 'expense' ? p.cost_price || 30000 : p.selling_price || 40000
                      )
                    }
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="text-slate-400 ml-2">({p.unit || 'kg'})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jumlah</label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="mis: 5"
                required
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-emerald-600 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-emerald-600 transition-all font-medium text-slate-900 cursor-pointer"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="ikat">Ikat</option>
                <option value="pcs">Pcs / Buah</option>
                <option value="karung">Karung</option>
                <option value="liter">Liter</option>
                <option value="bungkus">Bungkus</option>
              </select>
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Total Uang (Nominal Bayar / Diterima)</span>
              {quantity && totalAmount && parseFloat(quantity) > 0 ? (
                <span className="text-slate-400 font-normal">
                  Rata-rata: Rp
                  {(parseFloat(totalAmount) / parseFloat(quantity)).toLocaleString('id-ID', {
                    maximumFractionDigits: 0,
                  })}
                  /{unit}
                </span>
              ) : null}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min="100"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="200000"
                required
                className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:bg-white focus:outline-emerald-600 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Manual Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Transaksi Manual</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-white/60 border border-slate-200/60 rounded-2xl text-xs text-slate-500">
        <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p>
          Fitur suara langsung menyimpan transaksi otomatis ke database Supabase agar pedagang tidak perlu mengetik atau menyentuh layar saat tangan sedang sibuk.
        </p>
      </div>
    </div>
  );
}
