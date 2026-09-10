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
  initialImage?: string;
  price?: number;
  unit?: string;
  storeName?: string;
  phone?: string;
}

export function StudioModal({
  isOpen,
  onClose,
  productName = 'Bawang Merah Brebes',
  initialImage,
  price = 40000,
  unit = 'kg',
  storeName,
  phone = '0812-3456-7890',
}: StudioModalProps) {
  const effectiveStoreName =
    storeName ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('vokasync_business_name') || 'Toko Saya'
      : 'Toko Saya');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFrame, setSelectedFrame] = useState<'pasar' | 'minimalis' | 'kriya'>('pasar');
  const [copyStyle, setCopyStyle] = useState<'pasar' | 'fomo' | 'elegan'>('pasar');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formattedPrice = `Rp${price.toLocaleString('id-ID')}/${unit}`;

  const [promoText, setPromoText] = useState(
    `🔥 *PROMO SPESIAL ${effectiveStoreName.toUpperCase()}* 🔥\n\n` +
    `Segar langsung dari petani: *${productName}* kualitas super, wangi, dan pilihan!\n\n` +
    `🏷️ *Harga Promo Spesial:* ${formattedPrice}\n` +
    `🛵 *Pesan antar cepat:* Siap kirim langsung ke rumah / warung Anda.\n\n` +
    `Pesan sekarang via WhatsApp sebelum stok habis! 🙏`
  );

  // Update image if initialImage changes
  React.useEffect(() => {
    if (initialImage) {
      setUploadedImage(initialImage);
    }
  }, [initialImage]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      processBackgroundRemoval(file, url);
    }
  };

  // Client-side background removal processing
  const processBackgroundRemoval = async (file: File, fallbackUrl: string) => {
    setIsRemovingBg(true);
    try {
      // Attempt client-side background removal if library loads
      const imgly = await import('@imgly/background-removal');
      const blob = await imgly.removeBackground(file);
      const cleanUrl = URL.createObjectURL(blob);
      setUploadedImage(cleanUrl);
    } catch (err) {
      console.info('Client-side background removal fallback to original photo:', err);
      setUploadedImage(fallbackUrl);
    } finally {
      setIsRemovingBg(false);
      setStep(2);
    }
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
          price,
          unit,
          phone,
          storeName,
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

  // Generate real-time copy with Gemini whenever modal opens with a new product
  React.useEffect(() => {
    if (isOpen) {
      handleCopyStyleChange(copyStyle);
    }
  }, [isOpen, productName, price, unit, storeName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Render high-definition 1080x1080 flyer to HTML5 Canvas
  const drawFlyerToCanvas = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // 1. Draw Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (selectedFrame === 'pasar') {
        bgGradient.addColorStop(0, '#064e3b'); // Emerald-900
        bgGradient.addColorStop(0.6, '#0f172a'); // Slate-900
        bgGradient.addColorStop(1, '#022c22'); // Emerald-950
      } else if (selectedFrame === 'minimalis') {
        bgGradient.addColorStop(0, '#f8fafc'); // Slate-50
        bgGradient.addColorStop(1, '#e2e8f0'); // Slate-200
      } else {
        bgGradient.addColorStop(0, '#7c2d12'); // Orange-900
        bgGradient.addColorStop(0.7, '#1c1917'); // Stone-900
        bgGradient.addColorStop(1, '#451a03'); // Amber-950
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // 2. Decorative Outer Border
      ctx.strokeStyle = selectedFrame === 'minimalis' ? '#cbd5e1' : 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 8;
      ctx.strokeRect(36, 36, 1008, 1008);

      // Inner subtle border
      ctx.strokeStyle = selectedFrame === 'minimalis' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, 984, 984);

      // 3. Header Store Banner
      ctx.fillStyle = selectedFrame === 'minimalis' ? '#0f172a' : '#10b981';
      ctx.beginPath();
      ctx.roundRect(70, 70, 520, 64, 16);
      ctx.fill();

      ctx.fillStyle = selectedFrame === 'minimalis' ? '#ffffff' : '#022c22';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`🛒 ${effectiveStoreName.toUpperCase()}`, 90, 112);

      // Guarantee badge on top right
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(740, 70, 270, 64, 16);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('⭐ GARANSI SEGAR', 760, 112);

      // 4. Draw Product Image in Center
      const renderProductImage = () => {
        if (uploadedImage) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Draw card background behind image
            ctx.fillStyle = selectedFrame === 'minimalis' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.roundRect(290, 190, 500, 500, 36);
            ctx.fill();

            // Clip image rounded
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(300, 200, 480, 480, 32);
            ctx.clip();
            ctx.drawImage(img, 300, 200, 480, 480);
            ctx.restore();

            finishDrawingTypography();
          };
          img.onerror = () => finishDrawingTypography();
          img.src = uploadedImage;
        } else {
          // Placeholder box
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.roundRect(290, 190, 500, 500, 36);
          ctx.fill();

          ctx.fillStyle = selectedFrame === 'minimalis' ? '#64748b' : '#94a3b8';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('📦 Foto Produk', 540, 450);
          ctx.textAlign = 'left';

          finishDrawingTypography();
        }
      };

      const finishDrawingTypography = () => {
        // 5. Product Title
        ctx.textAlign = 'center';
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(productName, 540, 760);

        // Subtitle
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#64748b' : '#cbd5e1';
        ctx.font = '30px sans-serif';
        ctx.fillText('Kualitas Super • Segar Langsung dari Petani', 540, 810);

        // 6. Price Badge Banner
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#059669' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(310, 850, 460, 80, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(`Harga: ${formattedPrice}`, 540, 905);

        // 7. Footer Contact WhatsApp
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#334155' : 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`💬 Pesan Langsung WA: ${phone}`, 540, 990);
        ctx.textAlign = 'left';

        resolve(canvas.toDataURL('image/png'));
      };

      renderProductImage();
    });
  };

  // Real Download handler: downloads flyer as high-res PNG
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await drawFlyerToCanvas();
      if (!dataUrl) throw new Error('Gagal merender gambar.');

      const link = document.createElement('a');
      link.download = `Promo-${productName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e: any) {
      alert('Gagal mengunduh gambar: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Real WhatsApp Direct sender with Cloudinary integration
  const handleSendWA = async () => {
    setIsUploadingToCloud(true);
    let finalUrl = cloudinaryUrl;

    try {
      // 1. Generate flyer and upload to Cloudinary
      const flyerDataUrl = await drawFlyerToCanvas();
      if (flyerDataUrl) {
        const res = await fetch('/api/upload-studio-flyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: flyerDataUrl,
            productName,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
          setCloudinaryUrl(data.url);
        }
      }
    } catch (err) {
      console.warn('Upload to Cloudinary optional fallback:', err);
    } finally {
      setIsUploadingToCloud(false);
    }

    // 2. Append link if available and open WhatsApp
    let fullMessage = promoText;
    if (finalUrl) {
      fullMessage += `\n\n📸 *Brosur Promo:* ${finalUrl}`;
    }

    const encoded = encodeURIComponent(fullMessage);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Pesan Promosi Siap Kirim WhatsApp</span>
              </label>

              {/* Tone style toggles & Regenerate */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'pasar', label: 'Ramah Pasar' },
                  { id: 'fomo', label: 'Promo Kilat' },
                  { id: 'elegan', label: 'Kualitas Pilihan' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isGeneratingCopy}
                    onClick={() => handleCopyStyleChange(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      copyStyle === s.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={isGeneratingCopy}
                  onClick={() => handleCopyStyleChange(copyStyle)}
                  title="Buat ulang variasi kalimat baru"
                  className="p-1 px-2 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingCopy ? 'animate-spin' : ''}`} />
                  <span>Ganti Kalimat</span>
                </button>
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Menyusun pesan promosi otomatis...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Pesan terhubung langsung dengan nama & harga barang toko.
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> : null}
                <span>{isCopied ? 'Tersalin ke WhatsApp!' : 'Salin Teks'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Res 1080x1080 Flyer Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
            >
              Tutup
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 font-bold px-2.5 py-0.5 rounded-full">
              <span>Studio Visual Toko</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Real Download Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadImage}
              className={`flex items-center gap-1.5 border text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Merender Brosur...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Brosur Terunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Simpan Foto Brosur</span>
                </>
              )}
            </button>

            {/* Real WhatsApp Direct Sender */}
            <button
              type="button"
              disabled={isUploadingToCloud}
              onClick={handleSendWA}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isUploadingToCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Cloud...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim via WhatsApp Direct</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
