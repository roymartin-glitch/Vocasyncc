# VokaSync — AI Business Advisor & Studio Pemasaran Visual UMKM

**Kompetisi**: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)  
**Subtema**: SDGs 9 — Industry, Innovation, and Infrastructure (Sustainable Innovation)  
**Status**: Production Ready (Teruji & Siap Digunakan)

---

## Tentang VokaSync

VokaSync adalah aplikasi web asisten bisnis cerdas berbasis AI yang dikembangkan khusus untuk pedagang pasar tradisional dan pelaku usaha mikro kecil (UMKM). Sebagian besar pedagang mikro belum menggunakan pencatatan terstruktur dan menjual komoditas tanpa barcode (seperti sayur, buah, bumbu dapur, dan sembako).

VokaSync menerapkan pendekatan **Closed-Loop Advisory**:
1. **Input Suara Bahasa Sehari-hari**: Pedagang cukup berbicara santai untuk mencatat transaksi tanpa perlu repot mengetik.
2. **Kalkulasi Deterministik**: Perhitungan margin, valuasi stok metode FIFO, dan deteksi stok menipis dihitung langsung secara presisi tanpa halusinasi AI.
3. **Analisis Akar Masalah (Root-Cause Advisory)**: AI menganalisis performa bisnis dan memberikan saran operasional yang konkret dalam bahasa Indonesia yang ramah dan mudah dimengerti.
4. **Studio Pemasaran Mandiri**: Mengubah foto barang biasa menjadi materi promosi profesional berlatar rapi dengan teks pemasaran otomatis untuk WhatsApp dan media sosial.

---

## Fitur Utama

- **Pencatatan Berbasis Suara (Voice-to-Transaction)**: Integrasi Web Speech API dengan filter pembersih jeda/pengulangan kata, deteksi otomatis komoditas baru, serta konfirmasi suara ramah via Text-to-Speech.
- **Konfirmasi Cerdas & Fuzzy Matching**: Mengenali kemiripan nama barang yang diucapkan dengan daftar barang yang sudah ada di toko untuk mencegah duplikasi data.
- **Inventaris & Pelacakan Stok FIFO**: Pemantauan sisa stok fisik dan pengingat stok menipis secara otomatis setiap kali ada transaksi belanja atau penjualan.
- **AI Business Advisor Proaktif**: Rekomendasi tindakan bisnis harian (evaluasi produk slow-moving, peringatan margin tipis, dan saran restok) ditenagai Google Gemini.
- **Fitur Uji Coba Bisnis (Eksperimen Diskon)**: Simulasi dan pelacakan dampak diskon atau promosi terhadap laba bersih toko.
- **Rekap Otomatis WhatsApp & Laporan Cetak**: Pembuatan pesan ringkasan kas siap kirim ke WhatsApp via tautan `wa.me`, serta laporan keuangan multi-periode yang siap cetak fisik (`window.print`).
- **Studio Pemasaran Visual (AI Studio)**: Segmentasi penghapus latar belakang foto produk langsung di browser pengguna (WASM lokal) tanpa biaya server, dilengkapi pilihan template dan generator kalimat promosi.

---

## Arsitektur & Teknologi

Aplikasi dirancang dengan komitmen biaya infrastruktur terjangkau (Rp0 biaya langganan berbayar):

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database & Otentikasi**: Supabase PostgreSQL dengan Row-Level Security (RLS)
- **Penyimpanan Berkas**: Supabase Storage Bucket (`product-images`)
- **Model Bahasa (AI)**: Google Gemini API (Server-Side Route Handlers)
- **Pemrosesan Suara**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) bawaan browser
- **Segmentasi Gambar**: `@imgly/background-removal` (Eksekusi WebAssembly di sisi klien)
- **Visualisasi Data**: Recharts

---

## Dokumentasi Teknis

Dokumentasi lengkap perancangan sistem tersedia di repositori ini:
- **[PRD.md](PRD.md)**: Product Requirement Document, target persona, alur interaksi pengguna, dan pemetaan SDGs 9.
- **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)**: Arsitektur teknis, skema relasional tabel database, spesifikasi API endpoint, dan mitigasi keamanan.
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)**: Rencana dan riwayat implementasi modul dari tahap fondasi hingga finalisasi.

---

## Panduan Menjalankan Aplikasi

### 1. Prasyarat Sistem
- Node.js versi 18 atau lebih baru
- Akun Supabase (Tersedia tier gratis)
- API Key Google AI Studio (Gemini)

### 2. Pemasangan Dependensi
```bash
# Clone repositori
git clone https://github.com/roymartin-glitch/Vocasyncc.git
cd Vocasyncc

# Pasang dependensi
npm install
```

### 3. Konfigurasi Environment
Salin berkas konfigurasi lingkungan:
```bash
cp .env.example .env.local
```

Lengkapi variabel berikut pada `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```

### 4. Setup Database
Buka SQL Editor pada dashboard proyek Supabase Anda, lalu jalankan isi berkas:
```
supabase/schema/full_schema.sql
```
*(Opsional)* Jalankan `supabase/schema/seed_data.sql` jika ingin mengisi data awal untuk kebutuhan pengujian.

### 5. Menjalankan Server Lokal
```bash
npm run dev
```
Aplikasi dapat diakses melalui peramban di `http://localhost:3000`.

### 6. Uji Kompilasi Produksi
```bash
npm run build
```
Seluruh 24 rute halaman dan API berhasil terkompilasi dengan 0 TypeScript error.
