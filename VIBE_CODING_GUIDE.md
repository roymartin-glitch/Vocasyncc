# VIBE_CODING_GUIDE.md — VokaSync

**Panduan Urutan Prompt Vibe Coding dari Nol hingga Hasil Final**

Dokumen ini berisi urutan prompt yang dikirimkan ke AI coding agent (Cursor, Antigravity, Claude, dll.) dari tahap pertama hingga menghasilkan VokaSync seperti kondisi final sekarang.

> **Cara Pakai**: Copy setiap prompt di bawah dan paste ke chat AI coding agent kamu secara berurutan. Tunggu AI selesai sebelum lanjut ke prompt berikutnya. Jangan skip langkah.

---

## Sebelum Mulai — Persiapan Manual (Dilakukan Manusia, Bukan AI)

Sebelum prompt pertama, lakukan ini dulu secara manual:

1. **Buat akun Supabase** di [supabase.com](https://supabase.com) → buat project baru.
2. **Buat akun Google AI Studio** di [aistudio.google.com](https://aistudio.google.com) → ambil `GEMINI_API_KEY` gratis.
3. **Siapkan folder kosong** untuk project. Buka terminal di folder itu.
4. **Siapkan 4 nilai** yang akan dipakai nanti:
   - `NEXT_PUBLIC_SUPABASE_URL` — dari Supabase dashboard (Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dari Supabase dashboard
   - `SUPABASE_SERVICE_ROLE_KEY` — dari Supabase dashboard (rahasia!)
   - `GEMINI_API_KEY` — dari Google AI Studio

---

## PROMPT 1 — Setup Project & Design System

> **Tujuan**: Inisialisasi Next.js, install dependensi, buat design tokens, dan kontrak tipe data.

```
Buat project Next.js baru dengan spesifikasi berikut:

NAMA PROJECT: VokaSync
FRAMEWORK: Next.js App Router + TypeScript (versi terbaru)
PACKAGE MANAGER: npm

INSTALL dependensi ini:
- lucide-react (ikon)
- recharts (chart)
- @supabase/ssr
- @supabase/supabase-js
- @imgly/background-removal
- tailwindcss (sudah include di Next.js)

BUAT file app/globals.css dengan CSS custom properties berikut:
:root {
  --background: #f5f5f5;
  --foreground: #1e293b;
  --card: #ffffff;
  --card-foreground: #1e293b;
  --primary: #1a7a4a;
  --primary-foreground: #ffffff;
  --primary-light: #eaf6ee;
  --primary-dark: #125734;
  --muted: #64748b;
  --muted-light: #f1f5f9;
  --border: #e2e8f0;
}
Tambahkan juga custom scrollbar tipis (width 6px, thumb abu-abu).

BUAT file types/index.ts dengan interface TypeScript berikut (semua harus ada):

1. BusinessType = 'pasar' | 'kuliner' | 'kriya' | 'kelontong' | 'lainnya'
2. Profile { id, business_name, owner_name, business_type: BusinessType, margin_alert_threshold: number }
3. Product { id, user_id, name, default_unit, created_at? }
4. TransactionType = 'expense' | 'income'
5. TransactionSource = 'voice' | 'manual'
6. TransactionItem { id, transaction_id, product_id, product_name?, quantity, unit, unit_price, subtotal? }
7. Transaction { id, user_id, type: TransactionType, transaction_date, source: TransactionSource, raw_voice_text?, created_at?, items: TransactionItem[], total_amount? }
8. SeverityLevel = 'red' | 'yellow' | 'green'
9. AIInsight { id, user_id, product_id?, product_name?, severity: SeverityLevel, message, has_quick_action: boolean, metric_snapshot?, created_at }
10. ExperimentStatus = 'running' | 'completed'
11. EvaluationStatus = 'in_progress' | 'success' | 'partial' | 'failed'
12. ExperimentMetric { margin, price?, daily_volume?, daily_profit? }
13. Experiment { id, user_id, product_id?, product_name?, title, status, baseline_metric: ExperimentMetric, target_metric?, started_at, target_end_at?, results?: ExperimentResult[] }
14. ExperimentResult { id, experiment_id, recorded_at, current_metric: ExperimentMetric, evaluation_status?, ai_verdict_text? }
15. ProductActionCategory = 'dorong' | 'pertahankan' | 'perbaiki' | 'kurangi'
16. ProductAnalysisItem { id, name, unit, cost_price, selling_price, margin_percentage, action_category, avg_daily_volume, total_revenue_7d }
17. DashboardMetrics { today_income, today_income_change, today_expense, today_expense_change, today_profit, today_profit_change, today_margin, today_margin_change } (semua number)
18. TrendDayData { date, dayName, income, expense }

BUAT file .env.example dengan template 4 variable:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

Pastikan .env.local ada di .gitignore.
Jangan buat .env.local dulu — saya yang isi nanti.
```

---

## PROMPT 2 — Layout Navigasi Responsif

> **Tujuan**: Buat sistem navigasi 3-tier (sidebar desktop, sidebar tablet icon-only, bottom nav mobile).

```
Buat sistem layout navigasi responsif untuk VokaSync. Ada 3 komponen navigasi yang harus dibuat di components/layout/:

---
FILE 1: components/layout/sidebar.tsx

Sidebar untuk desktop dan tablet dengan spesifikasi:
- Desktop (≥1024px): lebar 240px, tampilkan ikon + label teks
- Tablet (768px–1023px): lebar 64px, tampilkan ikon saja (icon-only, label disembunyikan)
- Background putih, border kanan tipis #e2e8f0
- Logo/nama "VokaSync" + subtitle "AI Business Advisor" di bagian atas
- Menu items (gunakan lucide-react icons):
  * Beranda → route /dashboard → ikon LayoutDashboard
  * Catat → route /catat → ikon PlusCircle
  * Produk → route /produk → ikon BarChart2
  * Eksperimen → route /eksperimen → ikon FlaskConical
  * Riwayat → route /riwayat → ikon History
  * Settings → route /settings → ikon Settings
- Menu aktif: background #eaf6ee, teks dan ikon #1a7a4a, border kiri 3px #1a7a4a
- Ikon Logout (LogOut dari lucide) di bagian paling bawah
- Props yang diterima: businessName: string, ownerName: string
- Gunakan usePathname() untuk deteksi active route

---
FILE 2: components/layout/bottom-nav.tsx

Bottom navigation untuk mobile (hidden di md ke atas):
- Fixed bottom, full width, background putih, shadow atas tipis
- 4 tab: Beranda (/dashboard), Catat (/catat), Produk (/produk), Eksperimen (/eksperimen)
- Tab aktif: ikon + teks #1a7a4a; non-aktif: #94a3b8
- Gunakan usePathname() untuk deteksi active

---
FILE 3: components/layout/header.tsx

Header adaptif:
- Desktop: "Selamat datang kembali, [ownerName] 👋" di kiri, tombol "+ Catat Transaksi" hijau (#1a7a4a) di kanan (link ke /catat)
- Mobile: "VokaSync" di kiri, ikon History + ikon Settings di kanan (link ke /riwayat dan /settings)
- Props: ownerName: string, businessName: string

---
FILE 4: components/layout/app-shell.tsx

Shell pembungkus yang menyatukan sidebar + header + bottom nav:
- Jika pathname dimulai dengan /login atau /register: render children saja (tanpa navigasi)
- Layout: flex row, sidebar fixed kiri, konten utama dengan padding kiri 64px (tablet) atau 240px (desktop)
- Main content: padding p-4 (mobile), p-6 (tablet), p-8 (desktop), max-w-7xl mx-auto
- Untuk sementara, pass props businessName dan ownerName dengan nilai hardcode: "Toko Pak Budi" dan "Pak Budi"

---
FILE 5: app/layout.tsx

Root layout yang:
- Import globals.css
- Mount <AppShell> sebagai wrapper
- Set metadata: title = "VokaSync — AI Business Advisor & Visual Marketing Pedagang Pasar & UMKM"
- Set lang="id" di tag html

---
FILE 6: app/page.tsx

Redirect sederhana dari / ke /dashboard menggunakan redirect() dari next/navigation.
```

---

## PROMPT 3 — Mock Data & Komponen Dashboard

> **Tujuan**: Buat data statis untuk pengembangan UI tanpa database, lalu bangun semua komponen Beranda.

```
Buat mock data dan komponen dashboard untuk VokaSync.

---
FILE 1: lib/mock-data/index.ts

Buat data mock statis yang realistis untuk pedagang bawang "Pak Budi" di Pasar Minggu:

export const mockProfile = {
  id: 'mock-user-1',
  business_name: 'Kios Pak Budi Pasar Minggu',
  owner_name: 'Pak Budi',
  business_type: 'pasar',
  margin_alert_threshold: 20,
}

export const mockMetrics = {
  today_income: 1250000,
  today_income_change: 8.5,
  today_expense: 870000,
  today_expense_change: -3.2,
  today_profit: 380000,
  today_profit_change: 12.1,
  today_margin: 30.4,
  today_margin_change: 2.8,
}

export const mockTrendData (7 hari, dayName: Sen/Sel/Rab/Kam/Jum/Sab/Min):
  - Income berkisar 800rb–1.5jt, expense berkisar 600rb–1.1jt
  - Buat variatif agar chart menarik

export const mockInsight = {
  id: 'insight-1',
  user_id: 'mock-user-1',
  severity: 'yellow',
  message: 'Pak Budi, margin bawang merah sedang mendekati batas aman 20%. Harga beli dari supplier naik Rp500/kg minggu ini, tapi harga jual belum menyesuaikan. Coba naikkan harga Rp1.000/kg atau buat paket hemat "2 kg + bonus bawang putih" untuk menarik pembeli lebih banyak.',
  has_quick_action: false,
  created_at: (2 jam lalu dalam ISO string),
}

export const mockSignals (array 5 item dari ai_insights dengan berbagai severity)
export const mockRecentTransactions (array 5 transaksi terbaru, campuran expense dan income)
export const mockProducts (array 4 produk dengan margin berbeda untuk halaman produk)
export const mockExperiments (2 eksperimen: 1 completed, 1 running)

---
FILE 2: components/dashboard/MetricCard.tsx

Kartu metrik dengan:
- Props: title, value (number → format Rupiah), change (number → % perubahan), icon (ReactNode), colorClass?
- Nilai besar dan tebal di tengah
- Badge perubahan: hijau dengan "▲ X%" jika positif, merah dengan "▼ X%" jika negatif
- Ikon di pojok kanan atas dengan background circle
- Shadow tipis, rounded-xl, background putih
- Format rupiah: "Rp1.250.000" (tanpa desimal)

---
FILE 3: components/dashboard/TrendChart.tsx

Chart bar tren menggunakan Recharts BarChart:
- Props: data: TrendDayData[]
- 2 bar: Pemasukan (warna #1a7a4a) dan Pengeluaran (warna #94a3b8)
- X-axis: dayName (Sen, Sel, dst.)
- Y-axis: format Rupiah singkat (850rb, 1.2jt)
- Custom tooltip yang rapi menampilkan angka lengkap Rupiah
- Responsive (100% width), height 200px
- Legend di atas chart

---
FILE 4: components/dashboard/AdvisorCard.tsx

Kartu AI Advisor:
- Props: insight: AIInsight, onQuickAction?: () => void
- Badge severity: merah (#ef4444) jika 'red', kuning (#f59e0b) jika 'yellow', hijau (#1a7a4a) jika 'green'
- Label badge: "⚠️ Perlu Perhatian" (red), "📊 Pantau Terus" (yellow), "✅ Kondisi Baik" (green)
- Ikon bot/robot di sebelah teks
- Paragraf narasi insight
- Jika has_quick_action = true: tampilkan tombol "📱 Buat Promosi WA" berwarna hijau
- Design premium: gradient background tipis sesuai severity

---
FILE 5: components/dashboard/SignalFeed.tsx

Feed sinyal terbaru:
- Props: signals: AIInsight[]
- Setiap item: dot warna severity di kiri, teks message (truncate 2 baris), waktu relatif di kanan
- Waktu relatif: "Baru saja", "X menit lalu", "X jam lalu", "Kemarin"
- Divider tipis antar item

---
FILE 6: components/dashboard/RecentTransactions.tsx

Tabel/list transaksi terbaru:
- Props: transactions: Transaction[]
- Setiap baris: nama produk, badge jenis (hijau "Pemasukan" / merah "Pengeluaran"), jumlah + satuan, total Rupiah, waktu
- Mobile: tampilan kartu; Desktop: tampilan tabel

---
FILE 7: app/dashboard/page.tsx

Halaman Beranda yang menggunakan semua komponen di atas:
- Import semua mock data
- Layout desktop 3-kolom: kiri (4 MetricCard dalam grid 2x2), tengah (TrendChart + RecentTransactions), kanan (AdvisorCard + SignalFeed)
- Layout mobile: single column - AdvisorCard → 4 MetricCard (grid 2x2) → TrendChart → SignalFeed
- Sapaan di header: "Selamat datang kembali, Pak Budi 👋"
- Gunakan data dari mock-data/index.ts
```

---

## PROMPT 4 — Halaman Catat Transaksi

> **Tujuan**: Buat UI input transaksi dengan voice dan manual form.

```
Buat halaman Catat Transaksi untuk VokaSync di app/catat/page.tsx.

FITUR yang harus ada:

1. VOICE INPUT:
   - Tombol mikrofon besar (ikon Mic dari lucide) di tengah atas
   - Saat diklik: mulai SpeechRecognition (Web Speech API, bahasa 'id-ID')
   - State: idle (abu) → recording (merah beranimasi pulse) → done (hijau)
   - Tampilkan transkrip mentah real-time saat user bicara
   - Setelah selesai: tampilkan "hasil parsing" dalam form yang bisa diedit

2. DIVIDER "atau input manual" di antara voice dan form

3. TOGGLE SEGMENTED:
   - 2 pilihan: "💸 Pengeluaran" dan "💰 Pemasukan"
   - Toggle aktif: background hijau #1a7a4a, teks putih
   - Toggle non-aktif: background abu muda

4. FORM MANUAL:
   - Field Nama Produk/Bahan (text input, placeholder: "cth: Bawang Merah, Cabai Rawit")
   - Field Jumlah (number input)
   - Dropdown Satuan: kg, ikat, pcs, liter, karung, bungkus (default: kg)
   - Field Total Bayar (number input, format Rupiah)
   - Field Tanggal (date input, default: hari ini)

5. PREVIEW KONFIRMASI (muncul setelah voice parsing):
   - Card preview: "Produk: Bawang Merah | Qty: 20 kg | Total: Rp80.000 | Jenis: Pengeluaran"
   - Tombol "✏️ Koreksi" dan "✅ Simpan Transaksi"

6. TOMBOL CTA:
   - "Simpan Transaksi" — hijau (#1a7a4a), full width, ikon Save
   - Sementara: console.log data form saat submit (belum ke API)

DESAIN:
- Background kartu putih, shadow tipis, rounded-xl
- Layout: centered, max-width 600px, padding lega
- Animasi tombol mic saat recording: ring merah beranimasi
- Responsive: desktop modal-style, mobile full screen
```

---

## PROMPT 5 — Halaman Analisis Produk, Eksperimen, Riwayat, Settings

> **Tujuan**: Selesaikan semua halaman yang tersisa dengan mock data.

```
Buat 4 halaman sekaligus untuk VokaSync menggunakan data dari lib/mock-data/index.ts:

---
HALAMAN 1: app/produk/page.tsx — Analisis Produk

Layout desktop 2-kolom:
- Kiri (40%): daftar produk dengan kartu
- Kanan (60%): detail produk yang dipilih + insight AI

Layout mobile: single column

Komponen untuk setiap produk:
- Nama produk (tebal)
- Badge kategori aksi dengan warna:
  * "Dorong" (margin ≥35%): badge hijau gelap
  * "Pertahankan" (margin ≥20%): badge biru
  * "Perbaiki" (margin ≥10%): badge kuning
  * "Kurangi" (margin <10%): badge merah
- Progress bar margin (0–100%, warna sesuai kategori)
- Teks: "Margin X% | X kg/hari"

Bubble AI insight di atas (dari mockInsight): teks perbandingan antar produk

---
HALAMAN 2: app/eksperimen/page.tsx — Eksperimen Bisnis

Daftar kartu eksperimen dari mockExperiments:

Kartu COMPLETED (border hijau):
- Header: judul eksperimen + badge "✅ Selesai" hijau
- 2 sub-kartu: "Sebelum" (baseline_metric) dan "Sesudah" (current_metric dari results)
- Tampilkan: margin %, harga/kg, volume/hari
- Verdict AI: teks italic dari ai_verdict_text
- Panah naik/turun di antara Sebelum-Sesudah

Kartu RUNNING (border oranye):
- Header: judul + badge "🔄 Berjalan" oranye
- Indikator "Hari X/Y" (hitung dari started_at dan target_end_at)
- 2 sub-kartu: Target vs Sekarang
- Progress bar hari berjalan

Bubble rekomendasi AI di bawah semua kartu (ikon Lightbulb)

---
HALAMAN 3: app/riwayat/page.tsx — Riwayat Transaksi

Filter bar di atas:
- Date picker rentang: Dari — Sampai (default: 7 hari terakhir)
- Dropdown jenis: Semua / Pengeluaran / Pemasukan
- Search input nama produk (debounce 300ms)

Tampilan desktop: tabel dengan kolom Tanggal, Produk, Jumlah, Satuan, Total, Jenis, Aksi
Tampilan mobile: kartu per transaksi

Setiap transaksi punya:
- Badge jenis (Pengeluaran merah / Pemasukan hijau)
- Tombol ✏️ Edit (buka modal edit) dan 🗑️ Hapus (konfirmasi dulu)
- Modal konfirmasi hapus: "Yakin hapus transaksi ini? Tindakan ini tidak dapat dibatalkan."

Gunakan mockRecentTransactions untuk data, dan simulasikan filter di sisi client (useState + filter array).

---
HALAMAN 4: app/settings/page.tsx — Settings & Profil

Form pengaturan dalam beberapa section:

Section "Profil Toko":
- Input: Nama Toko (text)
- Input: Nama Pemilik (text)
- Dropdown: Jenis Usaha (Pasar Tradisional / Kuliner Rumahan / Kriya & Fashion / Kelontong & Sembako / Lainnya)

Section "Preferensi Alert":
- Input: Ambang Batas Margin (%) dengan slider + input angka
- Teks penjelasan: "Sistem akan memberi peringatan jika margin rata-rata turun di bawah X%"

Section "Keamanan":
- Tombol "Ubah Password" (cukup tampilkan, belum fungsional)

Tombol "Simpan Perubahan" — hijau, full width
Tombol "Keluar (Logout)" — merah outline, full width (di bawah)

Gunakan mockProfile sebagai initial values.
```

---

## PROMPT 6 — AI Virtual Studio Modal

> **Tujuan**: Buat modal lengkap AI Virtual Studio dengan background removal client-side.

```
Buat komponen modal AI Virtual Studio di components/studio/StudioModal.tsx.

Modal ini dibuka dari tombol "Buat Promosi WA" di AdvisorCard dan berisi seluruh flow pembuatan promosi produk.

SPESIFIKASI:

Props:
- isOpen: boolean
- onClose: () => void
- productName?: string
- storeName?: string

STEP 1 — Upload Foto:
- Tombol upload foto (terima image/*)
- Preview foto yang dipilih
- Instruksi: "Ambil foto produk dengan latar polos agar hasil lebih baik"

STEP 2 — Background Removal (setelah foto dipilih):
- Tampilkan loading spinner dengan teks "AI sedang menghapus background..."
- Gunakan library @imgly/background-removal:
  import { removeBackground } from '@imgly/background-removal';
  const blob = await removeBackground(file);
- Preview foto setelah background dihapus
- Tombol "Pilih Ulang Foto" di bawah

STEP 3 — Pilih Frame Template:
- 3 pilihan frame dalam grid 3-kolom:
  * "Minimalis" — frame-minimalis.png
  * "Pasar Tradisional" — frame-pasar.png  
  * "Kriya & Fashion" — frame-kriya.png
- Setiap pilihan: thumbnail preview + nama, border hijau jika dipilih
- Preview gabungan foto + frame (gunakan CSS position: relative + overlay, atau canvas)

STEP 4 — Generate Copywriting:
- Tombol "✨ Generate Copywriting AI"
- Sementara: tampilkan 3 variasi teks hardcode (belum ke API)
  * Gaya Pasar: teks hangat kekeluargaan + emoji sayur
  * Gaya FOMO: promo kilat terbatas + emoji api
  * Gaya Elegan: kualitas premium + emoji bintang
- Setiap variasi: card yang bisa diklik untuk memilih
- Selected: border hijau
- Teks bisa diedit (textarea)

STEP 5 — Kirim ke WhatsApp:
- Tombol "📱 Kirim ke WhatsApp" — hijau besar
- Action: window.open(`https://wa.me/?text=${encodeURIComponent(selectedCopy)}`, '_blank')

NAVIGASI STEP:
- Stepper di atas (1-2-3-4-5) dengan step aktif berwarna hijau
- Tombol "Lanjut →" dan "← Kembali"

DESAIN MODAL:
- Overlay gelap di background
- Modal card: max-w-2xl, rounded-2xl, padding lega
- Scrollable konten
- Tombol X untuk tutup di pojok kanan atas
```

---

## PROMPT 7 — Database Schema Supabase

> **Tujuan**: Buat semua file SQL schema database yang siap dijalankan di Supabase.

```
Buat file-file SQL schema untuk Supabase di folder supabase/schema/.

Prinsip desain database:
- Tidak ada tabel harga terpisah — harga diturunkan dari transaction_items
- Tidak ada tabel ringkasan harian — dihitung on-the-fly
- AI tidak menyimpan angka — hanya teks narasi
- RLS wajib semua tabel dengan user_id

---
FILE: supabase/schema/01_profiles.sql
Buat tabel profiles dengan kolom:
- id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- business_name TEXT NOT NULL
- owner_name TEXT NOT NULL
- business_type TEXT CHECK (business_type IN ('pasar','kuliner','kriya','kelontong','lainnya'))
- margin_alert_threshold NUMERIC NOT NULL DEFAULT 20
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

RLS: aktifkan, buat policy SELECT/INSERT/UPDATE untuk auth.uid() = id

---
FILE: supabase/schema/02_products.sql
Tabel products:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
- name TEXT NOT NULL
- default_unit TEXT NOT NULL DEFAULT 'kg'
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: aktifkan, user_id = auth.uid()

---
FILE: supabase/schema/03_transactions.sql
Tabel transactions:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
- type TEXT NOT NULL CHECK (type IN ('expense','income'))
- transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
- source TEXT NOT NULL CHECK (source IN ('voice','manual')) DEFAULT 'manual'
- raw_voice_text TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: user_id = auth.uid()

---
FILE: supabase/schema/04_transaction_items.sql
Tabel transaction_items:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE
- product_id UUID NOT NULL REFERENCES products(id)
- quantity NUMERIC NOT NULL
- unit TEXT NOT NULL DEFAULT 'kg'
- unit_price NUMERIC NOT NULL

RLS: melalui relasi ke transactions (user_id via JOIN atau policy dengan subquery)

---
FILE: supabase/schema/05_ai_insights.sql
Tabel ai_insights:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
- product_id UUID REFERENCES products(id)
- severity TEXT NOT NULL CHECK (severity IN ('red','yellow','green'))
- message TEXT NOT NULL
- has_quick_action BOOLEAN NOT NULL DEFAULT false
- metric_snapshot JSONB
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: user_id = auth.uid()

---
FILE: supabase/schema/06_experiments.sql
Tabel experiments:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
- product_id UUID REFERENCES products(id)
- title TEXT NOT NULL
- status TEXT NOT NULL CHECK (status IN ('running','completed')) DEFAULT 'running'
- baseline_metric JSONB NOT NULL
- target_metric JSONB
- started_at TIMESTAMPTZ DEFAULT NOW()
- target_end_at TIMESTAMPTZ
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: user_id = auth.uid()

---
FILE: supabase/schema/07_experiment_results.sql
Tabel experiment_results:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE
- recorded_at TIMESTAMPTZ DEFAULT NOW()
- current_metric JSONB NOT NULL
- evaluation_status TEXT CHECK (evaluation_status IN ('in_progress','success','partial','failed'))
- ai_verdict_text TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: melalui relasi ke experiments (user_id)

---
FILE: supabase/schema/full_schema.sql
Gabungkan semua SQL dari 01–07 dalam satu file, berurutan.

---
FILE: supabase/schema/seed_data.sql
Buat seed data realistis untuk demo:
- User ID: 'demo-user-budi-uuid' (placeholder, akan diganti dengan UUID asli)
- Profile: Pak Budi, Kios Pak Budi Pasar Minggu, pasar, threshold 20
- Products: Bawang Merah, Cabai Rawit, Bawang Putih, Tomat
- Transactions: 14 hari terakhir, campuran expense dan income, variatif harga
- transaction_items: terhubung ke setiap transaksi
- ai_insights: 3 insight (red, yellow, green) dengan narasi nyata
- experiments: 1 completed (margin naik setelah naikkan harga), 1 running (promo paket)
- experiment_results: untuk experiment yang completed
```

---

## PROMPT 8 — Supabase Client Helpers & Kalkulasi Finansial

> **Tujuan**: Buat layer koneksi Supabase dan logika kalkulasi deterministik.

```
Buat file-file helper untuk koneksi Supabase dan kalkulasi finansial VokaSync.

---
FILE 1: lib/supabase/client.ts
Browser client untuk komponen React client-side:

'use client';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

---
FILE 2: lib/supabase/server.ts
Server client untuk API routes (membaca session dari cookies):

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server Component */ }
        },
      },
    }
  );
}

