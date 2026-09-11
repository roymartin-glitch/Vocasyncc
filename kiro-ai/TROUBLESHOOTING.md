# 🔧 Troubleshooting - Setup Demo VokaSync

## ⚠️ Masalah yang Ditemukan

Database Supabase Anda **TIDAK SYNC** dengan skema terbaru di `supabase/schema/full_schema.sql`.

### Kolom yang HILANG di Database Real:

| Tabel | Kolom yang Hilang | Seharusnya Ada di |
|---|---|---|
| `profiles` | `theme` | `full_schema.sql` line 11 |
| `products` | `image_url` | `full_schema.sql` line 96 |

---

## ✅ Solusi Cepat (Sudah Diterapkan)

Script `setup_demo_account_FIXED.sql` sudah disesuaikan untuk **SKIP kolom yang tidak ada**:

### Yang Diperbaiki:
1. ❌ `business_type = 'Sayur & Buah'` → ✅ `business_type = 'pasar'`
2. ❌ `theme = 'terang'` → ✅ **DIHAPUS** (kolom tidak ada)
3. ❌ `image_url = 'https://...'` → ✅ **DIHAPUS** (kolom tidak ada)

### Kolom yang Dipakai (MINIMAL & AMAN):

**Tabel `profiles`:**
```sql
id, business_name, owner_name, business_type, 
margin_alert_threshold, low_stock_threshold, 
supplier_cost_increase_threshold, sound_alert_enabled, text_size
```

**Tabel `products`:**
```sql
id, user_id, name, default_unit
```

---

## 🛠️ Solusi Permanen (Opsional)

Jika Anda ingin database sync dengan skema lengkap, jalankan migration ini:

### 1. Tambahkan Kolom yang Hilang

```sql
-- Tambahkan kolom theme ke profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'terang';

-- Tambahkan kolom image_url ke products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Update constraint business_type agar support 'Sayur & Buah'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_business_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_business_type_check 
CHECK (business_type IN ('pasar', 'kuliner', 'kriya', 'kelontong', 'lainnya', 'Sayur & Buah', 'Daging & Ikan', 'Kuliner Rumahan', 'Kriya & Fashion', 'Kelontong', 'Lainnya'));
```

### 2. Setelah Migration, Jalankan Script Lengkap

Setelah migration sukses, Anda bisa pakai skema lengkap dari `full_schema.sql`.

---

## 📊 Verifikasi Database Anda

Jalankan query ini di Supabase SQL Editor untuk cek kolom yang ada:

```sql
-- Cek struktur tabel profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Cek struktur tabel products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Cek constraint business_type
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%business_type%';
```

---

## 🎯 Rekomendasi untuk Kompetisi

### Opsi A: Pakai Script Minimal (Rekomendasi)
✅ **Paling Aman** - Script `setup_demo_account_FIXED.sql` sudah disesuaikan
✅ **Tidak Perlu Migration** - Langsung jalan tanpa ubah database
✅ **Cukup untuk Demo** - Semua fitur utama tetap jalan

**Kekurangan:**
- ❌ Produk tidak ada foto (tapi bisa upload manual via UI)
- ❌ Tidak bisa tes fitur tema gelap (default terang)

### Opsi B: Jalankan Migration Dulu
✅ **Database Lengkap** - Semua kolom tersedia
✅ **Sesuai Dokumentasi** - Sync dengan `full_schema.sql`

**Kekurangan:**
- ⚠️ Perlu waktu 5-10 menit untuk migration
- ⚠️ Risk: Kalau ada constraint lain yang bentrok

---

## 📝 Kesimpulan

**Untuk presentasi EXASTI 2.0:**
👉 **Pakai Opsi A** (script minimal yang sudah diperbaiki)

**Alasan:**
1. Sudah pasti jalan tanpa error
2. Tidak butuh migration database
3. Fitur utama (catat transaksi, AI advisor, laporan) tetap lengkap
4. Foto produk bisa upload manual saat demo

---

**Last Updated:** September 12, 2026  
**Status:** ✅ Script FIXED sudah siap pakai
