# PRD.md — VokaSync

**Product Requirements Document**
Proyek: VokaSync — AI Business Advisor & Visual Marketing untuk Pedagang & UMKM Indonesia
Kompetisi: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)
Subtema: SDGs 9 — Industry, Innovation, and Infrastructure (Sustainable Innovation)

> **STATUS IMPLEMENTASI**: ✅ MVP Selesai 100% — Build production sukses, 17 routes, 0 TypeScript error.

---

## 1. Gambaran VokaSync

VokaSync adalah aplikasi web AI Business Advisor yang dirancang khusus untuk pedagang pasar tradisional dan pelaku UMKM mikro — termasuk pelaku kuliner rumahan dan pengrajin kriya/fashion — yang produknya tidak discan dan tidak memiliki sistem pencatatan apapun. VokaSync **bukan** kasir/POS, **bukan** aplikasi akuntansi, dan **bukan** marketplace/procurement.

Konsep inti produk adalah sebuah loop advisory tertutup yang dilengkapi dengan aksi pemasaran langsung (closed-loop action):

```
BICARA → AI CATAT TRANSAKSI → SISTEM HITUNG KONDISI BISNIS → AI ANALISIS
→ AI MEMBERI PERINGATAN → AI MEMBERI REKOMENDASI → USER MELAKUKAN TINDAKAN
→ SISTEM TRACKING HASIL → AI MENGEVALUASI HASIL
         ↓ (jika margin tergerus)
QUICK-ACTION: BUAT PROMOSI WA → AI VIRTUAL STUDIO → FOTO PRODUK PROFESIONAL
→ COPYWRITING PROMOSI → KIRIM VIA WHATSAPP DIRECT
```

Pengguna cukup berbicara natural ke aplikasi untuk mencatat transaksi (dengan opsi input manual sebagai cadangan). Sistem kemudian menghitung kondisi bisnis, menganalisis profitabilitas per produk, memberi peringatan **sebelum** pengguna membuka aplikasi dan bertanya (proaktif), menjelaskan akar masalah (root-cause), memberi rekomendasi tindakan konkret, lalu melacak dan mengevaluasi hasil dari tindakan tersebut.

---

## 2. Masalah yang Diselesaikan

- Pedagang pasar sibuk dari subuh sampai siang — tidak sempat mencatat transaksi secara manual.
- Tools pencatatan yang ada tidak cocok untuk pedagang yang produknya tidak discan dan belum melek keuangan.
- Pedagang tidak tahu produk mana yang paling **menguntungkan** — hanya tahu yang paling **laris** (laris tidak sama dengan untung).
- Margin keuntungan tergerus perlahan tanpa disadari, baru diketahui setelah modal menipis.
- Tidak ada sistem yang memperingatkan pengguna lebih dulu sebelum masalah menjadi parah.
- Tidak ada tempat untuk melihat dan mengoreksi transaksi yang sudah dicatat.
- UMKM kuliner rumahan dan pengrajin kriya/fashion kesulitan membuat materi promosi produk yang terlihat profesional.
- Tidak ada jembatan langsung antara peringatan bisnis (margin tergerus) dengan aksi pemulihan penjualan.

---

## 3. Target Pengguna

| Segmen | Karakteristik |
|---|---|
| Pedagang pasar tradisional | Penjual bawang, sayur, bumbu, ikan, daging. Sibuk sejak subuh, tangan kotor, tidak sempat mengetik. |
| UMKM kuliner rumahan | Warung kue, katering kecil, penjual gorengan, kedai kopi. Produk beragam, harga bahan fluktuatif. |
| Pengrajin kriya & fashion | Pembuat kerajinan tangan, konveksi kecil, penjual produk fashion lokal. Butuh foto produk profesional. |
| Warung kelontong & sembako | Beli dari grosir, jual eceran, ratusan item, tidak tahu produk paling untung. |
| Pedagang kaki lima | Tidak punya tempat/sistem tetap, butuh pencatatan sambil berdagang. |

Benang merah: **produk yang dijual tidak discan, belum memiliki sistem pencatatan, dan berpotensi meningkatkan penjualan melalui promosi visual yang profesional.**

Relevansi SDGs 9: VokaSync menjangkau segmen UMKM Kuliner Rumahan dan Pengrajin Kriya/Fashion guna mendukung fokus **Optimalisasi Industri Kreatif** dalam kerangka SDGs 9.

