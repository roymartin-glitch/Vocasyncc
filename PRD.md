# PRD.md — VokaSync

**Product Requirements Document**
Proyek: VokaSync — AI Business Advisor & Visual Marketing untuk Pedagang & UMKM Indonesia
Kompetisi: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)
Subtema: SDGs 9 — Industry, Innovation, and Infrastructure (Sustainable Innovation)

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

## 5. Fitur Utama MVP

MVP terdiri dari **6 halaman utama** ditambah 1 modul Quick-Action:

1. **Voice input Bahasa Indonesia** untuk mencatat transaksi, dengan **input manual sebagai fallback**.
2. **Beranda (Dashboard)**: ringkasan bisnis harian, chart tren, AI Advisor, dan sinyal terbaru.
3. **Catat Transaksi**: form voice + manual, toggle pengeluaran/pemasukan.
4. **Analisis Produk**: profitabilitas per produk dengan kategori aksi (Dorong/Pertahankan/Perbaiki/Kurangi).
5. **Eksperimen Bisnis**: tracking tindakan yang direkomendasikan AI, evaluasi hasil sebelum/sesudah.
6. **Riwayat Transaksi**: daftar semua transaksi yang pernah dicatat, dengan kemampuan koreksi/hapus.
7. **Settings/Profil**: ubah nama toko, nama pemilik, password, dan ambang batas peringatan.
8. **AI Virtual Studio & Instant Marketing** (Quick-Action dari Beranda): background removal client-side → frame studio → copywriting Gemini → WhatsApp Direct.

---

## 6. User Flow

```
1. User membuka aplikasi → tiba di Beranda
   → melihat ringkasan hari ini + chart tren + peringatan AI + sinyal terbaru

2. User menekan tombol "Catat Transaksi"
   → mengucapkan transaksi secara natural, ATAU mengisi form manual
   → memilih jenis: Pengeluaran atau Pemasukan
   → konfirmasi hasil parsing (jika voice) → simpan

3. Sistem menghitung ulang kondisi bisnis berdasarkan transaksi baru

4. Jika AI mendeteksi margin tergerus:
   → tombol Quick-Action "Buat Promosi WA" muncul di kartu AI Advisor
   → user membuka AI Virtual Studio → foto produk → background removal →
     frame studio → copywriting → kirim WhatsApp

5. User membuka Riwayat
   → melihat semua transaksi yang pernah dicatat
   → mengoreksi atau menghapus transaksi yang salah

6. User membuka Produk
   → melihat margin dan kategori aksi tiap produk
   → membaca insight AI perbandingan antar produk

7. User membuka Eksperimen
   → menjalankan rekomendasi tindakan AI
   → sistem melacak hasil dari transaksi berikutnya
   → AI mengevaluasi hasilnya

8. User membuka Settings
   → memperbarui nama toko, nama pemilik
   → mengubah ambang batas peringatan margin
```

---

## 7. Struktur Navigasi

### Desktop & Tablet (Sidebar Kiri)

Sidebar fixed di sebelah kiri, mengadopsi gaya Quixotic:

| Menu | Ikon | Fungsi |
|---|---|---|
| Beranda | rumah | Dashboard utama |
| Catat | tambah/dokumen | Input transaksi |
| Produk | bar chart | Analisis profitabilitas |
| Eksperimen | tabung reaksi | Tracking tindakan |
| Riwayat | jam/history | Daftar semua transaksi |
| Settings | gear | Profil & preferensi |

Tablet (768px–1023px): sidebar collapse menjadi icon-only tanpa label teks.

### Mobile / HP (≤767px) — Bottom Navigation

Bottom navigation tetap dengan 4 tab inti yang paling sering dipakai:

| Tab | Ikon | Fungsi |
|---|---|---|
| Beranda | rumah | Dashboard utama |
| Catat | tambah | Input transaksi |
| Produk | bar chart | Analisis profitabilitas |
| Eksperimen | tabung reaksi | Tracking tindakan |

Riwayat dan Settings di mobile diakses melalui ikon di header Beranda (ikon history dan ikon gear di pojok kanan atas), bukan melalui bottom nav — agar bottom nav tidak terlalu penuh.

---

## 8. Referensi Visual UI

### Gaya Visual Utama

VokaSync mengadopsi gaya visual dari referensi **Quixotic Dashboard**:

- **Mode**: Light mode penuh — background aplikasi abu-abu sangat terang (`#F5F5F5`), kartu putih bersih.
- **Warna aksen utama**: Hijau (`#1A7A4A` atau senada dengan Quixotic) — dipakai pada sidebar aktif, badge positif, tombol CTA utama, dan chart.
- **Kartu**: rounded corners, shadow tipis, padding lega — whitespace diutamakan.
- **Tipografi**: angka metrik ditampilkan besar dan tebal; label kecil abu-abu.
- **Badge perubahan**: hijau dengan tanda `+` untuk naik, merah untuk turun — sesuai gaya Quixotic.
- **Chart**: bar chart dengan warna hijau bertingkat untuk tren pemasukan vs pengeluaran.

### Layout Desktop (≥1024px) — Mengacu Quixotic

