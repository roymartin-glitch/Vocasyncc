# VokaSync — Voice-First Financial AI Advisor & Visual Marketing Studio untuk UMKM Pasar

> **Inovasi Digital Inklusif (SDGs 9: Industry, Innovation, and Infrastructure)**  
> *Bukan sekadar kasir (POS), melainkan Asisten Keuangan & Strategi Bisnis Cerdas Berbasis Suara bagi Pedagang Komoditas Mikro.*

---

## 🎯 1. Tujuan & Latar Belakang

Di pasar tradisional dan usaha mikro, mayoritas pedagang menjual komoditas basah/curah (sayuran, cabai, daging, bumbu dapur, buah, dan sembako) yang **tidak memiliki barcode**. Saat jam sibuk pasar, tangan pedagang basah atau memegang timbangan, sehingga **mustahil mengetik manual** di aplikasi kasir konvensional. Akibatnya, lebih dari 80% pedagang pasar tidak memiliki catatan keuangan, tidak tahu pasti keuntungan harian, dan rentan merugi akibat harga modal yang fluktuatif.

**VokaSync hadir untuk mengatasi masalah ini:**
1. **Menghapus Hambatan Input:** Pedagang cukup berbicara santai dalam bahasa Indonesia sehari-hari untuk mencatat penjualan maupun belanja modal secara instan.
2. **Memberikan Navigasi Keuangan Riil:** Menghitung laba bersih, margin riil, dan evaluasi stok secara otomatis tanpa perlu pemahaman akuntansi yang rumit.
3. **Meningkatkan Daya Saing Pasar Tradisional:** Memberdayakan pedagang dengan rekomendasi tindakan bisnis proaktif berbasis AI dan materi promosi visual profesional langsung dari HP.

---

## ⚖️ 2. Perbedaan Mendasar: VokaSync vs Aplikasi Kasir (POS) Konvensional

Banyak pedagang mengira semua aplikasi pencatatan itu sama. Tabel ini menjelaskan mengapa VokaSync berbeda secara fundamental dari aplikasi kasir biasa:

| Aspek | Aplikasi Kasir Biasa (POS) | VokaSync (Voice-First AI Advisor) |
| :--- | :--- | :--- |
| **Metode Input** | Wajib mengetik, mencari nama barang di layar, atau scan barcode produk berkemasan. | **Voice-First (Suara Sehari-hari)**: Cukup bicara *"Jual cabai 3 kilo 120 ribu"* atau *"Belanja kangkung 10 ikat 50 ribu"*. Tangan basah/kotor bukan kendala. |
| **Karakter Produk** | Dirancang untuk barang pabrikan/retail dengan SKU dan barcode tetap. | **Dioptimalkan untuk komoditas curah & pasar basah** (sayur, daging, buah, sembako) dengan satuan kg, ikat, karung, pcs, karpet, ekor. |
| **Peran Sistem** | **Pasif**: Hanya mencatat transaksi dan menjumlahkan total nominal uang. | **Proaktif & Advisory**: AI menganalisis jika margin produk menipis atau rugi, lalu memberikan solusi konkret (misal: penyesuaian harga jual, paket *bundling*). |
| **Interaksi AI & Audio** | Tidak ada panduan suara, teks kaku dan teknis. | **AI Asisten Berbicara (Audio TTS)** yang menyapa hangat sesuai waktu (Pagi/Siang/Sore/Malam) dan membacakan kondisi usaha secara lisan. |
| **Pengelolaan Laba Rugi** | Laporan statis di akhir bulan yang rumit dipahami pedagang awam. | **Real-Time Margin Tracking**: Langsung mendeteksi apakah harga jual hari ini menutup modal belanja pagi tadi secara detik itu juga. |
| **Dukungan Pemasaran** | Tidak ada fitur pembuatan konten promosi. | **Studio Pemasaran AI**: Hapus latar belakang foto produk otomatis (WASM lokal) & hasilkan teks promo siap sebar ke WhatsApp pelanggan. |

---

## 👥 3. Target Pengguna

VokaSync dirancang spesifik untuk pelaku ekonomi mikro:
1. **Pedagang Pasar Tradisional:** Kios sayur mayur, lapak daging & ayam potong, pedagang cabai/bawang, kios buah musiman, dan toko sembako.
2. **Pelaku Usaha Kuliner Mikro & Warung Makan:** Warung kelontong, warteg, kedai kopi kecil, dan pedagang kaki lima (PKL) yang belanja stok harian di pasar subuh.
3. **Pemasok Komoditas Rumahan:** Peternak telur skala rumahan, distributor bumbu giling, dan agen bahan pokok lokal.