Persona acuan: **Pak Budi**, pedagang bawang di Pasar Minggu, Jakarta; dan **Bu Sari**, pelaku UMKM kuliner rumahan.

---

## 4. Tujuan Aplikasi

1. Memungkinkan pencatatan transaksi tanpa hambatan melalui input suara Bahasa Indonesia.
2. Memberikan visibilitas kondisi bisnis harian (pemasukan, pengeluaran, keuntungan, margin) secara otomatis.
3. Menunjukkan profitabilitas per produk agar pengguna tahu produk mana yang layak didorong, dipertahankan, diperbaiki, atau dikurangi.
4. Memberikan peringatan proaktif sebelum kerugian terjadi, disertai penjelasan root-cause dalam bahasa awam.
5. Menutup loop advisory dengan rekomendasi tindakan yang dapat dieksekusi, dilacak, dan dievaluasi hasilnya.
6. Menyediakan riwayat transaksi yang dapat dilihat dan dikoreksi pengguna kapan saja.
7. Menyediakan halaman pengaturan profil dan preferensi aplikasi.
8. Menyediakan jembatan langsung antara peringatan bisnis dan aksi pemasaran melalui AI Virtual Studio & Instant Marketing.

---

## 5. Fitur Utama MVP (Sudah Diimplementasikan)

MVP terdiri dari **6 halaman utama** ditambah 1 modul Quick-Action. Semua halaman sudah selesai dibangun dan terhubung ke Supabase + Gemini:

1. **Voice input Bahasa Indonesia** — `app/catat/page.tsx` — via Web Speech API + Gemini parsing, dengan **input manual sebagai fallback**.
2. **Beranda (Dashboard)** — `app/dashboard/page.tsx` — ringkasan bisnis harian, chart tren 7 hari, AI Advisor card, sinyal terbaru, tabel transaksi terbaru.
3. **Catat Transaksi** — `app/catat/page.tsx` — form voice + manual, toggle pengeluaran/pemasukan, konfirmasi parsing.
4. **Analisis Produk** — `app/produk/page.tsx` — profitabilitas per produk dengan kategori aksi (Dorong/Pertahankan/Perbaiki/Kurangi).
5. **Eksperimen Bisnis** — `app/eksperimen/page.tsx` — tracking tindakan yang direkomendasikan AI, evaluasi hasil sebelum/sesudah.
6. **Riwayat Transaksi** — `app/riwayat/page.tsx` — daftar semua transaksi, filter, koreksi/hapus.
7. **Settings/Profil** — `app/settings/page.tsx` — nama toko, nama pemilik, ambang batas peringatan margin.
8. **AI Virtual Studio** — `components/studio/StudioModal.tsx` — background removal client-side → frame studio → copywriting Gemini → WhatsApp Direct.

---

## 6. User Flow

```
1. User membuka aplikasi → tiba di Beranda (app/dashboard/page.tsx)
   → melihat ringkasan hari ini + chart tren + peringatan AI + sinyal terbaru

2. User menekan tombol "Catat Transaksi"
   → mengucapkan transaksi secara natural, ATAU mengisi form manual
   → memilih jenis: Pengeluaran atau Pemasukan
   → konfirmasi hasil parsing (jika voice) → simpan ke Supabase

3. Sistem menghitung ulang kondisi bisnis berdasarkan transaksi baru
   (fungsi di lib/calculations/financial.ts dipanggil oleh API routes)

4. Jika AI mendeteksi margin tergerus:
   → tombol Quick-Action "Buat Promosi WA" muncul di kartu AI Advisor
   → user membuka AI Virtual Studio (StudioModal.tsx) → foto produk →
     background removal (@imgly/background-removal, client-side) →
     frame studio → copywriting Gemini → kirim WhatsApp (wa.me)

5. User membuka Riwayat (app/riwayat/page.tsx)
   → melihat semua transaksi yang pernah dicatat
   → mengoreksi atau menghapus transaksi yang salah

6. User membuka Produk (app/produk/page.tsx)
   → melihat margin dan kategori aksi tiap produk
   → membaca insight AI perbandingan antar produk

7. User membuka Eksperimen (app/eksperimen/page.tsx)
   → menjalankan rekomendasi tindakan AI
   → sistem melacak hasil dari transaksi berikutnya
   → AI mengevaluasi hasilnya (Gemini verdict via /api/experiments PATCH)

8. User membuka Settings (app/settings/page.tsx)
   → memperbarui nama toko, nama pemilik
   → mengubah ambang batas peringatan margin (default 20%)
```

