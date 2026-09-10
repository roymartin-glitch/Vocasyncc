# IMPLEMENTATION_PLAN.md — VokaSync

Dokumen pelacakan rencana pengerjaan bertahap VokaSync.
Pendekatan: **Frontend-First** → **Integrasi Supabase** → **AI Engine** → **QA & Build**.

> **STATUS KESELURUHAN**: ✅ **MVP Selesai 100%** — `npm run build` sukses, 17 routes, 0 TypeScript error.

---

## Ringkasan Fase

| Fase | Deskripsi | Status |
|---|---|---|
| FASE 1 | Fondasi & Design System | ✅ Selesai |
| FASE 2 | Frontend-First dengan Mock Data | ✅ Selesai |
| FASE 3 | Backend & Database Integration Supabase | ✅ Selesai |
| FASE 4 | AI Engine & Voice Parsing | ✅ Selesai |
| FASE 5 | Quality Assurance, Security & Build | ✅ Selesai |

---

## ✅ FASE 1: FONDASI & DESIGN SYSTEM

### Tahap 1 — Setup Project Next.js + TypeScript

- [x] Inisialisasi Next.js `16.3.4` (App Router, TypeScript, ESLint)
- [x] Instalasi dependensi:
  - `lucide-react@^1.42.0` — ikon
  - `recharts@^3.10.1` — chart bar tren
  - `@supabase/ssr@^0.12.6` — Supabase SSR helper
  - `@supabase/supabase-js@^2.115.0` — Supabase client
  - `@imgly/background-removal@^1.7.0` — background removal client-side
  - `tailwindcss@^4` — styling
- [x] Design system Quixotic di `app/globals.css`:
  - Background `#F5F5F5`, Card `#FFFFFF`, Hijau Utama `#1A7A4A`
  - CSS custom properties: `--background`, `--card`, `--primary`, `--primary-light`, dll.
- [x] Kontrak tipe data di `types/index.ts`:
  - `Profile`, `Product`, `Transaction`, `TransactionItem`
  - `AIInsight`, `Experiment`, `ExperimentResult`, `ExperimentMetric`
  - `ProductAnalysisItem`, `DashboardMetrics`, `TrendDayData`
  - Enum types: `BusinessType`, `TransactionType`, `SeverityLevel`, dll.
