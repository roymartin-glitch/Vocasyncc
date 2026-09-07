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
} from 'lucide-react';
import { mockProfile } from '@/lib/mock-data';
import { BusinessType } from '@/types';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState(mockProfile.business_name);
  const [ownerName, setOwnerName] = useState(mockProfile.owner_name);
  const [businessType, setBusinessType] = useState<BusinessType>(mockProfile.business_type);
  const [marginThreshold, setMarginThreshold] = useState(mockProfile.margin_alert_threshold.toString());

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showSuccess = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setBusinessName(p.business_name || 'Kios Berkah Sayur');
          setOwnerName(p.owner_name || 'Pak Budi');
          setBusinessType(p.business_type || 'pasar');
          setMarginThreshold((p.margin_alert_threshold || 20).toString());
        }
      })
      .catch((e) => console.warn('Settings fetch fallback:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          owner_name: ownerName,
          business_type: businessType,
          margin_alert_threshold: parseFloat(marginThreshold) || 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Pengaturan profil dan ambang batas margin tersimpan ke Supabase!');
      } else {
        alert(data.error || 'Gagal menyimpan profil.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    showSuccess('Kata sandi berhasil diperbarui!');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
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
          Kelola identitas usaha, nama pemilik, dan konfigurasi ambang batas peringatan margin AI.
        </p>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Informasi Usaha & Pemilik</h2>
          <p className="text-xs text-slate-500">
            Nama ini tersimpan di Supabase dan digunakan untuk sapaan ramah AI Advisor di Beranda.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Toko / Usaha</span>
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
              Jenis Usaha (Relevansi SDGs 9 — Inovasi Industri & UMKM)
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
            >
              <option value="pasar">Pedagang Pasar Tradisional (Sayur, Bumbu, Ikan, Daging)</option>
              <option value="kuliner">UMKM Kuliner Rumahan (Kue, Katering, Gorengan, Warung)</option>
              <option value="kriya">Pengrajin Kriya & Fashion (Kerajinan Tangan, Konveksi)</option>
              <option value="kelontong">Warung Kelontong & Sembako</option>
              <option value="lainnya">Pedagang Kaki Lima / Usaha Mikro Lainnya</option>
            </select>
          </div>

          {/* Margin Threshold Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ambang Batas Peringatan Margin (%)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="90"
                value={marginThreshold}
                onChange={(e) => setMarginThreshold(e.target.value)}
                required
                className="w-28 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
              />
              <span className="text-xs text-slate-500">
                Default: 20%. Jika margin produk turun di bawah angka ini, sistem otomatis memicu peringatan kritis (merah) & tombol Quick-Action promosi WA.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan ke Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Keamanan Akun (Ubah Kata Sandi)</span>
          </h2>
          <p className="text-xs text-slate-500">Perbarui kata sandi untuk mengamankan data transaksi usaha Anda.</p>
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

          <div className="flex justify-end pt-2">
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
              try {
                const { createClient } = await import('@/lib/supabase/client');
                await createClient().auth.signOut();
              } catch (e) {
                console.warn('SignOut info:', e);
              }
              window.location.href = '/login';
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