---

## 7. Struktur Navigasi

### Desktop & Tablet (Sidebar Kiri) — `components/layout/sidebar.tsx`

Sidebar fixed di sebelah kiri, mengadopsi gaya Quixotic:

| Menu | Ikon | Route |
|---|---|---|
| Beranda | rumah | `/dashboard` |
| Catat | tambah/dokumen | `/catat` |
| Produk | bar chart | `/produk` |
| Eksperimen | tabung reaksi | `/eksperimen` |
| Riwayat | jam/history | `/riwayat` |
| Settings | gear | `/settings` |

- Desktop (≥1024px): sidebar 240px, ikon + label teks, fixed.
- Tablet (768px–1023px): sidebar collapse menjadi 64px icon-only tanpa label teks.

### Mobile / HP (≤767px) — Bottom Navigation — `components/layout/bottom-nav.tsx`

Bottom navigation tetap dengan 4 tab inti yang paling sering dipakai:

| Tab | Ikon | Route |
|---|---|---|
| Beranda | rumah | `/dashboard` |
| Catat | tambah | `/catat` |
| Produk | bar chart | `/produk` |
| Eksperimen | tabung reaksi | `/eksperimen` |

Riwayat dan Settings di mobile diakses melalui ikon di header Beranda (ikon history dan ikon gear di pojok kanan atas) — diimplementasikan di `components/layout/header.tsx`.

---

## 8. Referensi Visual UI

### Gaya Visual Utama (Implementasi Aktual)

VokaSync mengadopsi gaya visual dari referensi **Quixotic Dashboard**, didefinisikan di `app/globals.css`:

```css
--background: #f5f5f5;      /* abu-abu sangat terang */
--foreground: #1e293b;      /* teks gelap */
--card: #ffffff;             /* kartu putih bersih */
--primary: #1a7a4a;          /* hijau utama */
--primary-foreground: #ffffff;
--primary-light: #eaf6ee;   /* hijau muda untuk badge/aktif */
--primary-dark: #125734;
--muted: #64748b;
--border: #e2e8f0;
```

- **Mode**: Light mode penuh.
- **Warna aksen utama**: Hijau `#1A7A4A` — sidebar aktif, badge positif, tombol CTA utama, chart.
- **Kartu**: rounded corners, shadow tipis, padding lega.
- **Tipografi**: angka metrik besar dan tebal; label kecil abu-abu muted.
- **Badge perubahan**: hijau `+` untuk naik, merah untuk turun.
- **Chart**: `recharts` BarChart, warna hijau tren pemasukan vs pengeluaran.

### Layout Desktop (≥1024px)

```
┌──────────┬────────────────────────────────────────────┐
│          │  Header: "Selamat datang, Pak Budi"        │
│ Sidebar  │  + date picker + tombol Catat Transaksi    │
│  Kiri    ├──────────────┬─────────────┬───────────────┤
│  240px   │ Kartu Metrik │ Chart Bar   │ Kartu         │
│          │ (Pemasukan,  │ Tren 7 Hari │ AI Advisor    │
│ - Beranda│ Pengeluaran, │ (Recharts)  │ + Quick-Action│
│ - Catat  │ Keuntungan,  ├─────────────┤               │
│ - Produk │ Margin)      │ Tabel       │               │
│ - Eksperi│              │ Transaksi   │               │
│ - Riwayat│              │ Terbaru     │               │
│ - Setting│              │             │               │
└──────────┴──────────────┴─────────────┴───────────────┘
```

### Layout Mobile (≤767px)

- Single column, scroll vertikal.
- Header: nama app + ikon notifikasi + ikon riwayat + ikon settings.
- Kartu AI Advisor (full width).
- Grid 2×2 kartu metrik kecil.
- Chart bar ringkas (scroll horizontal jika overflow).
- Daftar sinyal terbaru.
- Bottom navigation 4 tab di bawah.

---

## 9. Detail Setiap Halaman

### 9.1 Beranda — `app/dashboard/page.tsx`

**Desktop:** Grid 3 kolom — kiri (kartu metrik besar + badge perubahan), tengah (chart bar tren mingguan + tabel transaksi terbaru), kanan (kartu AI Advisor + sinyal terbaru).