```
┌──────────┬────────────────────────────────────────────┐
│          │  Header: "Selamat datang, Pak Budi"        │
│ Sidebar  │  + date picker + tombol Catat Transaksi    │
│  Kiri    ├──────────────┬─────────────┬───────────────┤
│          │ Kartu Metrik │ Chart Bar   │ Kartu         │
│ - Beranda│ (Pemasukan,  │ Tren        │ AI Advisor    │
│ - Catat  │ Pengeluaran, │ Mingguan    │ + Quick-Action│
│ - Produk │ Keuntungan,  │             │               │
│ - Eksperi│ Margin)      ├─────────────┤               │
│ - Riwayat│              │ Tabel       │               │
│ - Setting│              │ Transaksi   │               │
│          │              │ Terbaru     │               │
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

### 9.1 Beranda

**Desktop:** Grid 3 kolom — kiri (kartu metrik besar + badge perubahan), tengah (chart bar tren mingguan + tabel transaksi terbaru), kanan (kartu AI Advisor + sinyal terbaru).

**Mobile:** Single column — AI Advisor → grid metrik 2×2 → chart ringkas → sinyal terbaru.

Komponen wajib:
- Sapaan personal menggunakan `profiles.owner_name`.
- 4 kartu metrik: Pemasukan hari ini, Pengeluaran hari ini, Keuntungan bersih, Margin hari ini — masing-masing dengan angka besar dan badge % perubahan dibanding kemarin.
- Chart bar tren 7 hari terakhir: pemasukan vs pengeluaran per hari.
- Kartu AI Advisor: insight proaktif + badge severity + tombol Quick-Action "Buat Promosi WA" (kondisional).
- Sinyal terbaru: feed kronologis dari `ai_insights`, dengan dot warna severity dan waktu relatif.

### 9.2 Catat Transaksi

**Desktop:** Panel/modal di tengah layar dengan backdrop.
**Mobile:** Layar overlay penuh.

Komponen wajib:
- Tombol mikrofon besar — voice input via Web Speech API.
- Tampilan transkrip suara mentah.
- Divider "atau input manual".
- Toggle segmented: Pengeluaran vs Pemasukan.
- Field: Produk/bahan baku (autocomplete), Jumlah, Satuan, Total bayar.
- Konfirmasi hasil parsing sebelum simpan (untuk voice).
- Tombol CTA "Simpan transaksi".

### 9.3 Analisis Produk

**Desktop:** Layout 2 kolom — kiri daftar produk, kanan detail produk yang dipilih + insight AI.
**Mobile:** Single column — AI Advisor insight → daftar produk dengan badge dan progress bar.

Komponen wajib:
- Bubble AI Advisor insight perbandingan antar produk.
- Daftar produk: nama, badge kategori aksi berwarna (Dorong/Pertahankan/Perbaiki/Kurangi), progress bar margin, volume terjual/hari, margin %.

### 9.4 Eksperimen

**Desktop & Mobile:** Daftar kartu eksperimen.

Komponen wajib:
- Kartu status Selesai (hijau): sub-kartu Sebelum vs Sesudah + verdict AI naratif.
- Kartu status Berjalan (oranye): indikator "hari X/Y" + sub-kartu Target vs Sekarang.
- Bubble rekomendasi AI (ikon bohlam) di bawah.

### 9.5 Riwayat Transaksi (Halaman Baru)

**Desktop:** Tabel dengan kolom lengkap + filter & search di atas.
**Mobile:** Daftar kartu transaksi, masing-masing dapat di-tap untuk detail/koreksi.

Komponen wajib:
- Filter berdasarkan: rentang tanggal, jenis (pengeluaran/pemasukan), nama produk.
- Search nama produk.
- Setiap baris/kartu transaksi menampilkan: tanggal, nama produk, jumlah, satuan, total, jenis (badge).
- Tombol koreksi (edit) dan hapus pada setiap transaksi.
- Konfirmasi sebelum hapus.
- Pagination atau infinite scroll untuk data banyak.

### 9.6 Settings / Profil (Halaman Baru)

**Desktop & Mobile:** Form pengaturan sederhana.

Komponen wajib:
- Nama toko (edit).
- Nama pemilik (edit) — dipakai untuk sapaan di Beranda.
- Jenis usaha (dropdown: Pasar Tradisional / Kuliner Rumahan / Kriya & Fashion / Kelontong / Lainnya).
- Ambang batas peringatan margin (input angka %, default 20%) — dipakai sistem untuk menentukan `severity`.
- Ubah password.
- Tombol Simpan perubahan.
- Tombol Logout.

### 9.7 AI Virtual Studio (Modal Quick-Action)

Diakses dari tombol "Buat Promosi WA" di kartu AI Advisor Beranda.

Komponen wajib:
- Tombol ambil foto dari galeri/kamera.
- Preview background removal real-time (client-side, `@imgly/background-removal`).
- Pilihan template frame studio (minimal 3: Minimalis, Pasar Tradisional, Kriya/Fashion).
- Preview foto + frame hasil akhir.
- Area preview dan edit copywriting dari Gemini.
- Tombol "Kirim ke WhatsApp" (URL scheme `wa.me`).

---

## 10. AI Advisor

Karakteristik wajib:
- **Proaktif**: muncul otomatis saat halaman dibuka.
- **Root-cause**: menjelaskan *kenapa* kondisi terjadi, bukan hanya menyatakan gejalanya.
- **Actionable**: disertai badge severity dan tombol/arah tindakan konkret.
- **Bahasa awam**: menyapa pengguna dengan nama, tanpa istilah akuntansi teknis.

Sumber data: hasil kalkulasi margin deterministik dari `transactions`/`transaction_items` — AI hanya menerima angka yang sudah dihitung, lalu menyusun narasi.

Severity ditentukan **deterministik oleh sistem** (bukan oleh AI) berdasarkan margin dibandingkan ambang batas yang diatur pengguna di Settings.

---

## 11. Use Case

| ID | Use Case | Aktor |
|---|---|---|
| UC-01 | Melihat ringkasan bisnis harian & chart tren | Pengguna |
| UC-02 | Menerima peringatan proaktif AI | Pengguna |
| UC-03 | Mencatat transaksi via suara | Pengguna |
| UC-04 | Mencatat transaksi via input manual | Pengguna |
| UC-05 | Melihat sinyal bisnis terbaru | Pengguna |
| UC-06 | Melihat analisis profitabilitas produk | Pengguna |
| UC-07 | Melihat rekomendasi tindakan bisnis | Pengguna |
| UC-08 | Menjalankan/menandai eksperimen | Pengguna |
| UC-09 | Melihat hasil evaluasi eksperimen | Pengguna |
| UC-10 | Melihat riwayat semua transaksi | Pengguna |
| UC-11 | Mengoreksi atau menghapus transaksi | Pengguna |
| UC-12 | Mengubah profil dan pengaturan | Pengguna |
| UC-13 | Mengatur ambang batas peringatan margin | Pengguna |
| UC-14 | Membuat foto produk via AI Virtual Studio | Pengguna |
| UC-15 | Mengirim promosi ke WhatsApp | Pengguna |
| UC-16 | Sistem menghitung ulang metrik bisnis | Sistem (otomatis) |
| UC-17 | Sistem mem-parsing teks suara via Gemini | Sistem (otomatis) |
| UC-18 | Sistem menghasilkan copywriting promosi | Sistem (otomatis) |

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

1. Pencatatan transaksi via voice dan manual berfungsi dan data tersimpan ke Supabase.
2. Beranda menampilkan angka yang terhitung ulang otomatis setiap ada transaksi baru.
3. Chart tren 7 hari terakhir menampilkan data nyata dari Supabase.
4. AI Advisor menampilkan insight proaktif dengan penjelasan root-cause.
5. Tab Produk menampilkan margin dan kategori aksi yang berbeda-beda antar produk.
6. Tab Eksperimen menampilkan minimal satu eksperimen selesai dan satu berjalan.
7. Halaman Riwayat menampilkan semua transaksi yang dapat diedit/dihapus.
8. Halaman Settings menyimpan perubahan profil dan ambang batas peringatan.
9. AI Virtual Studio: background removal, frame, copywriting, dan WhatsApp Direct berfungsi.
10. Tampilan responsive: desktop (sidebar), tablet (sidebar icon-only), mobile (bottom nav).
11. Seluruh demo dapat dijalankan dalam 2–3 menit tanpa hambatan teknis.
12. Aplikasi ter-deploy di Live URL publik dengan akun uji coba siap pakai.

---

## 14. Referensi Tech Stack

| Komponen | Teknologi | Alasan |
|---|---|---|
| Framework Fullstack | Next.js 14+ (React/TypeScript) | SSR + API Route untuk keamanan API key. |
| Styling | Tailwind CSS | Implementasi layout responsive (sidebar desktop, bottom nav mobile). |
| Database & Auth | Supabase (PostgreSQL) + Supabase Auth | RLS untuk isolasi data antar pengguna. |
| Deployment | Vercel | CD otomatis dari GitHub. |
| AI — Voice Parsing | Google Gemini 3.6 Flash (`app/api/parse-voice/route.ts`) | Digunakan khusus untuk parsing transkrip suara menjadi data transaksi terstruktur. |
| AI — Insight & Copywriting | Google Gemini 3.6 Flash (Free Tier) | Digunakan untuk narasi AI Advisor, verdict eksperimen, dan copywriting promosi AI Virtual Studio. |
| Voice Recognition | Web Speech API (native browser) | Gratis, berjalan di browser tanpa server. |
| Background Removal | `@imgly/background-removal` (open-source) | 100% client-side, tidak ada upload ke server eksternal. |
| WhatsApp Integration | URL Scheme `wa.me` | Tidak memerlukan WhatsApp Business API berbayar. |
| Chart | Recharts atau Chart.js | Library open-source untuk chart bar tren. |

**Komitmen arsitektur Rp0:** Seluruh komponen dipilih agar VokaSync beroperasi tanpa biaya langganan API berbayar.

Detail arsitektur dan skema database: TECHNICAL_SPEC.md.
