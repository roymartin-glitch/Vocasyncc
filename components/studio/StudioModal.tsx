'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Download,
  Wand2,
  RefreshCw,
  ChevronRight,
  MessageCircle,
  Loader2,
} from 'lucide-react';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export function StudioModal({
  isOpen,
  onClose,
  productName = 'Bawang Merah Brebes',
}: StudioModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFrame, setSelectedFrame] = useState<'pasar' | 'minimalis' | 'kriya'>('pasar');
  const [copyStyle, setCopyStyle] = useState<'pasar' | 'fomo' | 'elegan'>('pasar');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promoText, setPromoText] = useState(
    `PROMO SPESIAL KIOS BERKAH\n\n${productName} pilihan kualitas super, kering, wangi, dan segar langsung dari petani!\n\nHarga promo spesial hari ini: Rp42.000/kg (Beli 3kg gratis antar area Pasar Minggu).\n\nPesan sekarang via WhatsApp sebelum kehabisan stok!`
  );

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      simulateBackgroundRemoval();
    }
  };

  const simulateBackgroundRemoval = () => {
    setIsRemovingBg(true);
    setTimeout(() => {
      setIsRemovingBg(false);
      setStep(2);
    }, 1200);
  };

  const handleCopyStyleChange = async (style: 'pasar' | 'fomo' | 'elegan') => {
    setCopyStyle(style);
    setIsGeneratingCopy(true);

    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          storeName: 'Kios Berkah Sayur',
          style,
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setPromoText(data.text);
      }
    } catch (e) {
      console.warn('Fallback copywriting on network error:', e);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promoText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWA = () => {
    const encoded = encodeURIComponent(promoText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Virtual Studio & WhatsApp Marketing</h3>
              <p className="text-xs text-slate-500">Background removal client-side & copywriting Gemini 3.6 Flash</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
            <div className={`flex items-center gap-1.5 font-bold ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
              <span>Foto Produk</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 font-bold ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">2</span>
              <span>Studio Frame</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 font-bold ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">3</span>
              <span>Kirim WhatsApp</span>
            </div>
          </div>

          {/* Context */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center gap-3 text-emerald-950">
            <Wand2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              Target Kampanye: <strong>{productName}</strong>. Promosi visual profesional akan memulihkan penjualan produk ini ke pelanggan langganan.
            </span>
          </div>

          {/* Visual Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Visual Studio Mockup Canvas</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto Asli</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div
              className={`relative aspect-video rounded-3xl overflow-hidden p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${
                selectedFrame === 'pasar'
                  ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white'
                  : selectedFrame === 'minimalis'
                  ? 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 border-4 border-slate-300'
                  : 'bg-gradient-to-br from-amber-800 via-orange-900 to-stone-900 text-amber-50'
              }`}
            >
              {/* Studio Frame Overlay Graphic */}
              <div
                className={`absolute inset-3 border-2 rounded-2xl pointer-events-none flex flex-col justify-between p-3.5 ${
                  selectedFrame === 'minimalis'
                    ? 'border-slate-400/40'
                    : 'border-emerald-300/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-xs ${
                      selectedFrame === 'minimalis'
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-950/80 text-emerald-200'
                    }`}
                  >
                    KIOS BERKAH • PASAR TRADISIONAL
                  </span>
                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md shadow-xs">
                    GARANSI SEGAR
                  </span>
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold opacity-80">Pesanan WA: 0812-XXXX-XXXX</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Kualitas Pilihan
                  </span>
                </div>
              </div>

              {/* Product Image */}
              {isRemovingBg ? (
                <div className="flex flex-col items-center gap-2 py-8 animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="font-bold text-xs">AI sedang memproses Background Removal di browser Anda...</p>
                </div>
              ) : (
                <div className="space-y-2 z-10">
                  <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-xl border border-white/30">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Product"
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-white/80" />
                    )}
                  </div>
                  <h4 className="text-2xl font-black tracking-tight">{productName}</h4>
                  <p className="text-xs opacity-90 max-w-sm mx-auto">
                    Kualitas Super • Langsung Petani • Garansi Segar
                  </p>
                </div>
              )}
            </div>

            {/* Frame Choice */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-slate-500">Pilih Template Frame Studio:</span>
              <div className="flex gap-2">
                {[
                  { id: 'pasar', label: 'Pasar Tradisional' },
                  { id: 'minimalis', label: 'Minimalis Elegan' },
                  { id: 'kriya', label: 'Kuliner & Kriya' },
                ].map((fr) => (
                  <button
                    key={fr.id}
                    type="button"
                    onClick={() => setSelectedFrame(fr.id as any)}
                    className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                      selectedFrame === fr.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {fr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copywriting Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pesan Promosi WhatsApp (Gemini 3.6 Flash)</span>
              </label>

              {/* Tone style toggles */}
              <div className="flex gap-1.5">
                {[
                  { id: 'pasar', label: 'Ramah Pasar' },
                  { id: 'fomo', label: 'Promo Kilat' },
                  { id: 'elegan', label: 'Resmi/Kualitas' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isGeneratingCopy}
                    onClick={() => handleCopyStyleChange(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      copyStyle === s.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                disabled={isGeneratingCopy}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:bg-white focus:outline-emerald-600 transition-all leading-relaxed font-medium"
              />
              {isGeneratingCopy && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Gemini 3.6 Flash sedang menyusun copywriting...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                <span>{isCopied ? 'Teks Tersalin!' : 'Salin Teks ke Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('Foto studio disimpan ke galeri perangkat Anda.')}
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Foto</span>
            </button>

            <button
              type="button"
              onClick={handleSendWA}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim via WhatsApp Direct</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
