# 🤖 Kiro AI - Perubahan & Script Setup Demo

Folder ini berisi file-file yang dibuat oleh Kiro AI untuk setup akun demo VokaSync.

---

## 📄 File yang Tersedia

### 1. `setup_demo_account_FIXED.sql`
Script SQL untuk setup akun demo dengan data lengkap (produk, transaksi, AI insights, eksperimen).

**✅ Perbaikan dari versi sebelumnya:**
- `business_type` diperbaiki dari `'Sayur & Buah'` menjadi `'pasar'` sesuai constraint database
- UUID sudah di-set: `34f9e50b-d4ba-41b1-807d-7807eb5e0d77`

**Kredensial Demo:**
- Email: `demo@vokasync.id`
- Password: `demovokasync123`

---

## 🚀 Cara Menggunakan

### Step 1: Buat User Demo di Supabase Auth
1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add User"
3. Isi:
   - Email: `demo@vokasync.id`
   - Password: `demovokasync123`
4. Klik "Create User"
5. **PENTING:** Pastikan UUID yang dibuat adalah `34f9e50b-d4ba-41b1-807d-7807eb5e0d77`
   - Jika UUID berbeda, edit file `setup_demo_account_FIXED.sql` line 8

### Step 2: Jalankan Script Setup
1. Buka Supabase Dashboard → SQL Editor
2. Copy seluruh isi file `setup_demo_account_FIXED.sql`
3. Paste ke SQL Editor
4. Klik "Run"
5. Tunggu hingga muncul pesan `✅ SETUP COMPLETED!`

### Step 3: Test Login Demo
1. Buka aplikasi VokaSync
2. Klik tombol "Coba Demo Gratis (Pak Budi)"
3. Atau login manual:
   - Email: `demo@vokasync.id`
   - Password: `demovokasync123`

### Step 4: Verifikasi Data
Pastikan semua data muncul:
- ✅ Dashboard: Metrik keuangan (Uang Masuk, Untung Bersih, dll)
- ✅ Halaman Produk: 6 produk (Bawang Merah, Cabai, Tomat, Kangkung, Ayam, Telur)
- ✅ Riwayat: 8 transaksi historis
- ✅ Catat transaksi baru: Tersimpan ke database real

---

## 🔧 Troubleshooting

### Error: "column image_url does not exist"
**Penyebab:** Database belum sync dengan skema terbaru.  
**Solusi:** ✅ File `setup_demo_account_FIXED.sql` sudah diperbaiki, tidak pakai kolom `image_url`.

### Error: "column theme does not exist"
**Penyebab:** Database belum sync dengan skema terbaru.  
**Solusi:** ✅ File `setup_demo_account_FIXED.sql` sudah diperbaiki, tidak pakai kolom `theme`.

### Error: "business_type violates check constraint"
**Penyebab:** Constraint hanya terima: `pasar`, `kuliner`, `kriya`, `kelontong`, `lainnya`.  
**Solusi:** ✅ File `setup_demo_account_FIXED.sql` sudah diperbaiki, pakai `'pasar'`.

### Data demo tidak muncul setelah login
**Solusi:** 
1. Cek UUID user demo di Supabase Auth Dashboard
2. Pastikan UUID di script SQL sama dengan UUID di database
3. Jalankan ulang script setup

**📖 Detail lengkap:** Lihat file `kiro-ai/TROUBLESHOOTING.md`

---

## 📊 Data yang Di-Seed

### Profile
- **Nama Pemilik:** Pak Budi
- **Nama Toko:** Kios Berkah Sayur
- **Jenis Usaha:** pasar (Pedagang Pasar Tradisional)

### Produk (6 items)
1. Bawang Merah Brebes (kg)
2. Cabai Rawit Merah (kg)
3. Tomat Buah Segar (kg)
4. Kangkung Segar (ikat)
5. Ayam Potong Segar (kg)
6. Telur Ayam Negeri (kg)

### Transaksi (8 records)
- 1x Belanja modal (7 hari lalu): Rp3.990.000
- 3x Penjualan kemarin: Rp338.000
- 4x Penjualan hari ini: Rp179.000 income + Rp60.000 expense

### Stock Batches (6 FIFO entries)
Tracking stok fisik untuk setiap produk dengan metode FIFO.

### AI Insights (2 recommendations)
- Peringatan: Margin Cabai Rawit 17% (di bawah target 20%)
- Positif: Margin Bawang Merah 25% (sehat)

### Eksperimen (1 running)
"Naikkan Harga Cabai Rawit +Rp2.000"

---

## 🎯 Keuntungan Setup Akun Demo Real

1. ✅ **Transaksi demo tersimpan permanen** (tidak hilang saat refresh)
2. ✅ **Juri bisa test semua fitur** (catat, edit, delete, upload foto)
3. ✅ **Bisa tunjukkan database real** ke juri
4. ✅ **Lebih kredibel** untuk penilaian kompetisi
5. ✅ **Test koneksi Supabase real** bukan mock data

---

**Created by:** Kiro AI Assistant  
**Date:** September 12, 2026  
**Project:** VokaSync - EXASTI 2.0 Competition