**Mobile:** Single column — AI Advisor → grid metrik 2×2 → chart ringkas → sinyal terbaru.

Komponen yang dipakai:
- `components/dashboard/MetricCard.tsx` — 4 kartu: Pemasukan, Pengeluaran, Keuntungan, Margin — masing-masing dengan badge % perubahan dibanding kemarin.
- `components/dashboard/TrendChart.tsx` — BarChart Recharts tren 7 hari.
- `components/dashboard/AdvisorCard.tsx` — insight proaktif + badge severity + tombol Quick-Action "Buat Promosi WA" (kondisional jika `has_quick_action = true`).
- `components/dashboard/SignalFeed.tsx` — feed kronologis dari `ai_insights`.
- `components/dashboard/RecentTransactions.tsx` — tabel transaksi terbaru.

Data diambil dari: `GET /api/insights` (metrik + narasi AI) dan `GET /api/transactions` (transaksi terbaru).

### 9.2 Catat Transaksi — `app/catat/page.tsx`

**Desktop:** Panel/modal di tengah layar dengan backdrop.
**Mobile:** Layar overlay penuh.

Komponen wajib:
- Tombol mikrofon besar — voice input via Web Speech API (native browser).
- Tampilan transkrip suara mentah.
- Divider "atau input manual".
- Toggle segmented: Pengeluaran vs Pemasukan.
- Field: Produk/bahan baku (autocomplete dari `products` di Supabase), Jumlah, Satuan, Total bayar.
- Konfirmasi hasil parsing (JSON dari `/api/parse-voice`) sebelum simpan.
- Tombol CTA "Simpan transaksi" → `POST /api/transactions`.

### 9.3 Analisis Produk — `app/produk/page.tsx`

**Desktop:** Layout 2 kolom — kiri daftar produk, kanan detail produk yang dipilih + insight AI.
**Mobile:** Single column — AI Advisor insight → daftar produk dengan badge dan progress bar.

Data dari: `GET /api/product-analysis`.

Komponen wajib:
- Bubble AI Advisor insight perbandingan antar produk.
- Daftar produk: nama, badge kategori aksi berwarna, progress bar margin %, volume terjual/hari.
- Kategori aksi: **Dorong** (hijau, margin ≥35%), **Pertahankan** (biru, margin ≥threshold), **Perbaiki** (kuning, margin ≥10%), **Kurangi** (merah, margin <10%).

### 9.4 Eksperimen — `app/eksperimen/page.tsx`

**Desktop & Mobile:** Daftar kartu eksperimen.

Data dari: `GET /api/experiments`, update via `PATCH /api/experiments`.

Komponen wajib:
- Kartu status **Selesai** (hijau): sub-kartu Sebelum vs Sesudah + verdict AI naratif dari Gemini.
- Kartu status **Berjalan** (oranye): indikator "hari X/Y" + sub-kartu Target vs Sekarang.
- Bubble rekomendasi AI (ikon bohlam) di bawah.

### 9.5 Riwayat Transaksi — `app/riwayat/page.tsx`

**Desktop:** Tabel dengan kolom lengkap + filter & search di atas.
**Mobile:** Daftar kartu transaksi, masing-masing dapat di-tap untuk detail/koreksi.

Data dari: `GET /api/transactions` (dengan filter). Edit via `PATCH /api/transactions/[id]`, hapus via `DELETE /api/transactions/[id]`.

Komponen wajib:
- Filter: rentang tanggal, jenis (pengeluaran/pemasukan), nama produk.
- Search nama produk.
- Setiap baris/kartu: tanggal, nama produk, jumlah, satuan, total, jenis (badge).
- Tombol koreksi (edit) dan hapus pada setiap transaksi.
- Konfirmasi sebelum hapus.

### 9.6 Settings / Profil — `app/settings/page.tsx`

**Desktop & Mobile:** Form pengaturan sederhana.

Data dari: `GET /api/settings`. Simpan via `PATCH /api/settings`.

Komponen wajib:
- Nama toko (edit) → `profiles.business_name`.
- Nama pemilik (edit) → `profiles.owner_name` — dipakai untuk sapaan di Beranda.
- Jenis usaha (dropdown) → `profiles.business_type`: `pasar` | `kuliner` | `kriya` | `kelontong` | `lainnya`.
- Ambang batas peringatan margin (input angka %, default 20%) → `profiles.margin_alert_threshold`.
- Tombol Simpan perubahan.
- Tombol Logout.