// Admin client untuk bypass RLS jika diperlukan
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

---
FILE 3: lib/calculations/financial.ts
Logika kalkulasi deterministik (BUKAN oleh AI):

1. calculateMargin(costPrice: number, sellingPrice: number): number
   - Rumus: (sellingPrice - costPrice) / sellingPrice * 100
   - Jika sellingPrice <= 0: return 0
   - Jika costPrice <= 0: return 100
   - Round ke 1 desimal

2. determineActionCategory(margin: number, threshold: number = 20): ProductActionCategory
   - margin >= 35: return 'dorong'
   - margin >= threshold: return 'pertahankan'
   - margin >= 10: return 'perbaiki'
   - default: return 'kurangi'

3. determineSeverity(margin: number, threshold: number = 20): { severity: SeverityLevel, hasQuickAction: boolean }
   - margin < threshold: { severity: 'red', hasQuickAction: true }
   - margin < threshold + 5: { severity: 'yellow', hasQuickAction: false }
   - default: { severity: 'green', hasQuickAction: false }

4. build7DayTrend(transactionsWithItems: any[]): TrendDayData[]
   - Buat array 7 elemen (D-6 sampai D-0) dengan date, dayName ('Sen','Sel','Rab','Kam','Jum','Sab','Min'), income: 0, expense: 0
   - Loop semua transaksi, match berdasarkan date string (split 'T')[0]
   - Total amount = SUM(item.quantity * item.unit_price) untuk semua items
   - Akumulasi ke income atau expense berdasarkan tx.type
   - Return array 7 hari

