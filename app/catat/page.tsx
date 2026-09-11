'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  Volume2,
  Sparkles,
  Clock,
  Check,
  Package,
} from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';
import { TransactionType } from '@/types';
import { findSimilarProduct } from '@/lib/calculations/financial';

/**
 * Pembersih cerdas untuk mengatasi bug akumulasi dan pengulangan suara pada Web Speech API
 * Contoh: "saya beli kangkung saya beli kangkung" -> "saya beli kangkung"
 * Contoh: "beli kangkung 10 ikat beli kangkung 10 ikat" -> "beli kangkung 10 ikat"
 */
function cleanRepeatedVoicePhrases(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Pangkas pengulangan 2 sampai 6 kata yang berulang berurutan
  for (let n = 6; n >= 2; n--) {
    const regex = new RegExp(`\\b((?:[a-zA-Z0-9가-힣]+\\s+){${n - 1}}[a-zA-Z0-9가-힣]+)\\s+\\1\\b`, 'gi');
    cleaned = cleaned.replace(regex, '$1');
  }

  // 2. Pangkas kata tunggal yang berulang langsung (misal: "kangkung kangkung" -> "kangkung")
  cleaned = cleaned.replace(/\b([a-zA-Z0-9]+)\s+\1\b/gi, '$1');

  // 3. Deteksi pengulangan paruh kalimat yang persis sama
  const words = cleaned.split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(' ').toLowerCase();
    const secondHalf = words.slice(half).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      cleaned = words.slice(0, half).join(' ');
    }
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export default function CatatPage() {
  const router = useRouter();

  // Form states (for manual fallback)
  const [type, setType] = useState<TransactionType>('income');
  const [productName, setProductName] = useState('Bawang Merah');
  const [quantity, setQuantity] = useState<number>(5);
  const [unit, setUnit] = useState('Kilogram (kg)');
  const [totalAmount, setTotalAmount] = useState<number>(200000);

  // Voice recording & patient auto-save states
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawVoiceText, setRawVoiceText] = useState<string | null>(null);
  const [collectedTranscript, setCollectedTranscript] = useState<string>('');
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedRef = useRef<string>('');

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

  // Voice Review & Confirmation Modal
  const [voiceConfirmation, setVoiceConfirmation] = useState<{
    isOpen: boolean;
    data: any;
    transcript: string;
    isSimilar?: boolean;
    existingProduct?: any;
  } | null>(null);

  // Products list for fuzzy matching
  const [productsList, setProductsList] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('vokasync_is_demo') === 'true') {
      return mockProducts;
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('vokasync_products_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.data)) {
            setProductsList(parsed.data);
          }
        }
      } catch (_) {}
    }

    fetch('/api/product-analysis')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProductsList(data.data);
        }
      })
      .catch((err) => console.warn('Product list fallback:', err));

    return () => {
      clearSilenceTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  };

  const speakConfirmation = (
    product: string,
    qty: number,
    unitName: string,
    amount: number,
    isIncome: boolean,
    isNewProduct = false
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const isSoundActive = localStorage.getItem('vokasync_sound_alert') !== 'false';
    if (!isSoundActive) return;

    try {
      window.speechSynthesis.cancel();
      const actionWord = isIncome ? 'Jual' : 'Beli';
      const cleanUnit = unitName.replace(/\s*\(.*\)/, '');
      const newProdSentence = isNewProduct
        ? ` dan barang baru ${product} sudah otomatis masuk ke daftar barang Anda`
        : '';
      const textToSpeak = `Catatan ${actionWord} ${product} ${qty} ${cleanUnit} sebesar ${amount.toLocaleString('id-ID')} rupiah sudah tersimpan ya${newProdSentence}.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis confirmation info:', e);
    }
  };

  // Save transaction executor
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
        const isNew = Boolean(saveResult.data?.is_new_product);
        setAutoSavedInfo({
          productName: finalProductName,
          quantity: d.quantity || 1,
          unit: d.unit || 'kg',
          totalAmount: d.total_price || 0,
          type: d.type || 'income',
          isNewProduct: isNew,
        });
        setShowSuccessToast(true);

        // Clear session caches and save to local transactions to guarantee instant fresh data across all tabs
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            if (saveResult.data) {
              const currentLocal = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
              const txWithUser = { ...saveResult.data, user_id: userKey };
              currentLocal.unshift(txWithUser);
              localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(currentLocal.slice(0, 100)));
            }
            // Selalu simpan atau perbarui data produk agar barang baru dari voice langsung ada di halaman Barang
            const isExpense = (d.type || 'income') === 'expense';
            const totalP = Number(d.total_price) || 0;
            const qNum = Number(d.quantity) || 1;
            const uPrice = Math.round(totalP / (qNum || 1));

            const effectiveProduct = saveResult.product || {
              id: saveResult.productId || 'prod-' + Date.now(),
              user_id: userKey,
              name: finalProductName,
              unit: d.unit || 'kg',
              cost_price: isExpense ? uPrice : Math.round(uPrice * 0.8),
              selling_price: !isExpense ? uPrice : Math.round(uPrice * 1.25),
              margin_percentage: 20,
              action_category: 'dorong',
              avg_daily_volume: qNum,
              total_revenue_7d: totalP,
              remaining_stock: qNum,
              is_stock_low: false,
            };

            const currentProds = JSON.parse(localStorage.getItem(`vokasync_products_${userKey}`) || '[]');
            const pIdx = currentProds.findIndex(
              (p: any) =>
                p.id === effectiveProduct.id ||
                p.name.toLowerCase() === effectiveProduct.name.toLowerCase()
            );
            if (pIdx !== -1) {
              const prev = currentProds[pIdx];
              currentProds[pIdx] = {
                ...prev,
                ...effectiveProduct,
                remaining_stock: isExpense
                  ? (prev.remaining_stock || 0) + qNum
                  : Math.max(0, (prev.remaining_stock || 0) - qNum),
              };
            } else {
              currentProds.unshift(effectiveProduct);
            }
            localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(currentProds));

            sessionStorage.removeItem(`vokasync_products_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
            sessionStorage.removeItem('vokasync_products_cache');
            sessionStorage.removeItem('vokasync_dash_cache');
            sessionStorage.removeItem('vokasync_laporan_cache');
            sessionStorage.removeItem('vokasync_tx_cache');
          } catch (_) {}
        }

        // Suara balasan asisten berbicara ramah kepada pedagang
        speakConfirmation(
          finalProductName,
          d.quantity || 1,
          d.unit || 'kg',
          d.total_price || 0,
          (d.type || 'income') === 'income',
          isNew
        );

        // Beri jeda 3.5 detik agar lansia sempat mendengar suara balasan dan membaca konfirmasi dengan tenang
        setTimeout(() => {
          router.push('/dashboard');
        }, 3500);
      } else {
        alert(saveResult.error || 'Gagal menyimpan transaksi.');
      }
    } catch (saveErr) {
      console.error('Error executing save transaction:', saveErr);
      alert('Terjadi kesalahan saat menyimpan catatan.');
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Process voice calmly
  const processVoiceAndSave = async (transcript: string) => {
    clearSilenceTimers();
    setIsListening(false);
    setIsProcessingVoice(true);

    const cleanTranscript = cleanRepeatedVoicePhrases(transcript);
    setRawVoiceText(`"${cleanTranscript}"`);

    try {
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: cleanTranscript }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setType(d.type || 'income');
        setProductName(d.product_name);
        setQuantity(d.quantity || 1);
        setTotalAmount(d.total_price || 0);

        setIsProcessingVoice(false);

        const simCheck = findSimilarProduct(d.product_name, productsList);

        setVoiceConfirmation({
          isOpen: true,
          data: d,
          transcript: cleanTranscript,
          isSimilar: simCheck.isSimilar || simCheck.isExact,
          existingProduct: simCheck.matchedProduct || null,
        });
      } else {
        alert('Kalimat belum jelas. Silakan ucapkan dengan santai, contoh: "Beli kangkung 10 ikat 20 ribu"');
      }
    } catch (err) {
      console.error('Error processing voice:', err);
      alert('Gagal memproses suara. Silakan coba bicara kembali.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Start voice recognition with patient pause-handling
  const startListening = () => {
    clearSilenceTimers();
    accumulatedRef.current = '';
    setCollectedTranscript('');
    setRawVoiceText(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser HP Anda belum mendukung suara langsung. Silakan gunakan formulir manual di bawah.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'id-ID';
      recognition.continuous = true; // Biarkan mendengarkan lebih lama tanpa terputus cepat
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setRawVoiceText('Mendengarkan... Silakan bicara dengan santai');
      };

      recognition.onresult = (event: any) => {
        clearSilenceTimers();
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        const combinedRaw = (finalStr + ' ' + interimStr).trim();
        const cleanedText = cleanRepeatedVoicePhrases(combinedRaw);

        if (cleanedText) {
          accumulatedRef.current = cleanRepeatedVoicePhrases(finalStr).trim();
          setCollectedTranscript(cleanedText);
          setRawVoiceText(`"${cleanedText}"`);

          // Jeda santai: Berikan waktu 3 detik setelah ucapan terakhir sebelum menyarankan simpan
          startGentleSilenceTimer(cleanedText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech event info:', event.error);
        if (event.error === 'no-speech') {
          // Jangan hentikan terburu-buru, beri kesempatan pedagang bersiap
          setRawVoiceText('Silakan bicara... kami masih mendengarkan dengan santai');
        } else if (event.error === 'not-allowed') {
          setRawVoiceText('Izin mikrofon belum aktif di HP Anda.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Jika recognition terhenti secara otomatis tapi pengguna belum selesai, jangan buru-buru tutup
        const current = cleanRepeatedVoicePhrases(accumulatedRef.current || collectedTranscript).trim();
        if (current.length > 2) {
          startGentleSilenceTimer(current);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech start error:', e);
      setIsListening(false);
    }
  };

  // Timer santai dengan hitungan mundur jelas
  const startGentleSilenceTimer = (text: string) => {
    clearSilenceTimers();
    let secondsLeft = 3;
    setSilenceCountdown(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setSilenceCountdown(secondsLeft);
      } else {
        clearSilenceTimers();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
        processVoiceAndSave(text);
      }
    }, 1000);
  };

  // Stop manually when user is ready
  const finishAndSaveNow = () => {
    clearSilenceTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    const raw = collectedTranscript.trim() || accumulatedRef.current.trim();
    const text = cleanRepeatedVoicePhrases(raw);
    if (text && text.length > 2) {
      processVoiceAndSave(text);
    } else {
      alert('Belum ada ucapan yang terdengar. Silakan tekan tombol mic dan bicara santai.');
    }
  };

  const cancelListening = () => {
    clearSilenceTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setCollectedTranscript('');
    setRawVoiceText(null);
  };

  // Manual Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity || !totalAmount) {
      alert('Harap lengkapi nama barang, jumlah, dan nominal uang.');
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
          quantity,
          unit: unit.replace(/\s*\(.*\)/, ''),
          totalAmount,
          source: 'manual',
        }),
      });

      const result = await res.json();
      if (result.success) {
        setShowSuccessToast(true);
        speakConfirmation(productName, quantity, unit, totalAmount, type === 'income');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Navigation Back Pill */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full border-2 border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Catat Transaksi
        </h1>
        <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1.5 leading-relaxed">
          Setiap kali Anda menjual atau belanja, catat di sini supaya untung Anda selalu terpantau.
        </p>
      </div>

      {/* Calm Success Notification */}
      {showSuccessToast && autoSavedInfo && (
        <div className="bg-[#00875A] text-white p-6 rounded-3xl shadow-xl space-y-2 animate-in fade-in slide-in-from-top-4 duration-300 border-2 border-[#00744D]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 flex-shrink-0 text-white" />
            <div>
              <h4 className="font-black text-lg">Catatan Berhasil Disimpan!</h4>
              <p className="text-sm text-emerald-100 font-semibold">
                {autoSavedInfo.productName} ({autoSavedInfo.quantity} {autoSavedInfo.unit}) •{' '}
                {autoSavedInfo.type === 'income' ? '+' : '-'}Rp{autoSavedInfo.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          {autoSavedInfo.isNewProduct && (
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-black text-white border border-emerald-400/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Barang baru &apos;{autoSavedInfo.productName}&apos; otomatis ditambahkan ke daftar Barang Toko</span>
            </div>
          )}
          <p className="text-xs text-emerald-200 pt-1 font-medium">
            Membuka kembali Beranda untuk melihat pembaruan kas...
          </p>
        </div>
      )}

      {/* 1-Tap Similar Product Confirmation Modal */}
      {similarityPrompt?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5">
            <div className="space-y-2 text-center">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                <HelpCircle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Apakah barang ini sama?
              </h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                Anda menyebutkan &quot;{similarityPrompt.candidateName}&quot;. Apakah ini sama dengan:
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const { existingProduct, parsedData, rawVoiceText } = similarityPrompt;
                  setSimilarityPrompt(null);
                  executeSaveTransaction(existingProduct.name, parsedData, rawVoiceText, false);
                }}
                className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-base font-black text-emerald-950">
                    {similarityPrompt.existingProduct.name}
                  </div>
                  <div className="text-xs text-emerald-700 font-bold">
                    Ya, gunakan barang yang sudah ada
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-200 px-3 py-1 rounded-xl">
                  Sudah Ada
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const { candidateName, parsedData, rawVoiceText } = similarityPrompt;
                  setSimilarityPrompt(null);
                  executeSaveTransaction(candidateName, parsedData, rawVoiceText, true);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-base font-black text-slate-800">
                    {similarityPrompt.candidateName}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    Bukan, simpan sebagai barang baru
                  </div>
                </div>
                <span className="text-xs font-black text-slate-600 bg-slate-200 px-3 py-1 rounded-xl">
                  Barang Baru
                </span>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setSimilarityPrompt(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Review & Confirmation Modal */}
      {voiceConfirmation?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5">
            <div className="space-y-1.5 text-center">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                <Sparkles className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Konfirmasi Hasil Suara
              </h3>
              <p className="text-xs text-slate-500 font-semibold italic">
                &quot;{voiceConfirmation.transcript}&quot;
              </p>
            </div>

            {/* Detected Card */}
            <div className="bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-200">
                <span>Jenis Transaksi</span>
                <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                  voiceConfirmation.data.type === 'expense'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {voiceConfirmation.data.type === 'expense' ? 'Belanja Modal Stok (Uang Keluar)' : 'Penjualan (Uang Masuk)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Barang Dagangan</span>
                <span className="text-sm font-black text-slate-900">
                  {voiceConfirmation.data.product_name}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Jumlah</span>
                <span className="text-sm font-black text-slate-800">
                  {voiceConfirmation.data.quantity} {voiceConfirmation.data.unit || 'kg'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-200">
                <span>Total Nominal</span>
                <span className="text-base font-black text-emerald-800">
                  Rp{(voiceConfirmation.data.total_price || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {voiceConfirmation.isSimilar && voiceConfirmation.existingProduct && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Cocok dengan barang di kios: <strong>{voiceConfirmation.existingProduct.name}</strong></span>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const finalName = voiceConfirmation.isSimilar && voiceConfirmation.existingProduct
                    ? voiceConfirmation.existingProduct.name
                    : voiceConfirmation.data.product_name;
                  const isNew = !(voiceConfirmation.isSimilar && voiceConfirmation.existingProduct);
                  const { data, transcript } = voiceConfirmation;
                  setVoiceConfirmation(null);
                  executeSaveTransaction(finalName, data, transcript, isNew);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#00875A] hover:bg-[#059669] text-white font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Simpan ke Catatan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVoiceConfirmation(null);
                  // Focus manual form so merchant can edit freely
                  const el = document.getElementById('manual-product-name');
                  if (el) el.focus();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer"
              >
                ✏️ Perbaiki / Edit Terlebih Dahulu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALM & PATIENT VOICE CARD */}
      <div className="bg-[#EAF7ED] border-2 border-[#C7EED0] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xs">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#00875A] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-2xs">
          <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Cara Termudah</span>
        </div>

        {/* Big Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Cukup Ucapkan, Tidak Perlu Mengetik
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-lg mx-auto leading-relaxed">
            Tekan tombol mic di bawah, lalu bicara santai tanpa terburu-buru. Suara Anda akan didengarkan dengan tenang.
          </p>
        </div>

        {/* Huge Circular Mic Button with Gentle State */}
        <div className="py-2 space-y-3">
          <button
            type="button"
            onClick={isListening ? finishAndSaveNow : startListening}
            disabled={isProcessingVoice || isAutoSaving}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mx-auto shadow-xl transition-all duration-300 cursor-pointer ${
              isListening
                ? 'bg-emerald-600 text-white ring-8 ring-emerald-200 scale-105 animate-pulse'
                : isProcessingVoice || isAutoSaving
                ? 'bg-amber-600 text-white animate-spin'
                : 'bg-[#00875A] hover:bg-[#059669] text-white hover:scale-105 active:scale-95 shadow-emerald-700/25'
            }`}
          >
            {isListening ? (
              <Volume2 className="w-12 h-12 stroke-[2.5]" />
            ) : isProcessingVoice || isAutoSaving ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : (
              <Mic className="w-12 h-12 stroke-[2.5]" />
            )}
          </button>

          <p className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2">
            {isListening ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>Sedang mendengarkan... Bicara dengan santai</span>
              </>
            ) : isProcessingVoice ? (
              'Sedang memahami ucapan Anda...'
            ) : isAutoSaving ? (
              'Menyimpan catatan...'
            ) : (
              'Tekan lalu bicara'
            )}
          </p>

          {/* Transcript Display Box */}
          {rawVoiceText && (
            <div className="bg-white/90 border-2 border-emerald-300 p-3.5 rounded-2xl max-w-md mx-auto shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Yang Didengar:
              </span>
              <p className="text-base font-black text-slate-900 leading-snug">
                {rawVoiceText}
              </p>
              {silenceCountdown !== null && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 pt-1">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>Menyimpan otomatis dalam {silenceCountdown} detik... Atau tekan tombol di bawah jika sudah selesai.</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons while listening (gives full patient control) */}
          {isListening && (
            <div className="flex items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={finishAndSaveNow}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#059669] text-white py-3 px-4 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selesai & Simpan</span>
              </button>
              <button
                type="button"
                onClick={cancelListening}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-2xl font-bold text-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Examples Section */}
        <div className="pt-2 space-y-2.5">
          <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
            CONTOH YANG BISA ANDA UCAPKAN
          </p>

          <div className="space-y-2 max-w-xl mx-auto">
            {[
              'Jual bawang merah 5 kilo dapat 200 ribu',
              'Beli kangkung 10 ikat bayar 100 ribu',
              'Jual cabai rawit 3 kilo dapat 150 ribu',
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => processVoiceAndSave(phrase)}
                className="w-full bg-white hover:bg-emerald-50/70 border-2 border-slate-200/90 hover:border-emerald-500 rounded-2xl py-3 px-5 text-sm sm:text-base font-bold text-slate-800 shadow-2xs transition-all text-center cursor-pointer active:scale-98"
              >
                &ldquo;{phrase}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t-2 border-slate-200" />
        <span className="flex-shrink mx-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">
          Atau isi sendiri
        </span>
        <div className="flex-grow border-t-2 border-slate-200" />
      </div>

      {/* MANUAL FORM CARD */}
      <form
        onSubmit={handleManualSubmit}
        className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* Catatan Apa? */}
        <div className="space-y-3">
          <label className="block text-lg font-black text-slate-900">
            Ini catatan apa?
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-4 px-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-[#00875A] text-white border-2 border-[#00744D] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 stroke-[3]" />
              <span>Uang Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-4 px-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white border-2 border-rose-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 stroke-[3]" />
              <span>Uang Keluar</span>
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {type === 'income'
              ? 'Pilih ini kalau Anda menjual dagangan dan menerima uang.'
              : 'Pilih ini kalau Anda belanja stok barang dagangan atau membayar biaya modal.'}
          </p>
        </div>

        {/* Nama Barang */}
        <div className="space-y-2">
          <label className="block text-lg font-black text-slate-900">
            Nama barang
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Contoh: Bawang Merah"
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-full px-6 py-4 text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#00875A] focus:bg-white outline-hidden transition-all"
            required
          />
        </div>

        {/* Stepper Jumlah & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Berapa Banyak? */}
          <div className="space-y-2">
            <label className="block text-lg font-black text-slate-900">
              Berapa banyak?
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 text-center text-2xl font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden"
              />

              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Satuan */}
          <div className="space-y-2">
            <label className="block text-lg font-black text-slate-900">
              Satuan
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base sm:text-lg font-bold text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden cursor-pointer"
            >
              <option value="Kilogram (kg)">Kilogram (kg)</option>
              <option value="Ikat">Ikat</option>
              <option value="Butir">Butir</option>
              <option value="Liter">Liter</option>
              <option value="Gram (gr)">Gram (gr)</option>
              <option value="Pack">Pack</option>
              <option value="Bungkus">Bungkus</option>
            </select>
          </div>
        </div>

        {/* Uang yang Anda terima / bayar */}
        <div className="space-y-2">
          <label className="block text-lg font-black text-slate-900">
            {type === 'income' ? 'Uang yang Anda terima' : 'Uang yang Anda bayar'}
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-700 pointer-events-none">
              Rp
            </span>
            <input
              type="text"
              value={totalAmount ? totalAmount.toLocaleString('id-ID') : ''}
              onChange={(e) => {
                const numeric = e.target.value.replace(/\D/g, '');
                setTotalAmount(numeric ? parseInt(numeric, 10) : 0);
              }}
              placeholder="0"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-full pl-16 pr-6 py-4 text-xl sm:text-2xl font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden transition-all"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#00875A] hover:bg-[#059669] text-white py-4 px-6 rounded-2xl font-black text-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Catatan</span>
          )}
        </button>
      </form>
    </div>
  );
}
