# 🟢 VokaSync — AI Business Advisor & Visual Marketing untuk UMKM & Pedagang Pasar

**Kompetisi**: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)  
**Subtema**: SDGs 9 — Industry, Innovation, and Infrastructure (Sustainable Innovation)  
**Status**: ✅ Production Ready (100% Selesai & Teruji)

---

## 📖 Tentang VokaSync

VokaSync adalah aplikasi web AI Business Advisor cerdas yang dirancang khusus untuk pedagang pasar tradisional dan pelaku UMKM mikro (kuliner rumahan, pengrajin kriya, pedagang komoditas basah, dan warung kelontong) yang produknya tidak berscan barcode dan belum memiliki pencatatan terstruktur.

Dengan filosofi **Closed-Loop Advisory**, VokaSync mengubah input suara alami pedagang menjadi pencatatan transaksi terstruktur, menganalisis margin keuntungan secara deterministik, memantau batch stok fisik (FIFO), serta memberikan peringatan proaktif sebelum masalah finansial menjadi kritis.

---

## ✨ Fitur Utama

- 🎙️ **Smart Voice Transaction**: Catat penjualan & belanja modal cukup dengan berbicara natural (didukung filter peredam obrolan & auto-registrasi komoditas baru).
- 🔊 **Voice Audio Feedback (TTS)**: Asisten berbicara ramah mengonfirmasi transaksi tersimpan secara otomatis.
- 📊 **AI Business Advisor Proaktif**: Menjelaskan akar masalah (*root-cause*) kondisi keuangan dalam bahasa Indonesia yang akrab dan mudah dipahami.
- 📦 **Manajemen Inventaris FIFO & Peringatan Stok Fisik**: Peringatan dini saat stok komoditas menipis (kg/pcs).
- 📲 **1-Klik Rekap WhatsApp**: Bagikan ringkasan performa harian dan laporan berkala langsung ke WhatsApp via URL scheme `wa.me`.
- 📈 **Laporan Keuangan & Cetak Fisik**: Rekapitulasi finansial multi-periode dengan format siap cetak (`window.print`).
- 🎨 **AI Virtual Studio**: Hapus background foto produk secara instan di browser (WASM lokal) + pasang frame studio + copywriting promosi otomatis dari Google Gemini.

---

## 🛠️ Tech Stack & Arsitektur (Komitmen Rp0 Biaya Langganan)

- **Framework**: Next.js 16.3.4 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (Palet Dark Emerald Modern)
- **Database & Auth**: Supabase PostgreSQL dengan Row-Level Security (RLS)
- **Storage**: Supabase Storage Bucket (`product-images`)
- **AI Engine**: Google Gemini Flash (Server-Side)
- **Voice Engine**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Segmentasi Foto**: `@imgly/background-removal` (100% Client-Side WASM)
- **Grafik**: Recharts BarChart

---

## 📚 Dokumentasi Proyek

Tiga pilar dokumentasi resmi proyek ini tersedia di root folder:
1. **[PRD.md](PRD.md)** — Definisi visi produk, target persona, use case, dan pemetaan SDGs 9.
2. **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** — Spesifikasi teknis arsitektur, skema 8 tabel database, endpoint API, dan alur sistem.
3. **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** — Pelacakan pengerjaan bertahap dari Fase 1 hingga Fase 7 beserta kriteria pengujian.

---

## 🚀 Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat
- Node.js versi 18 ke atas
- Akun Supabase & Google AI Studio API Key (Free Tier)

### 2. Instalasi & Setup Environment
```bash
# Clone repositori
git clone https://github.com/roymartin-glitch/Vocasyncc.git
cd Vocasyncc

# Install dependensi
npm install

# Buat file konfigurasi env
cp .env.example .env.local
```

Isi variabel pada `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```

### 3. Setup Database
Jalankan skema lengkap di SQL Editor Supabase:
```
supabase/schema/full_schema.sql
```
*(Opsional untuk keperluan demo penjurian)*: Jalankan `supabase/schema/seed_data.sql`.

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 5. Setup Akun Demo (Opsional untuk Presentasi)

Akun demo memungkinkan juri atau evaluator mencoba aplikasi dengan data realistis yang tersimpan di database Supabase real.

**Kredensial Demo:**
- **Email:** demo@vokasync.id
- **Password:** demovokasync123
- **UUID:** 34f9e50b-d4ba-41b1-807d-7807eb5e0d77

**Cara Setup:**
```bash
# 1. Buat user demo di Supabase Auth Dashboard
# Email: demo@vokasync.id, Password: demovokasync123
# UUID sudah di-set: 34f9e50b-d4ba-41b1-807d-7807eb5e0d77

# 2. Jalankan script setup di Supabase SQL Editor
# Copy-paste isi file: supabase/schema/setup_demo_account.sql
# Klik "Run"

# 3. Test login dengan akun demo
# Verifikasi: Dashboard menampilkan data Kios Berkah Sayur
```

**Reset Data Demo (Sebelum Presentasi):**
```bash
# Jalankan di Supabase SQL Editor
# File: supabase/schema/reset_demo_account.sql
# Kemudian re-run: setup_demo_account.sql
```

### 6. Build Produksi
```bash
npm run build
```
Semua 22 routes terkompilasi sukses dengan 0 TypeScript error.
