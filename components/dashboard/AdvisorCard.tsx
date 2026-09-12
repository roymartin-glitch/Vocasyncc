'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, MessageCircle, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { AIInsight } from '@/types';

interface AdvisorCardProps {
  insight?: AIInsight | null;
  onOpenStudio?: () => void;
}

export function AdvisorCard({ insight, onOpenStudio }: AdvisorCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ownerName, setOwnerName] = useState('Juragan');
  const isAlert = insight?.severity === 'red' || insight?.severity === 'yellow';
  const prodName = insight?.product_name || 'Produk';

  // Waktu sapaan dinamis (Pagi, Siang, Sore, Malam)
  const [timeGreeting, setTimeGreeting] = useState('Halo');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 11) {
        setTimeGreeting('Selamat pagi');
      } else if (hour >= 11 && hour < 15) {
        setTimeGreeting('Selamat siang');
      } else if (hour >= 15 && hour < 18) {
        setTimeGreeting('Selamat sore');
      } else {
        setTimeGreeting('Selamat malam');
      }

      const savedProfile = localStorage.getItem('vokasync_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.business_name) {
            setOwnerName(parsed.business_name);
          } else if (parsed.name) {
            setOwnerName(parsed.name);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const defaultAlertMessage = `${timeGreeting} ${ownerName}! Margin keuntungan produk ${prodName} terindikasi di bawah batas aman. Pertimbangkan untuk menyesuaikan harga jual atau meninjau kembali harga modal.`;
  const defaultNormalMessage = `${timeGreeting} ${ownerName}! Selamat beraktivitas. Catat setiap transaksi masuk dan keluar hari ini untuk memantau performa laba bersih secara real-time.`;

  // Hindari duplikasi sapaan jika insight.message dari backend sudah memiliki sapaan
  const rawMsg = insight?.message || '';
  const messageText = rawMsg
    ? (rawMsg.toLowerCase().startsWith('selamat') || rawMsg.toLowerCase().startsWith('halo')
        ? rawMsg
        : `${timeGreeting} ${ownerName}! ${rawMsg}`)
    : (isAlert ? defaultAlertMessage : defaultNormalMessage);

  // Helper untuk membaca saran secara natural dengan suara asisten ramah bahasa Indonesia
  const speakInsight = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.92;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  // Otomatis bersuara jika ada peringatan baru dan fitur suara diaktifkan
  useEffect(() => {
    if (!insight?.message) return;
    const isSoundActive = typeof window !== 'undefined' ? localStorage.getItem('vokasync_sound_alert') !== 'false' : true;
    if (!isSoundActive) return;

    // Baca setelah sedikit delay agar halaman selesai memuat dan tidak mengagetkan
    const timer = setTimeout(() => {
      // Hanya auto-speak jika belum pernah dibacakan untuk insight ID ini di sesi ini
      const spokenKey = `vokasync_spoken_insight_${insight.id || insight.message}`;
      const alreadySpoken = sessionStorage.getItem(spokenKey);
      if (!alreadySpoken && isAlert) {
        sessionStorage.setItem(spokenKey, 'true');
        speakInsight(insight.message);
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [insight?.id, insight?.message, isAlert]);

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
      {/* Header with big lightbulb & Speaker Audio button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
              isAlert ? 'bg-amber-500' : 'bg-[#00875A]'
            }`}
          >
            <Lightbulb className="w-7 h-7 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              Saran untuk Anda
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Dari asisten VokaSync
            </p>
          </div>
        </div>

        {/* Tombol Suara / Dengarkan Asisten Bicara */}
        <button
          type="button"
          onClick={() => speakInsight(messageText)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isSpeaking
              ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 animate-pulse'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300'
          }`}
          title={isSpeaking ? 'Klik untuk berhenti bicara' : 'Dengarkan asisten berbicara'}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span className="hidden sm:inline">Hentikan</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>Dengarkan</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Advice / Alert Body */}
      {isAlert ? (
        <div className="bg-[#FEF3E2] border border-[#FDE68A] rounded-2xl p-4.5 space-y-2 text-slate-800">
          <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 stroke-[2.5] flex-shrink-0" />
            <span>Peringatan Keuntungan {prodName}</span>
          </div>
          <p className="text-xs leading-relaxed font-semibold text-amber-900/90">
            {messageText}
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4.5 space-y-2 text-slate-800">
          <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-700 stroke-[2.5] flex-shrink-0" />
            <span>Kondisi Usaha Normal & Terpantau</span>
          </div>
          <p className="text-xs leading-relaxed font-semibold text-emerald-900/90">
            {messageText}
          </p>
        </div>
      )}

      {/* Action Button: Buat Promo WhatsApp */}
      <div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="w-full flex items-center justify-center gap-2.5 bg-[#00875A] hover:bg-[#059669] text-white text-base font-extrabold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Buat Promo WhatsApp</span>
        </button>
        <p className="text-[11px] text-center text-slate-500 font-semibold mt-2">
          Asisten akan membuatkan gambar dan teks promo yang siap Anda kirim ke pembeli.
        </p>
      </div>
    </div>
  );
}
