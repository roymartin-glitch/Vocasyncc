export function getParseVoicePrompt(transcript: string): string {
  return `Tugas Anda adalah mengekstrak data transaksi perdagangan dari transkrip ucapan suara bahasa Indonesia menjadi format JSON murni.

Transkrip ucapan pengguna:
"${transcript}"

Aturan ekstraksi:
1. type: "income" jika transaksi penjualan/dapat uang dagangan. "expense" jika transaksi pembelian/kulakan modal/bayar bahan baku.
2. product_name: Nama barang/produk yang diperdagangkan (kapitalkan setiap kata, misal "Bawang Merah Brebes", "Cabai Rawit").
3. quantity: Jumlah kuantitas dalam angka (misal 5, 2.5, 10). Default 1 jika tidak disebut.
4. unit: Satuan barang (pilih salah satu: "kg", "ikat", "pcs", "liter", "karung", "bungkus"). Default "kg".
5. total_price: Total uang dalam angka bulat rupiah (misal "80 ribu" -> 80000, "1,5 juta" -> 1500000).

Wajib kembalikan HANYA JSON tanpa markdown codeblock dan tanpa penjelasan lain, dengan struktur:
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
