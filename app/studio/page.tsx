'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Download,
  Share2,
  RefreshCw,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { ProductAnalysisItem } from '@/types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export default function StudioPage() {
  const [products, setProducts] = useState<ProductAnalysisItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalysisItem | null>(null);

  const [productName, setProductName] = useState('Bawang Merah Brebes');
  const [price, setPrice] = useState(40000);
  const [unit, setUnit] = useState('kg');
  const [storeName, setStoreName] = useState('Kios Berkah Sayur');
  const [phone, setPhone] = useState('0812-3456-7890');

  const [selectedFrame, setSelectedFrame] = useState<
    'pasar' | 'minimalis' | 'kriya' | 'neon' | 'panen' | 'royal' | 'canva-pastel' | 'genz-aesthetic'
  >('pasar');
  const [copyStyle, setCopyStyle] = useState<'pasar' | 'fomo' | 'elegan'>('pasar');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [promoText, setPromoText] = useState(
    `Selamat pagi Pelanggan Setia *Kios Berkah Sayur*!\n\n` +
    `Alhamdulillah, kiriman baru *Bawang Merah Brebes* sudah tiba di kios kami pagi ini. Barangnya bagus sekali, kering tua sempurna, wangi tajam, dan sangat awet disimpan berhari-hari.\n\n` +
    `💰 *Harga Langganan:* Rp40.000/kg\n` +
    `⚖️ *Jaminan Pedagang:* Timbangan pas, kualitas dipilihkan yang terbaik, tidak ada yang busuk/rusak.\n\n` +
    `Bagi yang tidak sempat ke pasar, tinggal pesan lewat WhatsApp ya. Nanti kami siapkan dan bisa diantar sampai depan pintu rumah.\n\n` +
    `Matur nuwun & laris manis barokah untuk kita semua! 🙏`
  );

  // Load products list and saved store metadata
  useEffect(() => {
    let initialList: ProductAnalysisItem[] = [];

    if (typeof window !== 'undefined') {
      const savedStore = localStorage.getItem('vokasync_business_name');
      if (savedStore) setStoreName(savedStore);
      const savedPhone = localStorage.getItem('vokasync_store_phone');
      if (savedPhone) setPhone(savedPhone);

      try {
        const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
        const localProds = localStorage.getItem(`vokasync_products_${userKey}`);
        if (localProds) {
          const parsed = JSON.parse(localProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialList = parsed;
          }
        }

        if (initialList.length === 0) {
          const cached = sessionStorage.getItem(`vokasync_products_cache_${userKey}`) || sessionStorage.getItem('vokasync_products_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const dataArr = Array.isArray(parsed) ? parsed : parsed.data;
            if (Array.isArray(dataArr) && dataArr.length > 0) {
              initialList = dataArr;
            }
          }
        }
      } catch (_) {}
    }

    if (initialList.length > 0) {
      setProducts(initialList);
      handleSelectProduct(initialList[0]);
    }

    fetch('/api/product-analysis')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts((prev) => {
            if (prev.length > 0) return prev;
            handleSelectProduct(data.data[0]);
            return data.data;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectProduct = (p?: ProductAnalysisItem | null) => {
    if (!p) {
      setSelectedProduct(null);
      setProductName('Produk Toko');
      setPrice(25000);
      setUnit('kg');
      return;
    }
    setSelectedProduct(p);
    setProductName(p.name);
    setPrice(p.selling_price || 25000);
    setUnit(p.unit || 'kg');
    if (p.image_url) {
      setUploadedImage(p.image_url);
    }
    fetchAiCopy(p.name, p.selling_price || 25000, p.unit || 'kg', copyStyle);
  };

  const fetchAiCopy = async (
    pName = productName,
    pPrice = price,
    pUnit = unit,
    style = copyStyle
  ) => {
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: pName,
          price: pPrice,
          unit: pUnit,
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

  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately show original photo while AI processes background removal
    const originalUrl = URL.createObjectURL(file);
    setUploadedImage(originalUrl);

    // Attempt client-side AI background removal with accelerated configuration
    setIsRemovingBg(true);
    try {
      const imgly = await import('@imgly/background-removal');
      const cleanBlob = await imgly.removeBackground(file, {
        model: 'isnet_quint8',
        output: {
          format: 'image/webp',
          quality: 0.9,
        },
      });
      const cleanUrl = URL.createObjectURL(cleanBlob);
      setUploadedImage(cleanUrl);
    } catch (err) {
      console.info('Background removal fallback to original photo:', err);
      // Keep originalUrl which is already set
    } finally {
      setIsRemovingBg(false);
    }
  };

  const formattedPrice = `Rp${price.toLocaleString('id-ID')}/${unit}`;

  // Render high-definition 1080x1080 flyer to HTML5 Canvas
  const drawFlyerToCanvas = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // 1. Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (selectedFrame === 'pasar') {
        bgGradient.addColorStop(0, '#064e3b');
        bgGradient.addColorStop(0.6, '#0f172a');
        bgGradient.addColorStop(1, '#022c22');
      } else if (selectedFrame === 'minimalis') {
        bgGradient.addColorStop(0, '#f8fafc');
        bgGradient.addColorStop(1, '#e2e8f0');
      } else if (selectedFrame === 'kriya') {
        bgGradient.addColorStop(0, '#7c2d12');
        bgGradient.addColorStop(0.7, '#1c1917');
        bgGradient.addColorStop(1, '#451a03');
      } else if (selectedFrame === 'neon') {
        bgGradient.addColorStop(0, '#090d16');
        bgGradient.addColorStop(0.5, '#1e1b4b');
        bgGradient.addColorStop(1, '#020617');
      } else if (selectedFrame === 'panen') {
        bgGradient.addColorStop(0, '#14532d');
        bgGradient.addColorStop(0.5, '#15803d');
        bgGradient.addColorStop(1, '#052e16');
      } else if (selectedFrame === 'canva-pastel') {
        bgGradient.addColorStop(0, '#fce7f3'); // Soft Pink-100
        bgGradient.addColorStop(0.5, '#ede9fe'); // Soft Lavender-100
        bgGradient.addColorStop(1, '#e0f2fe'); // Soft Sky-100
      } else if (selectedFrame === 'genz-aesthetic') {
        bgGradient.addColorStop(0, '#0f172a'); // Slate-900
        bgGradient.addColorStop(0.5, '#831843'); // Pink-900
        bgGradient.addColorStop(1, '#312e81'); // Indigo-900
      } else {
        // 'royal' gold & burgundy
        bgGradient.addColorStop(0, '#4a044e');
        bgGradient.addColorStop(0.6, '#2e1065');
        bgGradient.addColorStop(1, '#1e1b4b');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // 2. Decorative Outer Border
      ctx.strokeStyle =
        selectedFrame === 'minimalis'
          ? '#cbd5e1'
          : selectedFrame === 'neon'
          ? '#06b6d4'
          : selectedFrame === 'panen'
          ? '#86efac'
          : selectedFrame === 'royal'
          ? '#fbbf24'
          : 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = selectedFrame === 'royal' || selectedFrame === 'neon' ? 10 : 8;
      ctx.strokeRect(36, 36, 1008, 1008);

      // 3. Header Store Banner
      ctx.fillStyle =
        selectedFrame === 'minimalis'
          ? '#0f172a'
          : selectedFrame === 'neon'
          ? '#06b6d4'
          : selectedFrame === 'royal'
          ? '#d97706'
          : '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🛒 ${storeName.toUpperCase()}`, 80, 110);

      // 4. Draw Product Image in Center with Studio Lighting & Contextual Stage
      const renderProductImage = () => {
        if (uploadedImage) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // A. Radial soft spotlight behind product
            const stageCenterX = 540;
            const stageCenterY = 430;
            const spotLight = ctx.createRadialGradient(
              stageCenterX,
              stageCenterY - 40,
              40,
              stageCenterX,
              stageCenterY,
              260
            );
            if (selectedFrame === 'minimalis') {
              spotLight.addColorStop(0, 'rgba(255, 255, 255, 1)');
              spotLight.addColorStop(0.7, 'rgba(241, 245, 249, 0.9)');
              spotLight.addColorStop(1, 'rgba(226, 232, 240, 0.4)');
            } else if (selectedFrame === 'canva-pastel') {
              spotLight.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
              spotLight.addColorStop(0.6, 'rgba(253, 242, 248, 0.7)');
              spotLight.addColorStop(1, 'rgba(243, 232, 255, 0.2)');
            } else if (selectedFrame === 'neon') {
              spotLight.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
              spotLight.addColorStop(0.6, 'rgba(147, 51, 234, 0.2)');
              spotLight.addColorStop(1, 'rgba(15, 23, 42, 0)');
            } else {
              spotLight.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
              spotLight.addColorStop(0.6, 'rgba(16, 185, 129, 0.15)');
              spotLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }

            // Draw Card / Studio Stage Box
            ctx.save();
            ctx.fillStyle = spotLight;
            drawRoundedRect(ctx, 290, 180, 500, 500, 36);
            ctx.fill();

            // Inner border
            ctx.strokeStyle =
              selectedFrame === 'minimalis'
                ? '#cbd5e1'
                : selectedFrame === 'canva-pastel'
                ? '#f472b6'
                : selectedFrame === 'neon'
                ? '#22d3ee'
                : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            // B. Studio Pedestal Ground Shadow
            ctx.save();
            const pedestalY = 620;
            const shadowGrad = ctx.createRadialGradient(540, pedestalY, 15, 540, pedestalY, 210);
            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
            shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.ellipse(540, pedestalY, 210, 34, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // C. Draw Product Image with Vibrant Lighting & Sharp Contrast Filter
            ctx.save();
            drawRoundedRect(ctx, 300, 190, 480, 480, 32);
            ctx.clip();

            // AI Color & Lighting filter
            ctx.filter = 'contrast(1.08) saturate(1.16) brightness(1.04)';
            ctx.drawImage(img, 300, 190, 480, 480);
            ctx.restore();

            // D. Studio Glass Highlights
            ctx.save();
            const gloss = ctx.createLinearGradient(300, 190, 500, 350);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gloss;
            drawRoundedRect(ctx, 300, 190, 480, 160, 32);
            ctx.fill();
            ctx.restore();

            finishDrawingTypography();
          };
          img.onerror = () => finishDrawingTypography();
          img.src = uploadedImage;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          drawRoundedRect(ctx, 290, 180, 500, 500, 36);
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
        ctx.font = 'bold 52px sans-serif';
        ctx.fillText(productName, 540, 755);

        // Subtitle
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#64748b' : '#cbd5e1';
        ctx.font = '28px sans-serif';
        ctx.fillText('Segar Pilihan • Timbangan Pas & Amanah', 540, 805);

        // 6. Price Badge Banner
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#059669' : '#10b981';
        drawRoundedRect(ctx, 300, 845, 480, 85, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(`Harga: ${formattedPrice}`, 540, 902);

        // 7. Footer Contact WhatsApp
        ctx.fillStyle = selectedFrame === 'minimalis' ? '#334155' : 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`Pesan via WhatsApp: ${phone}`, 540, 985);
        ctx.textAlign = 'left';

        resolve(canvas.toDataURL('image/png'));
      };

      renderProductImage();
    });
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await drawFlyerToCanvas();
      const link = document.createElement('a');
      link.download = `Promosi-${productName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Error rendering image flyer:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(promoText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(promoText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-2xl border-2 border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Sparkles className="w-9 h-9 text-[#00875A] stroke-[2.5]" />
          <span>Studio Visual & WhatsApp Marketing</span>
        </h1>
        <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1.5 leading-relaxed">
          Buat materi promosi gambar dan copywriting WhatsApp otomatis hasil kecerdasan AI untuk meningkatkan penjualan toko Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product Selection & Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Product Picker */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#00875A] stroke-[2.5]" />
              <span>Pilih Barang Dagangan</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id || productName === p.name;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#00875A] bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-semibold bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500 font-normal">
                        Rp{(p.selling_price || 0).toLocaleString('id-ID')}/{p.unit || 'kg'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#00875A] stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Barang:</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-[#00875A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-[#00875A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-[#00875A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Template Frame Selection */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">Pilih Tema Bingkai Poster</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'pasar', label: 'Pasar', desc: 'Emerald Mewah' },
                { id: 'minimalis', label: 'Minimalis', desc: 'Putih Bersih' },
                { id: 'canva-pastel', label: '🌸 Canva Pastel', desc: 'Soft & Aesthetic' },
                { id: 'genz-aesthetic', label: '✨ Gen Z Y2K', desc: 'Cyber Glow' },
                { id: 'kriya', label: 'Kuliner', desc: 'Warm Earth' },
                { id: 'neon', label: 'Neon', desc: 'Midnight Glow' },
                { id: 'panen', label: 'Panen', desc: 'Hijau Kebun' },
                { id: 'royal', label: 'Royal', desc: 'Sultan Gold' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFrame(f.id as any)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    selectedFrame === f.id
                      ? 'border-[#00875A] bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 font-bold bg-white'
                  }`}
                >
                  <p className="text-xs">{f.label}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Canvas Mockup & AI Copywriting */}
        <div className="lg:col-span-7 space-y-6">
          {/* Canvas Live Preview Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#00875A] stroke-[2.5]" />
                <span>Desain Brosur Siap Kirim</span>
              </h3>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00875A] hover:text-[#059669] cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ganti Foto</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Simulated Canvas Box */}
            <div
              className={`relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden p-6 flex flex-col justify-between text-center shadow-lg border-4 transition-all duration-300 ${
                selectedFrame === 'pasar'
                  ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white border-emerald-500/40'
                  : selectedFrame === 'minimalis'
                  ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 border-slate-300'
                  : selectedFrame === 'canva-pastel'
                  ? 'bg-gradient-to-br from-pink-100 via-purple-100 to-sky-100 text-slate-800 border-pink-300/80 shadow-md'
                  : selectedFrame === 'genz-aesthetic'
                  ? 'bg-gradient-to-br from-slate-950 via-pink-950 to-indigo-950 text-pink-200 border-purple-500/80'
                  : 'bg-gradient-to-br from-orange-950 via-stone-900 to-amber-950 text-amber-50 border-amber-600/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-black">
                <span>🛒 {storeName.toUpperCase()}</span>
              </div>

              {/* Center Photo with Studio Spotlight & Pedestal */}
              <div className="my-auto py-2">
                {isRemovingBg ? (
                  <div className="w-44 h-44 mx-auto rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-emerald-400/60 bg-emerald-950/30 gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-300 animate-spin" />
                    <span className="text-[10px] font-bold text-emerald-200 text-center px-2">AI memproses pencahayaan & studio stage...</span>
                  </div>
                ) : uploadedImage ? (
                  <div className="relative group max-w-[180px] mx-auto">
                    {/* Background Radial Glow */}
                    <div className="absolute -inset-3 bg-emerald-400/25 rounded-full blur-lg opacity-80 group-hover:opacity-100 transition duration-300 pointer-events-none" />

                    <div className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 bg-white/10 backdrop-blur-xs">
                      <img
                        src={uploadedImage}
                        alt={productName}
                        className="w-full h-full object-cover filter brightness-105 contrast-105 saturate-115 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Realistic Ground Pedestal Shadow */}
                    <div className="w-32 h-2.5 mx-auto mt-1 rounded-full bg-black/40 blur-xs" />
                  </div>
                ) : (
                  <div
                    className="w-44 h-44 mx-auto rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/30 text-white/70 cursor-pointer hover:border-emerald-400/60 hover:bg-white/5 transition-all gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    title="Klik untuk unggah foto produk"
                  >
                    <Upload className="w-6 h-6 opacity-70" />
                    <span className="text-xs font-bold text-center">Ketuk untuk<br />Unggah Foto</span>
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-2">
                <h4 className="text-lg font-black tracking-tight">{productName}</h4>
                <div className="inline-block bg-[#00875A] text-white px-5 py-2 rounded-2xl font-black text-sm shadow-md">
                  Harga: {formattedPrice}
                </div>
                <p className="text-[11px] opacity-80 font-bold">Pesan via WhatsApp: {phone}</p>
              </div>
            </div>

            {/* Hidden canvas for PNG export */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white px-6 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Brosur Berhasil Diunduh!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Unduh Brosur HD (1080x1080)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Copywriting Broadcast Section */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#00875A] stroke-[2.5]" />
                <span>Pesan Promosi AI Siap Kirim WhatsApp</span>
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'pasar', label: 'Ramah Pasar' },
                  { id: 'fomo', label: 'Promo Kilat' },
                  { id: 'elegan', label: 'Elegan & Profesional' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isGeneratingCopy}
                    onClick={() => {
                      setCopyStyle(s.id as any);
                      fetchAiCopy(productName, price, unit, s.id as any);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      copyStyle === s.id
                        ? 'bg-[#00875A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={isGeneratingCopy}
                  onClick={() => fetchAiCopy()}
                  className="p-1.5 px-2.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
                  title="Buat variasi kalimat baru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCopy ? 'animate-spin' : ''}`} />
                  <span>Ganti Kalimat</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={6}
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                disabled={isGeneratingCopy}
                className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:bg-white focus:outline-[#00875A] transition-all leading-relaxed font-medium"
              />
              {isGeneratingCopy && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#00875A]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#00875A]" />
                  <span>AI sedang meracik pesan promosi terbaik...</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 bg-white transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <span>Salin Teks Pesan</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-sm px-6 py-3 rounded-2xl shadow-sm border-2 border-[#1EBE5B] active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Kirim Siaran ke WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