### 9.7 AI Virtual Studio — `components/studio/StudioModal.tsx`

Diakses dari tombol "Buat Promosi WA" di kartu AI Advisor Beranda (kondisional, muncul jika `has_quick_action = true`).

Komponen wajib:
- Tombol ambil foto dari galeri/kamera.
- Preview background removal real-time (client-side, `@imgly/background-removal` v1.7.0).
- Pilihan template frame studio (3 frame: Minimalis, Pasar Tradisional, Kriya/Fashion) — aset PNG di `public/frames/`.
- Preview foto + frame hasil akhir (Canvas API overlay).
- Area preview dan edit 3 variasi copywriting dari Gemini (`POST /api/generate-copy`).
- Tombol "Kirim ke WhatsApp" (URL scheme `wa.me`).

---

## 10. AI Advisor

Karakteristik wajib:
- **Proaktif**: muncul otomatis saat halaman dibuka (dipanggil di `app/dashboard/page.tsx` saat mount).
- **Root-cause**: menjelaskan *kenapa* kondisi terjadi, bukan hanya menyatakan gejalanya.
- **Actionable**: disertai badge severity dan tombol/arah tindakan konkret.
- **Bahasa awam**: menyapa pengguna dengan `profiles.owner_name`, tanpa istilah akuntansi teknis.

Pipeline AI Advisor:
1. Server hitung metrik deterministik (margin, profit, tren) dari `transaction_items` — di `lib/calculations/financial.ts`.
2. Server tentukan `severity` dan `has_quick_action` — aturan if-else deterministik, **bukan oleh AI**.
3. Server kirim angka ke Gemini → Gemini hanya menyusun narasi teks.
4. Narasi + severity disimpan ke `ai_insights` dan ditampilkan di Beranda.

Severity logic (di `lib/calculations/financial.ts` → `determineSeverity()`):
- `margin < threshold` → `red`, `has_quick_action: true`
- `margin < threshold + 5` → `yellow`, `has_quick_action: false`
- `margin >= threshold + 5` → `green`, `has_quick_action: false`

---

## 11. Use Case

| ID | Use Case | Aktor | Implementasi |
|---|---|---|---|
| UC-01 | Melihat ringkasan bisnis harian & chart tren | Pengguna | `app/dashboard` + `/api/insights` |
| UC-02 | Menerima peringatan proaktif AI | Pengguna | `AdvisorCard.tsx` + `ai_insights` |
| UC-03 | Mencatat transaksi via suara | Pengguna | `app/catat` + Web Speech API + `/api/parse-voice` |
| UC-04 | Mencatat transaksi via input manual | Pengguna | `app/catat` → `POST /api/transactions` |
| UC-05 | Melihat sinyal bisnis terbaru | Pengguna | `SignalFeed.tsx` + `ai_insights` |
| UC-06 | Melihat analisis profitabilitas produk | Pengguna | `app/produk` + `/api/product-analysis` |
| UC-07 | Melihat rekomendasi tindakan bisnis | Pengguna | `AdvisorCard.tsx` |
| UC-08 | Menjalankan/menandai eksperimen | Pengguna | `app/eksperimen` → `POST /api/experiments` |
| UC-09 | Melihat hasil evaluasi eksperimen | Pengguna | `app/eksperimen` + `experiment_results` |
| UC-10 | Melihat riwayat semua transaksi | Pengguna | `app/riwayat` + `GET /api/transactions` |
| UC-11 | Mengoreksi atau menghapus transaksi | Pengguna | `PATCH /api/transactions/[id]` + `DELETE` |
| UC-12 | Mengubah profil dan pengaturan | Pengguna | `app/settings` + `/api/settings` |
| UC-13 | Mengatur ambang batas peringatan margin | Pengguna | `profiles.margin_alert_threshold` |
| UC-14 | Membuat foto produk via AI Virtual Studio | Pengguna | `StudioModal.tsx` + `@imgly/background-removal` |
| UC-15 | Mengirim promosi ke WhatsApp | Pengguna | URL scheme `wa.me` |
| UC-16 | Sistem menghitung ulang metrik bisnis | Sistem (otomatis) | `lib/calculations/financial.ts` |
| UC-17 | Sistem mem-parsing teks suara via Gemini | Sistem (otomatis) | `/api/parse-voice` + `lib/ai/prompts.ts` |
| UC-18 | Sistem menghasilkan copywriting promosi | Sistem (otomatis) | `/api/generate-copy` + `lib/ai/prompts.ts` |