- [x] Setup `.env.local` dan `.env.example` dengan 4 variable:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`
- [x] `.env.local` terdaftar di `.gitignore`

### Tahap 2 — Layout Global & Navigasi Responsif

- [x] **`components/layout/sidebar.tsx`** — Sidebar desktop (240px) & tablet (64px icon-only)
  - Menu: Beranda, Catat, Produk, Eksperimen, Riwayat, Settings
  - Menu aktif: background `--primary-light`, teks & ikon `--primary`
  - Ikon Logout di bawah
- [x] **`components/layout/bottom-nav.tsx`** — Bottom navigation 4 tab mobile
  - Tab: Beranda, Catat, Produk, Eksperimen
  - Tab aktif: hijau, non-aktif: abu-abu
- [x] **`components/layout/header.tsx`** — Header adaptif
  - Desktop: sapaan nama + date picker + tombol Catat Transaksi
  - Mobile: nama app + ikon riwayat & settings
- [x] **`components/layout/app-shell.tsx`** — Shell pembungkus global (gabungkan sidebar + header + bottom nav)
- [x] **`app/layout.tsx`** — Root layout yang mount AppShell untuk semua halaman

---

## ✅ FASE 2: FRONTEND-FIRST DENGAN MOCK DATA

Semua halaman dibangun dengan data mock statis dari `lib/mock-data/index.ts` sebelum Supabase disambungkan. Tujuan: memvalidasi UI & UX lebih cepat.

### Tahap 3 — UI Beranda / Dashboard — `app/dashboard/page.tsx`

- [x] **`components/dashboard/MetricCard.tsx`** — 4 kartu metrik
  - Pemasukan hari ini, Pengeluaran hari ini, Keuntungan bersih, Margin
  - Badge % perubahan dibanding kemarin (hijau/merah)
- [x] **`components/dashboard/TrendChart.tsx`** — BarChart Recharts
  - Tren pemasukan vs pengeluaran 7 hari terakhir
  - Format rupiah di tooltip
- [x] **`components/dashboard/AdvisorCard.tsx`** — Kartu AI Advisor
  - Badge severity (merah/kuning/hijau)
  - Teks narasi insight
  - Tombol "Buat Promosi WA" (kondisional, muncul jika `has_quick_action = true`)
- [x] **`components/dashboard/SignalFeed.tsx`** — Feed sinyal terbaru
  - Dot warna severity
  - Waktu relatif ("2 jam lalu", "kemarin")
- [x] **`components/dashboard/RecentTransactions.tsx`** — Tabel transaksi terbaru
  - Nama produk, jenis, jumlah, total, waktu
- [x] Layout desktop 3-kolom & mobile single-column

### Tahap 4 — UI Catat Transaksi — `app/catat/page.tsx`

- [x] Tombol mikrofon besar
- [x] Tampilan transkrip suara mentah
- [x] Divider "atau input manual"
- [x] Toggle segmented: Pengeluaran vs Pemasukan
- [x] Field: produk (autocomplete), jumlah, satuan, total bayar
- [x] Preview hasil parsing sebelum simpan
- [x] Tombol CTA "Simpan transaksi"

### Tahap 5 — UI Analisis Produk — `app/produk/page.tsx`

- [x] Bubble AI insight perbandingan produk
- [x] Daftar produk: nama, badge kategori aksi, progress bar margin, volume/hari
- [x] Badge warna: Dorong (hijau), Pertahankan (biru), Perbaiki (kuning), Kurangi (merah)
- [x] Layout 2-kolom desktop, single-column mobile

### Tahap 6 — UI Riwayat Transaksi — `app/riwayat/page.tsx`

- [x] Filter: rentang tanggal, jenis transaksi, nama produk
- [x] Search nama produk
- [x] Tabel desktop / kartu mobile
- [x] Tombol edit dan hapus per transaksi
- [x] Konfirmasi sebelum hapus

### Tahap 7 — UI Eksperimen Bisnis — `app/eksperimen/page.tsx`

- [x] Kartu status Selesai (hijau): sub-kartu Sebelum vs Sesudah + verdict AI
- [x] Kartu status Berjalan (oranye): indikator "hari X/Y" + Target vs Sekarang
- [x] Bubble rekomendasi AI (ikon bohlam)

### Tahap 8 — UI Settings & Profil Toko — `app/settings/page.tsx`

- [x] Form: nama toko, nama pemilik, jenis usaha (dropdown), ambang batas margin
- [x] Tombol Simpan perubahan
- [x] Tombol Logout

### Tahap 9 — UI & Client-Side AI Virtual Studio — `components/studio/StudioModal.tsx`

- [x] Upload/ambil foto dari galeri
- [x] Preview background removal real-time (`@imgly/background-removal`)
- [x] Pilihan 3 template frame (Minimalis, Pasar Tradisional, Kriya/Fashion)
- [x] Canvas API: overlay frame ke foto
- [x] Preview + edit 3 variasi copywriting
- [x] Tombol "Kirim ke WhatsApp" → `wa.me` URL scheme

---

## ✅ FASE 3: BACKEND & DATABASE INTEGRATION SUPABASE

### Tahap 10 — Setup Supabase & Client Helper

- [x] **`lib/supabase/client.ts`** — `createBrowserClient()` untuk komponen `'use client'`
- [x] **`lib/supabase/server.ts`** — `createServerClient()` untuk API routes + `createAdminClient()` service-role

### Tahap 11 — Skema Database PostgreSQL & Seed Data

File SQL tersimpan di `supabase/schema/`:

- [x] **`full_schema.sql`** — Schema lengkap dengan semua tabel + RLS policies
- [x] 7 tabel terverifikasi di Supabase:
  - `profiles` — identitas + ambang batas margin
  - `products` — master nama produk
  - `transactions` — header kejadian transaksi
  - `transaction_items` — rincian per produk (sumber kebenaran angka)
  - `ai_insights` — riwayat narasi AI (bukan angka)
  - `experiments` — definisi tindakan + baseline snapshot
  - `experiment_results` — checkpoint & evaluasi hasil
- [x] RLS Policies aktif pada seluruh tabel (`user_id = auth.uid()`)
- [x] **`seed_data.sql`** — Data demo realistis berhasil dimasukkan untuk akun Pak Budi

### Tahap 12 — Logika Kalkulasi & API Routes

**Kalkulasi deterministik — `lib/calculations/financial.ts`**

- [x] `calculateMargin(costPrice, sellingPrice)` → margin %
- [x] `determineActionCategory(margin, threshold)` → `'dorong'|'pertahankan'|'perbaiki'|'kurangi'`
- [x] `determineSeverity(margin, threshold)` → `{ severity, hasQuickAction }`
- [x] `build7DayTrend(transactionsWithItems)` → `TrendDayData[]` untuk Recharts

**API Routes yang diimplementasikan:**

- [x] **`app/api/transactions/route.ts`** — `GET` (filter list) + `POST` (simpan baru)
- [x] **`app/api/transactions/[id]/route.ts`** — `PATCH` (koreksi) + `DELETE` (hapus, cascade)
- [x] **`app/api/insights/route.ts`** — `GET`: kalkulasi deterministik + narasi Gemini + simpan `ai_insights`
- [x] **`app/api/product-analysis/route.ts`** — `GET`: margin & kategori aksi per produk (7 hari)
- [x] **`app/api/experiments/route.ts`** — `GET` + `POST` + `PATCH` eksperimen
- [x] **`app/api/settings/route.ts`** — `GET` + `PATCH` profil + `margin_alert_threshold`

**Wiring halaman ke API routes (ganti mock data → real data):**

- [x] `app/dashboard/page.tsx` → `GET /api/insights`
- [x] `app/catat/page.tsx` → `POST /api/transactions`
- [x] `app/produk/page.tsx` → `GET /api/product-analysis`
- [x] `app/riwayat/page.tsx` → `GET /api/transactions`, `PATCH`, `DELETE`
- [x] `app/eksperimen/page.tsx` → `GET /api/experiments`, `POST`, `PATCH`
- [x] `app/settings/page.tsx` → `GET /api/settings`, `PATCH`

---

## ✅ FASE 4: AI ENGINE & VOICE PARSING

### Tahap 13 — Voice Parsing Nyata dengan Google Gemini Flash

- [x] **`lib/ai/gemini.ts`** — Inisialisasi Gemini SDK, helper `generateContent()`
- [x] **`lib/ai/prompts.ts`** — Template prompt:
  - `getParseVoicePrompt(transcript)` → JSON transaksi
  - `getDailyAdvisorPrompt(ownerName, metrics)` → narasi insight
  - `getExperimentVerdictPrompt(...)` → verdict evaluasi
  - `getMarketingCopyPrompt(productName, storeName, style)` → copywriting WA
- [x] **`app/api/parse-voice/route.ts`** — POST: terima transkrip → prompt → Gemini → JSON `{ product_name, quantity, unit, total_price, type }` → kembalikan ke client untuk konfirmasi

### Tahap 14 — AI Insights & Marketing Copywriting Nyata

- [x] **`app/api/generate-copy/route.ts`** — POST: `{ productName, storeName, style }` → Gemini → 3 variasi teks promosi WhatsApp (gaya: pasar / fomo / elegan). **Tidak disimpan ke DB** — ephemeral.
- [x] **`app/api/experiments/route.ts` PATCH** — Integrasi Gemini verdict: hitung selisih margin baseline vs current → `getExperimentVerdictPrompt()` → INSERT `experiment_results` dengan `ai_verdict_text`

---

## ✅ FASE 5: QUALITY ASSURANCE, SECURITY & BUILD

### Tahap 15 — Security & Verification

- [x] `GEMINI_API_KEY` hanya di server — **tidak ada** di file `components/` atau halaman client
- [x] `SUPABASE_SERVICE_ROLE_KEY` hanya di server — tidak pernah diekspos ke bundle client
- [x] `.env.local` terdaftar di `.gitignore`
- [x] Semua API routes menggunakan `createServerClient` (session-aware), bukan `createBrowserClient`
- [x] RLS aktif dan diverifikasi — data antar akun tidak bocor

### Tahap 16 — Production Build Verification

- [x] `npm run build` sukses 100%
  - **17 routes** terbangun tanpa error
  - **0 TypeScript error**
  - **0 ESLint error kritikal**

---

## 🔲 FASE 6: DEPLOYMENT (Belum Dilakukan)

### Tahap 17 — Deploy ke Vercel

- [ ] Push repository ke GitHub (pastikan `.env.local` tidak ikut)
- [ ] Hubungkan repo ke project baru di Vercel
- [ ] Set 4 environment variables di Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
- [ ] Trigger deploy → verifikasi build sukses di Vercel
- [ ] Verifikasi Live URL dari perangkat mobile dan desktop
- [ ] Siapkan akun uji coba dengan seed data Pak Budi siap untuk demo juri

---

## Panduan Cepat untuk AI Coding Agent Baru

Jika kamu adalah AI coding agent yang baru bergabung ke project ini, baca urutan berikut:

1. **Baca `AGENTS.md`** di root — berisi instruksi khusus untuk AI agent (versi Next.js ini breaking changes dari versi lama).
2. **Baca `PRD.md`** — pahami produk, fitur, dan user flow secara lengkap.
3. **Baca `TECHNICAL_SPEC.md`** — pahami arsitektur, database schema, API routes, dan alur sistem.
4. **Lihat struktur folder aktual** di `app/`, `components/`, `lib/`, `types/`, `supabase/schema/`.
5. **Pahami tipe data** di `types/index.ts` sebelum membuat atau mengubah komponen apapun.
6. **Jangan buat tabel baru** untuk data yang bisa dihitung dari `transaction_items` (total, margin, kategori aksi).
7. **Jangan panggil Gemini dari client** — selalu lewat API routes di `app/api/`.
8. **Gunakan `lib/calculations/financial.ts`** untuk semua kalkulasi margin, severity, dan tren — jangan duplikasi logika di tempat lain.
