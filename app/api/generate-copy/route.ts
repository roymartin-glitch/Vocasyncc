import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const {
      productName,
      storeName = 'Toko Saya',
      price,
      unit = 'kg',
      phone,
      style = 'pasar',
    } = await req.json();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus disediakan.' },
        { status: 400 }
      );
    }

    const priceText = price
      ? `Rp${Number(price).toLocaleString('id-ID')}/${unit}`
      : '';

    const styleDesc =
      style === 'fomo'
        ? 'Promo Terbatas / Kilat (mendesak, stok hampir habis hari ini)'
        : style === 'elegan'
        ? 'Kualitas Premium & Pilihan Terbaik (segar, terjamin, higienis)'
        : 'Ramah khas pasar tradisional (hangat, jujur, kekeluargaan)';

    const prompt = `Tugas Anda: Buat 1 teks pesan siaran (broadcast) promosi WhatsApp yang persuasif, sopan, dan langsung menarik minat pembeli untuk pedagang pasar / UMKM Indonesia.

Detail Dagangan:
- Nama Produk: ${productName}
- Nama Toko: ${storeName}
${priceText ? `- Harga: ${priceText}` : ''}
${phone ? `- WhatsApp Pemesanan: ${phone}` : ''}
- Gaya Penyampaian: ${styleDesc}

Aturan Penulisan:
1. Gunakan format teks WhatsApp (*tebal* pada kata penting, baris baru yang rapi dan nyaman dibaca di layar HP).
2. Gunakan emoji yang proporsional, wajar, dan relevan.
3. Sebutkan keunggulan produk, kesegarannya, dan kemudahan pemesanan / pengantaran.
4. Akhiri dengan ajakan bertindak (Call to Action) ramah untuk memesan sekarang.
5. Balas HANYA dengan isi pesan promosi langsung, tanpa tanda kutip pembuka/penutup dan tanpa basa-basi penjelasan AI.`;

    const copyText = await callGemini(
      prompt,
      'Anda adalah spesialis copywriter promosi pesan WhatsApp untuk UMKM dan pedagang pasar Indonesia.'
    );

    return NextResponse.json({
      success: true,
      text: copyText.trim(),
    });
  } catch (error: any) {
    console.error('Error in /api/generate-copy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan copywriting.' },
      { status: 500 }
    );
  }
}