---

## 🚀 4. Keunggulan Utama VokaSync

### 🎙️ 1. Input Suara Cerdas (Speech-to-Transaction)
- Ditenagai Web Speech API dengan peredam jeda dan filter noise.
- Cerdas membedakan transaksi **Uang Masuk (Penjualan)** dan **Uang Keluar (Belanja Modal)** secara otomatis dari konteks kalimat.
- Dilengkapi konfirmasi suara lisan dan form koreksi cepat di tempat (*in-place edit*).

### 📊 2. Visualisasi Tren Finansial Kapsul Modern
- Grafik 7 hari terakhir bergaya **Capsule Pill Bar** dengan arsir diagonal halus.
- Palet warna finansial kontras tinggi: **Uang Masuk (Hijau Zamrud `#00875A`)** berdampingan dengan **Uang Keluar (Sunset Amber `#EA580C`)**.
- Cepat dibaca dan dipahami sekilas bahkan di bawah terik matahari pasar.

### 🧠 3. Closed-Loop AI Advisory (Gemini AI Engine)
- Menghitung margin deterministik tanpa risiko halusinasi angka.
- Memberikan peringatan dini jika harga beli komoditas melonjak tetapi harga jual belum disesuaikan.
- Rekomendasi tindakan nyata yang disesuaikan dengan data riil toko Anda (tersedia fitur uji coba/eksperimen strategi harga).

### 🧾 4. Struk Digital Resmi (WhatsApp & PDF Thermal)
- Setiap transaksi dapat langsung dicetak struk fisiknya (format kertas kasir) atau dikirim dalam 1 klik ke WhatsApp pelanggan dalam format pesan rapi beridentitas toko.

### ⚡ 5. Performa Super Ringan (0ms Load Time & Hemat Baterai)
- Menggunakan arsitektur *Session Storage Caching*: Dashboard dan riwayat terbuka seketika tanpa layar tunggu (*loading spinner*).
- Kueri database Supabase dijalankan secara paralel (`Promise.all`) dengan latensi rendah (<200ms).
- Desain antarmuka mobile-first responsif yang pas di layar HP Android tanpa terpotong navigasi.

### 🎨 6. Studio Pemasaran Visual Tanpa Kuota Server
- Fitur penghapusan background foto produk dijalankan langsung di memori HP pengguna menggunakan WebAssembly lokal (`@imgly/background-removal`).
- Nol biaya server tambahan, privat, dan menghasilkan poster promosi jualan yang menarik.

---

## 🛠️ 5. Arsitektur & Tumpukan Teknologi

- **Frontend & Routing:** Next.js (App Router, Server Components & Client Hooks) + TypeScript
- **Styling UI:** Tailwind CSS (Mobile-First responsive layout)
- **Database & Auth:** Supabase PostgreSQL dengan Row-Level Security (RLS)
- **Model Kecerdasan Buatan:** Google Gemini API (Structured JSON & Contextual Advisor)
- **Audio & Suara:** Web Speech API (`SpeechRecognition` untuk telinga, `SpeechSynthesis` untuk suara asisten)
- **Pemrosesan Gambar Lokal:** WebAssembly (WASM) background segmentation
- **Visualisasi Data:** Recharts dengan kustomisasi SVG Capsule Pattern

---

## 💻 6. Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js versi 18.x atau lebih baru
- Akun Supabase (Tersedia tier gratis)
- Google Gemini API Key

### Langkah Pemasangan
1. **Clone repositori:**
   ```bash
   git clone https://github.com/roymartin-glitch/Vocasyncc.git
   cd Vocasyncc
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (`.env.local`):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   GEMINI_API_KEY=AIzaSy...
   ```

4. **Inisialisasi Database:**
   Jalankan script SQL yang tersedia di `supabase/schema/full_schema.sql` pada SQL Editor Supabase Anda.

5. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:3000`.

6. **Verifikasi Build Produksi:**
   ```bash
   npm run build
   ```
   *Lolos 100% dengan 0 TypeScript error pada seluruh rute aplikasi.*

---

## 📄 Lisensi
Dikembangkan untuk mendukung kemandirian dan digitalisasi berkelanjutan pelaku UMKM Indonesia. Hak cipta dilindungi undang-undang.