---
FILE 4: lib/ai/gemini.ts
Helper untuk memanggil Gemini API via REST (bukan SDK):

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [{ parts: [{ text: systemInstruction + '\n\n' + prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

---
FILE 5: lib/ai/prompts.ts
Template prompt untuk setiap use case:

1. getParseVoicePrompt(transcript: string): string
   - Instruksi: ekstrak dari transkrip bahasa Indonesia ke JSON
   - Aturan: type income/expense, product_name kapital, quantity number, unit dari list, total_price rupiah ke angka
   - Output: JSON murni tanpa markdown: { product_name, quantity, unit, total_price, type }

2. getDailyAdvisorPrompt(ownerName: string, metrics: { todayIncome, todayExpense, todayProfit, todayMargin, threshold, criticalProduct?, criticalMargin? }): string
   - Instruksi: 1 paragraf narasi (3-4 kalimat) bahasa Indonesia hangat
   - Jelaskan root-cause dan saran aksi konkret
   - Jangan pakai istilah teknis

3. getExperimentVerdictPrompt(title, productName, baselineMargin, currentMargin, daysRunning): string
   - Instruksi: verdict 2-3 kalimat apakah sukses/perlu disesuaikan
   - Bahasa ramah dan memotivasi

4. getMarketingCopyPrompt(productName: string, storeName: string, style: 'pasar'|'fomo'|'elegan'): string
   - Instruksi: teks promosi WhatsApp singkat + emoji
   - Gaya pasar: hangat kekeluargaan
   - Gaya fomo: promo kilat mendesak
   - Gaya elegan: kualitas terpercaya premium
```

---

## PROMPT 9 — API Routes (Semua Sekaligus)

> **Tujuan**: Buat semua 7 API routes yang menghubungkan frontend ke Supabase & Gemini.

```
Buat semua API routes untuk VokaSync. Setiap route menggunakan createAdminClient() dari lib/supabase/server.ts (bukan createClient() agar tidak perlu auth header di setiap request — cukup gunakan RLS via service role untuk MVP).

PENTING: GEMINI_API_KEY hanya boleh diakses di sini (server-side). JANGAN pernah pass ke client.

---
ROUTE 1: app/api/parse-voice/route.ts
POST handler:
- Request body: { transcript: string }
- Panggil callGemini(getParseVoicePrompt(transcript))
- Parse response JSON dari Gemini
- Kembalikan: { success: true, data: { product_name, quantity, unit, total_price, type } }
- Error handling: jika JSON invalid, kembalikan { success: false, error: "..." }

---
ROUTE 2: app/api/transactions/route.ts
GET handler:
- Query params: date_from?, date_to?, type?, product_name?
- Query: transactions JOIN transaction_items JOIN products, filter berdasarkan params
- Kembalikan: { data: Transaction[] }

POST handler:
- Request body: { type, transaction_date?, source, raw_voice_text?, items: [{product_name, quantity, unit, unit_price}] }
- Untuk setiap item: cari product by name (case-insensitive), jika tidak ada → INSERT baru ke products
- INSERT ke transactions
- INSERT semua items ke transaction_items
- Kembalikan: { success: true, data: { transaction_id } }

---
ROUTE 3: app/api/transactions/[id]/route.ts
PATCH handler:
- Request body: { type?, transaction_date?, items? }
- UPDATE transactions
- Jika items ada: DELETE lama, INSERT baru
- Kembalikan: { success: true }

DELETE handler:
- DELETE transactions WHERE id = params.id (CASCADE ke items otomatis)
- Kembalikan: { success: true }

---
ROUTE 4: app/api/insights/route.ts
GET handler (kompleks — ini inti sistem):
1. Ambil profile user (margin_alert_threshold, owner_name)
2. Query transaksi+items HARI INI dan KEMARIN
3. Hitung: today_income, today_expense, today_profit, today_margin
4. Hitung: yesterday_income, yesterday_expense, yesterday_profit, yesterday_margin
5. Hitung % perubahan (change) untuk setiap metrik
6. Query 7 hari terakhir → build7DayTrend()
7. determineSeverity(today_margin, threshold)
8. Cari produk dengan margin paling rendah (criticalProduct)
9. Panggil callGemini(getDailyAdvisorPrompt(ownerName, metrics))
10. INSERT ke ai_insights: { severity, message, has_quick_action, metric_snapshot }
11. Ambil 5 insights terbaru dari ai_insights
12. Ambil 5 transaksi terbaru (untuk RecentTransactions)
13. Kembalikan semua data dalam 1 response

---
ROUTE 5: app/api/product-analysis/route.ts
GET handler:
1. Ambil semua products milik user
2. Untuk setiap produk, query transaction_items 7 hari terakhir:
   - Expense items → hitung harga modal terkini (unit_price terbaru dari expense)
   - Income items → hitung harga jual terkini (unit_price terbaru dari income) + volume (SUM quantity) + revenue (SUM quantity*unit_price)
3. calculateMargin(cost_price, selling_price)
4. determineActionCategory(margin, threshold)
5. Kembalikan: { data: ProductAnalysisItem[] }
6. Juga panggil Gemini untuk insight perbandingan produk (getDailyAdvisorPrompt dengan fokus produk)

---
ROUTE 6: app/api/experiments/route.ts
GET handler:
- Query experiments + experiment_results terbaru (LEFT JOIN)
- Kembalikan: { data: Experiment[] }

POST handler:
- Request body: { title, product_id?, baseline_metric, target_metric?, target_end_at? }
- INSERT ke experiments (status: 'running')
- INSERT experiment_results awal (evaluation_status: 'in_progress')
- Kembalikan: { success: true, data: { id } }

PATCH handler:
- Request body: { id, current_metric }
- Ambil experiment (baseline_metric)
- Hitung selisih margin: currentMargin - baselineMargin
- Tentukan evaluation_status: success (naik >5%), partial (naik 0-5%), failed (turun)
- Panggil Gemini: getExperimentVerdictPrompt(...)
- INSERT experiment_results dengan current_metric + evaluation_status + ai_verdict_text
- UPDATE experiments.status = 'completed'
- Kembalikan: { success: true, data: { verdict } }

---
ROUTE 7: app/api/settings/route.ts
GET handler:
- SELECT dari profiles WHERE id = user_id
- Kembalikan: { data: Profile }

PATCH handler:
- Request body: { business_name?, owner_name?, business_type?, margin_alert_threshold? }
- UPDATE profiles SET ... WHERE id = user_id
- Set updated_at = NOW()
- Kembalikan: { success: true }

---
ROUTE 8: app/api/generate-copy/route.ts
POST handler:
- Request body: { productName: string, storeName?: string, style: 'pasar'|'fomo'|'elegan' }
- Panggil callGemini(getMarketingCopyPrompt(productName, storeName, style)) 3x untuk 3 gaya
- Kembalikan: { copies: { pasar: string, fomo: string, elegan: string } }
- Jangan simpan ke DB — ephemeral
```

---

## PROMPT 10 — Wiring Halaman ke API (Ganti Mock Data → Real Data)

> **Tujuan**: Sambungkan semua halaman dari mock data ke API routes nyata.

```
Perbarui semua halaman VokaSync dari mock data menjadi data nyata dari API routes. Setiap halaman harus menggunakan React state + useEffect untuk fetch data.

---
app/dashboard/page.tsx — sambungkan ke GET /api/insights:
- useEffect: fetch('/api/insights') saat mount
- State: metrics (DashboardMetrics), trendData (TrendDayData[]), insight (AIInsight), signals (AIInsight[]), recentTransactions (Transaction[])
- Loading state: tampilkan skeleton/spinner
- Error state: tampilkan pesan error + tombol retry
- Teruskan data ke komponen: MetricCard, TrendChart, AdvisorCard, SignalFeed, RecentTransactions

---
app/catat/page.tsx — sambungkan ke POST /api/parse-voice dan POST /api/transactions:
- Voice flow: hasil transkrip → POST /api/parse-voice → tampilkan konfirmasi
- Submit form: POST /api/transactions dengan data form
- Setelah berhasil: tampilkan toast "Transaksi berhasil disimpan!" dan reset form
- Error: tampilkan pesan error

---
app/produk/page.tsx — sambungkan ke GET /api/product-analysis:
- Fetch saat mount, tampilkan skeleton loading
- Teruskan data ke komponen daftar produk

---
app/riwayat/page.tsx — sambungkan ke GET /api/transactions + PATCH + DELETE:
- Fetch dengan query params dari filter state
- Filter yang berubah → re-fetch
- Edit: PATCH /api/transactions/[id]
- Hapus: DELETE /api/transactions/[id] → refresh list

---
app/eksperimen/page.tsx — sambungkan ke GET, POST, PATCH /api/experiments:
- Fetch saat mount
- Tombol "Selesaikan" eksperimen → PATCH /api/experiments (hitung current_metric dari transaksi terbaru produk tersebut)
- Tombol "Tambah Eksperimen" → POST /api/experiments

---
app/settings/page.tsx — sambungkan ke GET dan PATCH /api/settings:
- Fetch profil saat mount → isi form dengan data
- Submit form → PATCH /api/settings
- Toast sukses setelah save

---
components/studio/StudioModal.tsx — sambungkan ke POST /api/generate-copy:
- Tombol "Generate Copywriting AI" → POST /api/generate-copy
- Tampilkan 3 variasi dari response

---
components/layout/app-shell.tsx — ganti mockProfile dengan data nyata:
- Fetch GET /api/settings saat mount
- Pass businessName dan ownerName dari response ke Sidebar dan Header
```

---

## PROMPT 11 — Autentikasi Supabase

> **Tujuan**: Tambahkan halaman login dan proteksi route.

```
Tambahkan autentikasi Supabase ke VokaSync:

---
FILE: app/(auth)/login/page.tsx

Halaman login dengan:
- Logo VokaSync di atas
- Judul "Masuk ke VokaSync" + subtitle "AI Business Advisor untuk pedagang UMKM Indonesia"
- Form: Email + Password
- Tombol "Masuk" — gunakan supabase.auth.signInWithPassword()
- Link "Daftar akun baru" (belum fungsional untuk MVP)
- Error handling: tampilkan pesan error dari Supabase
- Setelah login sukses: redirect ke /dashboard
- Desain: kartu putih centered, background gradient hijau muda

---
Perbarui components/layout/sidebar.tsx:
- Tombol Logout: panggil supabase.auth.signOut() → redirect ke /login

---
Perbarui components/layout/app-shell.tsx:
- Tambahkan pengecekan session Supabase
- Jika tidak ada session dan bukan di halaman auth: redirect ke /login
- Untuk nama profil: ambil dari Supabase session user, atau dari /api/settings

---
Perbarui app/page.tsx:
- Cek session dulu, jika ada → redirect /dashboard, jika tidak → redirect /login

CATATAN: Untuk MVP demo, cukup implementasikan email+password login. Tidak perlu signup flow yang lengkap — gunakan Supabase dashboard untuk buat akun demo secara manual.
```

---

## PROMPT 12 — Final Polish & Bug Fix

> **Tujuan**: Rapikan semua detail, pastikan responsive, dan verifikasi build.

```
Lakukan final polish untuk VokaSync sebelum build production:

1. LOADING STATES:
   - Tambahkan skeleton loading card di semua halaman (gunakan animasi pulse abu-abu)
   - Semua tombol: tampilkan spinner saat sedang proses
   - Disable tombol saat loading untuk cegah double-submit

2. ERROR HANDLING:
   - Setiap fetch: tambahkan try/catch dengan pesan error yang user-friendly dalam Bahasa Indonesia
   - Contoh: "Gagal memuat data. Coba lagi nanti." + tombol "Coba Lagi"

3. EMPTY STATES:
   - Riwayat kosong: "Belum ada transaksi yang dicatat. Mulai catat transaksi pertamamu!"
   - Produk kosong: "Belum ada data produk. Catat beberapa transaksi terlebih dahulu."
   - Eksperimen kosong: "Belum ada eksperimen aktif."

4. TOAST NOTIFICATIONS:
   - Berhasil simpan transaksi: "✅ Transaksi berhasil disimpan!"
   - Berhasil hapus: "🗑️ Transaksi dihapus."
   - Berhasil simpan settings: "✅ Pengaturan disimpan."
   - Error: "❌ [pesan error]"
   (Implementasikan dengan state sederhana: { show, message, type } + CSS transition)

5. RESPONSIF:
   - Verifikasi semua halaman tampil benar di: 375px (mobile), 768px (tablet), 1440px (desktop)
   - Pastikan chart tidak overflow di mobile
   - Pastikan tabel riwayat bisa di-scroll horizontal di mobile

6. ACCESSIBILITY DASAR:
   - Semua tombol punya aria-label yang jelas
   - Input punya label (bukan hanya placeholder)
   - Warna kontras cukup

7. VERIFIKASI BUILD:
   - Jalankan: npm run build
   - Fix semua TypeScript error dan ESLint error
   - Pastikan tidak ada 'use client' pada file yang bisa Server Component
   - Pastikan tidak ada env variable server di bundle client

Setelah semua fix, jalankan npm run build lagi dan konfirmasi sukses tanpa error.
```

---

## PROMPT 13 — Deploy ke Vercel

> **Tujuan**: Deploy ke Vercel dan verifikasi live URL.

```
Bantu saya deploy VokaSync ke Vercel:

1. PERSIAPAN GIT:
   - Pastikan .env.local ada di .gitignore dan tidak ter-commit
   - Pastikan tidak ada console.log yang mengekspos API key
   - Commit semua perubahan: git add . && git commit -m "feat: VokaSync MVP complete"

2. VERCEL DEPLOYMENT:
   Instruksikan langkah-langkah untuk:
   a. Push ke GitHub repository
   b. Connect repo ke Vercel (vercel.com → Add New Project)
   c. Set environment variables di Vercel dashboard (Settings → Environment Variables):
      - NEXT_PUBLIC_SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY
      - SUPABASE_SERVICE_ROLE_KEY
      - GEMINI_API_KEY
   d. Deploy (Vercel otomatis detect Next.js, build command: npm run build)

3. POST-DEPLOY VERIFICATION:
   - Test di mobile (375px): navigasi, voice input, chart
   - Test di desktop (1440px): sidebar, layout 3-kolom, modal studio
   - Test flow lengkap: login → catat transaksi voice → lihat dashboard → AI advisor → studio promosi → WA
   - Pastikan akun demo Pak Budi tersedia dengan seed data

4. AKUN DEMO UNTUK JURI:
   Buat instruksi untuk menyiapkan akun demo:
   - Email: demo@vokasync.id / Password: demo2026
   - Pastikan seed_data.sql sudah dijalankan untuk akun ini
   - Data: 14 hari transaksi, 4 produk, 2 eksperimen, beberapa ai_insights
```

---

## Catatan Penting Lintas Semua Prompt

| Aturan | Penjelasan |
|---|---|
| 🔒 API key hanya di server | `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` — **tidak boleh** ada di `components/` atau halaman `'use client'`. Selalu lewat `app/api/` |
| 🧮 Angka hanya dari kalkulasi | Semua margin, profit, severity — dihitung di `lib/calculations/financial.ts`. AI Gemini **hanya menulis narasi teks** berdasarkan angka yang sudah ada |
| 🖼️ Gambar tidak ke server | Background removal: `@imgly/background-removal` dijalankan **sepenuhnya di browser** (WASM). Tidak ada gambar yang dikirim ke server |
| 🗃️ Tidak duplikasi data | Jangan buat tabel untuk data yang bisa dihitung ulang (total, margin, kategori aksi, ringkasan harian) |
| 📱 Responsive first | Setiap komponen harus bekerja di 375px mobile. Sidebar hilang di mobile, ganti bottom nav |
| 🇮🇩 Bahasa konsisten | Semua narasi AI, pesan error, dan UI text dalam **Bahasa Indonesia** yang hangat dan mudah dipahami |
| ⚡ Optimistik UI | Setelah POST berhasil, langsung update state lokal tanpa menunggu re-fetch seluruh data |

---

## Urutan File yang Dibuat per Prompt

```
PROMPT 1  → package.json, app/globals.css, types/index.ts, .env.example
PROMPT 2  → components/layout/sidebar.tsx, bottom-nav.tsx, header.tsx, app-shell.tsx
            app/layout.tsx, app/page.tsx
PROMPT 3  → lib/mock-data/index.ts
            components/dashboard/MetricCard.tsx, TrendChart.tsx, AdvisorCard.tsx,
            SignalFeed.tsx, RecentTransactions.tsx
            app/dashboard/page.tsx
PROMPT 4  → app/catat/page.tsx
PROMPT 5  → app/produk/page.tsx, app/eksperimen/page.tsx,
            app/riwayat/page.tsx, app/settings/page.tsx
PROMPT 6  → components/studio/StudioModal.tsx, public/frames/*.png
PROMPT 7  → supabase/schema/01_profiles.sql s/d 07_experiment_results.sql
            supabase/schema/full_schema.sql, seed_data.sql
PROMPT 8  → lib/supabase/client.ts, lib/supabase/server.ts
            lib/calculations/financial.ts
            lib/ai/gemini.ts, lib/ai/prompts.ts
PROMPT 9  → app/api/parse-voice/route.ts
            app/api/transactions/route.ts, app/api/transactions/[id]/route.ts
            app/api/insights/route.ts
            app/api/product-analysis/route.ts
            app/api/experiments/route.ts
            app/api/settings/route.ts
            app/api/generate-copy/route.ts
PROMPT 10 → UPDATE semua halaman (ganti mock → real API)
            UPDATE components/layout/app-shell.tsx (ganti mock profile → API)
PROMPT 11 → app/(auth)/login/page.tsx
            UPDATE sidebar.tsx (logout), app-shell.tsx (auth guard)
PROMPT 12 → Polish: loading states, error handling, toast, responsive fix, build
PROMPT 13 → Deploy ke Vercel
```

Total: **13 prompt** untuk project VokaSync dari nol hingga production.
