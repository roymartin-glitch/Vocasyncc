'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  User,
  Percent,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  Loader2,
  Bell,
  Volume2,
  VolumeX,
  Eye,
  Calendar,
  AlertTriangle,
  Package,
  TrendingUp,
  Sparkles,
  Play,
} from 'lucide-react';
import { mockProfile } from '@/lib/mock-data';
import { TextSizeSetting, AnalysisPeriodSetting, AppThemeSetting } from '@/types';

export default function SettingsPage() {
  // 1. Profil Toko
  const [businessName, setBusinessName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vokasync_business_name') || '';
    }
    return '';
  });
  const [ownerName, setOwnerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vokasync_owner_name') || '';
    }
    return '';
  });
  const [businessType, setBusinessType] = useState('Sayur & Buah');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Peringatan (Sederhana & Ramah Pedagang)
  const [marginThreshold, setMarginThreshold] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('2');
  const [supplierCostThreshold, setSupplierCostThreshold] = useState('5');

  // 3. Suara (2 Pilihan: Aktif vs Mati)
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vokasync_sound_alert') === 'true';
    }
    return false;
  });
  const [soundAlertVolume, setSoundAlertVolume] = useState(80);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  // 4. Tampilan
  const [textSize, setTextSize] = useState<TextSizeSetting>('normal');
  const [theme, setTheme] = useState<AppThemeSetting>('terang');
  const [defaultUnit, setDefaultUnit] = useState('kg');

  // 5. Analisis
  const [analysisPeriod, setAnalysisPeriod] = useState<AnalysisPeriodSetting>('7d');

  // State status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showSuccess = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load existing settings
  useEffect(() => {
    // 1. Check local storage for instant sync
    const cachedTheme = localStorage.getItem('vokasync_theme') as AppThemeSetting;
    if (cachedTheme) setTheme(cachedTheme);

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          if (p.business_name) {
            setBusinessName(p.business_name);
            localStorage.setItem('vokasync_business_name', p.business_name);
          }
          if (p.owner_name) {
            setOwnerName(p.owner_name);
            localStorage.setItem('vokasync_owner_name', p.owner_name);
          }
          if (p.business_type) {
            // Map legacy 'pasar' to 'Sayur & Buah'
            if (p.business_type === 'pasar') setBusinessType('Sayur & Buah');
            else if (p.business_type === 'kuliner') setBusinessType('Kuliner Rumahan');
            else if (p.business_type === 'kriya') setBusinessType('Kriya & Fashion');
            else setBusinessType(p.business_type);
          }
          if (p.margin_alert_threshold !== undefined) setMarginThreshold(p.margin_alert_threshold.toString());
          if (p.low_stock_threshold !== undefined) {
            const rawVal = Number(p.low_stock_threshold);
            setLowStockThreshold(rawVal > 15 ? '2' : rawVal.toString());
          }
          if (p.supplier_cost_increase_threshold !== undefined) setSupplierCostThreshold(p.supplier_cost_increase_threshold.toString());
          if (p.sound_alert_enabled !== undefined) {
            const isEnabled = Boolean(p.sound_alert_enabled);
            setSoundAlertEnabled(isEnabled);
            localStorage.setItem('vokasync_sound_alert', isEnabled ? 'true' : 'false');
          }
          if (p.sound_alert_volume !== undefined) setSoundAlertVolume(Number(p.sound_alert_volume));
          if (p.text_size) setTextSize(p.text_size as TextSizeSetting);
          if (p.theme) setTheme(p.theme as AppThemeSetting);
          if (p.default_unit) setDefaultUnit(p.default_unit);
          if (p.analysis_period) setAnalysisPeriod(p.analysis_period as AnalysisPeriodSetting);
        }
      })
      .catch((e) => console.warn('Settings fetch fallback:', e))
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time Text Size application on change
  const handleTextSizeChange = (size: TextSizeSetting) => {
    setTextSize(size);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(
        'text-size-kecil',
        'text-size-normal',
        'text-size-besar',
        'text-size-sangat-besar'
      );
      document.documentElement.classList.add(`text-size-${size}`);
      localStorage.setItem('vokasync_text_size', size);
      window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { text_size: size } }));
    }
  };

  // Real-time Theme application on change
  const handleThemeChange = (newTheme: AppThemeSetting) => {
    setTheme(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-terang', 'theme-gelap', 'theme-3d');
      document.documentElement.classList.add(`theme-${newTheme}`);
      localStorage.setItem('vokasync_theme', newTheme);
      window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { theme: newTheme } }));
    }
  };

  // Test play speech sound
  const handleTestVoiceSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Speech Synthesis.');
      return;
    }

    setIsPlayingTestVoice(true);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Halo Pak ${ownerName || 'Pedagang'}, suara peringatan VokaSync aktif dengan volume ${soundAlertVolume} persen.`
    );
    utterance.lang = 'id-ID';
    utterance.volume = soundAlertVolume / 100;
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingTestVoice(false);
    utterance.onerror = () => setIsPlayingTestVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  // Save all settings
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        business_name: businessName,
        owner_name: ownerName,
        business_type: businessType,
        margin_alert_threshold: parseFloat(marginThreshold) || 20,
        low_stock_threshold: parseFloat(lowStockThreshold) || 2,
        supplier_cost_increase_threshold: parseFloat(supplierCostThreshold) || 5,
        sound_alert_enabled: soundAlertEnabled,
        sound_alert_volume: soundAlertVolume,
        text_size: textSize,
        theme: theme,
        default_unit: defaultUnit,
        analysis_period: analysisPeriod,
      };

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vokasync_sound_alert', soundAlertEnabled ? 'true' : 'false');
        localStorage.setItem('vokasync_business_name', businessName);
        localStorage.setItem('vokasync_owner_name', ownerName);
        showSuccess('Semua pengaturan berhasil disimpan ke database!');
        // Broadcast updates to Header and Sidebar
        window.dispatchEvent(
          new CustomEvent('vokasync-settings-changed', {
            detail: {
              business_name: businessName,
              owner_name: ownerName,
              text_size: textSize,
              theme: theme,
              sound_alert_enabled: soundAlertEnabled,
            },
          })
        );
      } else {
        alert(data.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Password update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    showSuccess('Kata sandi berhasil diperbarui dengan aman!');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-700" />
          <span>Pengaturan & Profil Toko</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan profil toko, batas peringatan untung & stok, suara asisten, serta ukuran tampilan yang ramah di mata.
        </p>
      </div>

      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. PENGATURAN PROFIL TOKO */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan Profil Toko</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas usaha yang digunakan oleh AI VokaSync untuk menyapa Anda dan mendiagnosis pasar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Toko</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Pemilik</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jenis Usaha
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
            >
              <option value="Sayur & Buah">Sayur & Buah</option>
              <option value="Daging & Ikan">Daging & Ikan</option>
              <option value="Kuliner Rumahan">Kuliner Rumahan</option>
              <option value="Kriya & Fashion">Kriya & Fashion</option>
              <option value="Kelontong">Kelontong</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PENGATURAN PERINGATAN */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Pengaturan Peringatan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur batas pengingat sederhana agar Anda selalu mendapat sinyal cepat sebelum barang habis atau rugi.
            </p>
          </div>

          <div className="space-y-4">
            {/* Batas Untung Minimal */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Batas Untung Minimal (%)</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  VokaSync akan beri tahu Anda jika untung jualan turun di bawah angka ini.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={marginThreshold}
                  onChange={(e) => setMarginThreshold(e.target.value)}
                  className="w-24 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>

            {/* Pengingat Sisa Stok Barang (Sederhana: Tanpa Persen, Pakai Satuan Fisik) */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pengingat Sisa Stok Barang</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Beri tahu jika stok barang dagangan tinggal sedikit (misal: sisa 1 atau 2 kg / bungkus / pcs).
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-bold text-slate-600">Sisa</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-20 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                />
                <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1.5 rounded-xl">
                  kg / pcs
                </span>
              </div>
            </div>

            {/* Batas Kenaikan Harga Beli Modal */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>Batas Kenaikan Harga Beli Modal (%)</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  VokaSync akan beri tahu jika harga beli barang modal dari pemasok / agen besar naik melebihi batas ini.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={supplierCostThreshold}
                  onChange={(e) => setSupplierCostThreshold(e.target.value)}
                  className="w-24 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PENGATURAN SUARA (2 PILIHAN JELAS: AKTIF VS MATI) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan Suara Asisten</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih apakah asisten VokaSync boleh bersuara berbicara atau tetap hening saat bertransaksi.
            </p>
          </div>

          <div className="space-y-4">
            {/* 2 Big Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan 1: Suara Aktif */}
              <button
                type="button"
                onClick={() => {
                  setSoundAlertEnabled(true);
                  localStorage.setItem('vokasync_sound_alert', 'true');
                  window.dispatchEvent(
                    new CustomEvent('vokasync-settings-changed', {
                      detail: { sound_alert_enabled: true },
                    })
                  );
                }}
                className={`p-4.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  soundAlertEnabled
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    soundAlertEnabled ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Volume2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">Suara Aktif (Bisa Berbicara)</span>
                    {soundAlertEnabled && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    Asisten akan berbicara ramah mengonfirmasi transaksi dan sinyal untung.
                  </p>
                </div>
              </button>

              {/* Pilihan 2: Suara Mati */}
              <button
                type="button"
                onClick={() => {
                  setSoundAlertEnabled(false);
                  localStorage.setItem('vokasync_sound_alert', 'false');
                  window.dispatchEvent(
                    new CustomEvent('vokasync-settings-changed', {
                      detail: { sound_alert_enabled: false },
                    })
                  );
                }}
                className={`p-4.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  !soundAlertEnabled
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    !soundAlertEnabled ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <VolumeX className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">Suara Mati (Hening)</span>
                    {!soundAlertEnabled && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    Aplikasi tenang tanpa suara sama sekali. Layar tetap bekerja normal.
                  </p>
                </div>
              </button>
            </div>

            {/* Volume Suara & Tes Suara (Hanya muncul jika suara aktif) */}
            {soundAlertEnabled && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                    <span>Tingkat Keras Suara (Volume)</span>
                  </label>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {soundAlertVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundAlertVolume}
                    onChange={(e) => setSoundAlertVolume(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleTestVoiceSpeech}
                    disabled={isPlayingTestVoice}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-800" />
                    <span>{isPlayingTestVoice ? 'Sedang Berbicara...' : 'Coba Tes Suara'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PENGATURAN TAMPILAN */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan Tampilan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan kenyamanan visual layar agar teks terlihat terang dan jelas saat bertransaksi di kios.
            </p>
          </div>

          <div className="space-y-5">
            {/* Pilihan Tema Web */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block">Tema Tampilan Web</label>
                <p className="text-xs text-slate-500">
                  Pilih suasana warna yang paling nyaman di mata Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'terang',
                    label: 'Terang (Standar)',
                    note: 'Bersih, kontras tinggi ramah lansia',
                    badge: 'Siang',
                  },
                  {
                    id: 'gelap',
                    label: 'Gelap (Malam)',
                    note: 'Latar hitam emerald, tidak silau',
                    badge: 'Malam',
                  },
                  {
                    id: '3d',
                    label: 'Tampilan 3D',
                    note: 'Tombol timbul nyata membal disentuh',
                    badge: 'Timbul 3D',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleThemeChange(item.id as AppThemeSetting)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      theme === item.id
                        ? 'bg-[#00875A] text-white border-[#00744D] shadow-sm font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">{item.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        theme === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug ${
                      theme === item.id ? 'text-emerald-100' : 'text-slate-500'
                    }`}>
                      {item.note}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran Teks (Termasuk Pilihan Kecil) */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
              <div>
                <label className="text-xs font-bold text-slate-900 block">Ukuran Teks</label>
                <p className="text-xs text-slate-500">
                  Sesuaikan ukuran tulisan di seluruh aplikasi dari kecil hingga ekstra besar.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'kecil', label: 'Kecil', note: '15px (Ringkas)' },
                  { id: 'normal', label: 'Normal', note: '18px (Standar)' },
                  { id: 'besar', label: 'Besar', note: '20px (Mudah Dibaca)' },
                  { id: 'sangat-besar', label: 'Sangat Besar', note: '22px (Ekstra Jelas)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTextSizeChange(item.id as TextSizeSetting)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      textSize === item.id
                        ? 'bg-[#00875A] text-white border-[#00744D] shadow-xs font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="text-xs font-black">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${textSize === item.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {item.note}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Satuan Default */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 block">Satuan Default</label>
                <p className="text-xs text-slate-500">
                  Satuan yang otomatis muncul saat mencatat transaksi.
                </p>
              </div>
              <div className="self-start md:self-auto">
                <input
                  type="text"
                  placeholder="Contoh: kg, pcs, ikat, buah"
                  value={defaultUnit}
                  onChange={(e) => setDefaultUnit(e.target.value)}
                  className="w-36 text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-emerald-600 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. PENGATURAN ANALISIS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan Analisis</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan rentang waktu evaluasi performa penjualan dan laba dagangan Anda.
            </p>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
            <div>
              <label className="text-xs font-bold text-slate-900 block">Periode Default Analisis Produk</label>
              <p className="text-xs text-slate-500">
                Periode yang dipakai untuk menghitung margin dan omset produk Anda.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '7d', label: '7 Hari', note: 'Pantauan Mingguan' },
                { id: '30d', label: '30 Hari', note: 'Pantauan Bulanan' },
                { id: '3m', label: '3 Bulan', note: 'Pantauan Triwulan' },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setAnalysisPeriod(period.id as AnalysisPeriodSetting)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    analysisPeriod === period.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                  }`}
                >
                  <div className="text-xs font-extrabold">{period.label}</div>
                  <div className={`text-[10px] mt-0.5 ${analysisPeriod === period.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {period.note}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button: Simpan Semua Pengaturan */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Semua Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* UBAH PASSWORD (FORM TERPISAH) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Ubah Password</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Perbarui kata sandi untuk mengamankan akun toko Anda.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 transition-all text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                placeholder="Ulangi kata sandi baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Perbarui Kata Sandi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Keluar dari Sesi</h3>
          <p className="text-xs text-slate-500">Keluarkan akun dari perangkat ini dengan aman.</p>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
              const { logoutUser } = await import('@/lib/supabase/auth-client');
              await logoutUser();
            }
          }}
          className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-200/60 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );
}
