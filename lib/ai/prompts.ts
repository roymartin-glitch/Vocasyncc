export function getParseVoicePrompt(transcript: string): string {
  return `Anda adalah AI asisten keuangan pedagang pasar & UMKM (VokaSync) yang cerdas dan teliti.
Tugas Anda mengekstrak data transaksi perdagangan dari ucapan suara bahasa Indonesia menjadi format JSON murni.

Ucapan pedagang:
"${transcript}"

Aturan ekstraksi wajib:
1. type:
   - "expense" jika transaksi pembelian barang dagangan, belanja modal stok, bayar bahan baku/kulakan, atau pengeluaran operasional (contoh: "saya beli", "beli barang", "belanja", "tambah stok", "bayar").
   - "income" jika transaksi penjualan barang atau penerimaan uang (contoh: "jual", "laku", "dapat uang", "ada pembeli").
2. product_name:
   - HANYA nama murni komoditas/barang dagangan (kapitalkan, contoh: "Kangkung", "Cabai Rawit", "Bawang Merah", "Beras Pandan Wangi", "Tempe").
   - DILARANG KERAS menyertakan kata pengantar seperti "saya", "aku", "gua", "gue", "beli", "jual", "barang", "kulak", "belanja", "tadi", "tolong", "catat", atau simbol harga seperti "rp", "rupiah", tanda baca.
   - Contoh SALAH: "Saya Kangkung Rp .", "Saya Beli Barang Kangkung", "Kangkung Rp . Kangkung Rp .".
   - Contoh BENAR: "Kangkung".
   - Jika pedagang mengulang ucapan (misal "kangkung 10 kilo ... beli kangkung 10 kilo"), ambil nama barang sekali saja ("Kangkung").
3. quantity:
   - Jumlah kuantitas dalam angka (misal: "10 kilo" -> 10, "1kg" -> 1, "5 ikat" -> 5, "setengah kilo" -> 0.5). Default 1 jika tidak disebut.
4. unit:
   - Satuan barang standar: "kg" (untuk kilo/kilogram), "ikat", "pcs", "butir", "liter", "karung", "bungkus", "papan", "renteng", "ons", "dus". Default "kg".
5. total_price:
   - Total nilai uang transaksi dalam angka bulat rupiah.
   - Logika nilai uang:
     - "10 kilo Rp500.000" -> 500000 (BUKAN 10000!).
     - "1kg harga 10rb" -> 10000.
     - "5 kilo harga 20 ribu per kilo" -> 100000.
     - "100 ribu" / "100rb" / "100k" -> 100000.
     - "1,5 juta" -> 1500000.

Wajib kembalikan HANYA format JSON valid tanpa tanda kutip markdown backtick dan tanpa penjelasan tambahan:
{"product_name": "string", "quantity": number, "unit": "string", "total_price": number, "type": "expense" | "income"}`;
}

export function getDailyAdvisorPrompt(
  ownerName: string,
  metrics: {
    todayIncome: number;
    todayExpense: number;
    todayProfit: number;
    todayMargin: number;
    threshold: number;
    criticalProduct?: string;
    criticalMargin?: number;
  }
): string {
  return `Anda adalah AI Advisor untuk ${ownerName}, pedagang pasar/UMKM.
Berikut data kondisi keuangan terkini:
- Pemasukan hari ini: Rp${metrics.todayIncome.toLocaleString('id-ID')}
- Pengeluaran hari ini: Rp${metrics.todayExpense.toLocaleString('id-ID')}
- Keuntungan bersih: Rp${metrics.todayProfit.toLocaleString('id-ID')}
- Margin rata-rata: ${metrics.todayMargin}% (Target ambang batas: ${metrics.threshold}%)
${metrics.criticalProduct ? `- Produk tertekan: ${metrics.criticalProduct} (margin ${metrics.criticalMargin}%)` : ''}

Tugas Anda:
Susun 1 paragraf narasi (3-4 kalimat ringkas) dalam bahasa Indonesia yang hangat, bersahabat, menyapa ${ownerName}. Jelaskan akar masalah (root-cause) dan berikan saran aksi nyata (apakah perlu menaikkan harga Rp1.000-Rp2.000, membuat paket hemat, atau mempromosikan via WhatsApp). Jangan gunakan istilah teknis rumit.`;
}

export function getExperimentVerdictPrompt(
  title: string,
  productName: string,
  baselineMargin: number,
  currentMargin: number,
  daysRunning: number
): string {
  return `Eksperimen bisnis: "${title}" pada produk "${productName}".
- Margin sebelum eksperimen (Baseline): ${baselineMargin}%
- Margin setelah dievaluasi: ${currentMargin}%
- Durasi pelaksanaan: ${daysRunning} hari.

Tugas Anda:
Berikan verdict evaluasi singkat (2-3 kalimat) apakah tindakan ini sukses, perlu dipertahankan, atau disesuaikan lagi. Bahasanya ramah dan memotivasi pedagang.`;
}

export function getMarketingCopyPrompt(
  productName: string,
  storeName: string = 'Kios Berkah',
  style: 'pasar' | 'fomo' | 'elegan' = 'pasar'
): string {
  return `Buatkan teks pesan promosi WhatsApp singkat dan menarik untuk produk "${productName}" dari "${storeName}".
Gaya bahasa: ${style === 'fomo' ? 'Promo kilat / terbatas / mendesak (FOMO)' : style === 'elegan' ? 'Kualitas terbaik / higienis / terpercaya' : 'Ramah khas pasar tradisional / hangat / kekeluargaan'}.
Gunakan emoji yang pas dan format yang rapi untuk dibaca di chat WhatsApp.`;
}