---

## 12. Batasan / Tidak Masuk MVP

- Multi-pengguna, multi-cabang, atau multi-role dalam satu akun.
- Integrasi supplier/procurement eksternal.
- WhatsApp Business API berbayar — cukup URL scheme `wa.me`.
- Sistem akuntansi lengkap (neraca, laporan pajak, buku besar).
- Integrasi barcode/scan produk atau OCR nota fisik.
- Notifikasi push lintas platform.
- Multi-bahasa/multi-dialek untuk voice input — cukup Bahasa Indonesia umum.
- Export laporan ke PDF/Excel.
- Pengeditan foto lanjutan di AI Virtual Studio (filter, crop, resize manual).

---

## 13. Kriteria Keberhasilan MVP

| # | Kriteria | Status |
|---|---|---|
| 1 | Pencatatan transaksi via voice dan manual berfungsi, data tersimpan ke Supabase | ✅ |
| 2 | Beranda menampilkan angka yang terhitung ulang otomatis setiap ada transaksi baru | ✅ |
| 3 | Chart tren 7 hari terakhir menampilkan data nyata dari Supabase | ✅ |
| 4 | AI Advisor menampilkan insight proaktif dengan penjelasan root-cause | ✅ |
| 5 | Tab Produk menampilkan margin dan kategori aksi yang berbeda-beda antar produk | ✅ |
| 6 | Tab Eksperimen menampilkan minimal satu eksperimen selesai dan satu berjalan | ✅ |
| 7 | Halaman Riwayat menampilkan semua transaksi yang dapat diedit/dihapus | ✅ |
| 8 | Halaman Settings menyimpan perubahan profil dan ambang batas peringatan | ✅ |
| 9 | AI Virtual Studio: background removal, frame, copywriting, dan WhatsApp Direct berfungsi | ✅ |
| 10 | Tampilan responsive: desktop (sidebar 240px), tablet (64px icon-only), mobile (bottom nav) | ✅ |
| 11 | `npm run build` sukses 100% — 17 routes, 0 TypeScript error | ✅ |
| 12 | Aplikasi ter-deploy di Live URL publik dengan akun uji coba siap pakai | 🔲 Deploy ke Vercel |

---

## 14. Tech Stack Aktual

| Komponen | Teknologi | Versi Aktual | Alasan |
|---|---|---|---|
| Framework Fullstack | Next.js (App Router, TypeScript) | `16.3.4` | SSR + API Route untuk keamanan API key. |
| Runtime Frontend | React | `19.2.8` | — |
| Styling | Tailwind CSS v4 | `^4` | Layout responsive: sidebar desktop, bottom nav mobile. |
| Chart | Recharts | `^3.10.1` | BarChart tren 7 hari. |
| Icon | lucide-react | `^1.42.0` | Ikon konsisten. |
| Database & Auth | Supabase (PostgreSQL + Auth) | `@supabase/supabase-js ^2.115.0` | RLS untuk isolasi data. |
| Supabase SSR | `@supabase/ssr` | `^0.12.6` | Client & server helper untuk Next.js. |
| AI — Voice Parsing | Google Gemini Flash | Free Tier | Parsing transkrip suara ke JSON via `/api/parse-voice`. |
| AI — Insight & Copy | Google Gemini Flash | Free Tier | Narasi AI Advisor, verdict eksperimen, copywriting. |
| Voice Recognition | Web Speech API | Native browser | Transkripsi ucapan gratis, tanpa upload audio. |
| Background Removal | `@imgly/background-removal` | `^1.7.0` | 100% client-side, tidak ada gambar dikirim ke server. |
| WhatsApp Integration | URL Scheme `wa.me` | — | Tanpa WhatsApp Business API berbayar. |
| Deployment | Vercel | — | CD otomatis dari GitHub. |

**Komitmen arsitektur Rp0:** Seluruh komponen dipilih agar VokaSync beroperasi tanpa biaya langganan API berbayar.

Detail arsitektur dan skema database lengkap: lihat `TECHNICAL_SPEC.md`.
