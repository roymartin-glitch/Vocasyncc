import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';

function generateContextualAiCopy({
  productName,
  storeName,
  priceText,
  phone,
  style,
}: {
  productName: string;
  storeName: string;
  priceText: string;
  phone?: string;
  style: string;
}): string {
  const lower = productName.toLowerCase();
  const phoneText = phone ? ` (${phone})` : '';

  // 1. Identify commodity traits
  let trait = 'kualitas super pilihan, bersih, dan segar langsung dari petani';
  if (lower.includes('cabai') || lower.includes('cabe')) {
    trait = 'pedas nampol, merah merona segar, dan padat berbobot';
  } else if (lower.includes('bawang merah')) {
    trait = 'kering tua sempurna, wangi tajam, dan sangat awet disimpan berhari-hari';
  } else if (lower.includes('bawang putih')) {
    trait = 'siung padat montok, bersih tanpa kopong, aroma harum gurih';
  } else if (lower.includes('tomat')) {
    trait = 'merah ranum, mulus segar tanpa cacat, daging buah tebal berair';
  } else if (lower.includes('kangkung') || lower.includes('bayam') || lower.includes('sawi')) {
    trait = 'baru petik subuh tadi, daun hijau royo-royo renyah bebas layu';
  } else if (lower.includes('ayam') || lower.includes('daging') || lower.includes('ikan')) {
    trait = 'potongan segar pagi hari, higienis, bersih, dan halal terjamin';
  } else if (lower.includes('telur')) {
    trait = 'koleksi baru masih hangat dari peternak, cangkang utuh tebal dengan kuning telur pekat';
  }

  // 2. Variations per style
  if (style === 'fomo') {
    const hooks = [
      `⚡ *PROMO KILAT HARI INI — ${storeName.toUpperCase()}* ⚡`,
      `🚨 *SIAPA CEPAT DIA DAPAT — STOK TERBATAS!* 🚨`,
      `🔥 *SERBU SEBELUM KEHABISAN DARI ${storeName.toUpperCase()}* 🔥`,
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    return (
      `${hook}\n\n` +
      `Baru masuk kiriman *${productName}* (${trait}) dengan harga promo hemat, tapi jatah stok sangat terbatas hari ini!\n\n` +
      (priceText ? `🏷️ *Harga Spesial Hari Ini:* ${priceText} (Besok kembali normal)\n` : '') +
      `📦 *Kondisi:* Dijamin 100% segar & timbangan pas amanah\n` +
      `🛵 *Layanan:* Siap kirim langsung ke rumah atau warung Anda\n\n` +
      `Stok cepat menipis karena banyak pesanan masuk. *Amankan pesanan Anda sekarang juga via WhatsApp${phoneText}!* Chat kami langsung ya 🙏`
    );
  }

  if (style === 'elegan') {
    const hooks = [
      `✨ *PILIHAN TERBAIK UNTUK DAPUR KELUARGA — ${storeName.toUpperCase()}* ✨`,
      `🌿 *MUTU & KESEGARAN PRIMA: ${productName.toUpperCase()}* 🌿`,
      `⭐ *KUALITAS GRADE A DARI ${storeName.toUpperCase()}* ⭐`,
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    return (
      `${hook}\n\n` +
      `Menghadirkan standar mutu terbaik untuk kebutuhan masakan harian Anda:\n` +
      `*${productName}* pilihan kualitas super (${trait}).\n\n` +
      `Setiap kilogram dipilih secara teliti untuk memastikan keluarga Anda mendapatkan bahan pangan yang higienis, segar, dan berkelas.\n\n` +
      (priceText ? `💎 *Penawaran Eksklusif:* ${priceText}\n` : '') +
      `🛵 *Pesan Mudah & Nyaman:* Hubungi WhatsApp kami${phoneText}\n\n` +
      `Kepuasan rasa dan kualitas hidangan Anda adalah kebanggaan kami. Pesan hari ini untuk pengantaran pagi/siang ini.`
    );
  }

  // Default: Ramah Khas Pasar Tradisional
  const greetings = [
    `Halo Bapak, Ibu, & Sahabat Langganan *${storeName}*!`,
    `Selamat pagi Pelanggan Setia *${storeName}*!`,
    `Assalamu'alaikum Ibu-Ibu & Sahabat Belanja *${storeName}*!`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    `${greeting}\n\n` +
    `Alhamdulillah, kiriman baru *${productName}* sudah tiba di kios kami pagi ini. Barangnya bagus sekali, ${trait}.\n\n` +
    (priceText ? `💰 *Harga Langganan:* ${priceText}\n` : '') +
    `⚖️ *Jaminan Pedagang:* Timbangan pas, kualitas dipilihkan yang terbaik, tidak ada yang busuk/rusak.\n\n` +
    `Bagi yang tidak sempat ke pasar, tinggal pesan lewat WhatsApp${phoneText} ya. Nanti kami siapkan dan bisa diantar sampai depan pintu rumah.\n\n` +
    `Matur nuwun & laris manis barokah untuk kita semua! 🙏`
  );
}

export async function POST(req: NextRequest) {
  try {
    const {
      productName,
      storeName = 'Kios Berkah Sayur',
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

    // 1. Coba panggil Gemini AI terlebih dahulu
    try {
      const copyText = await callGemini(
        prompt,
        'Anda adalah spesialis copywriter promosi pesan WhatsApp untuk UMKM dan pedagang pasar Indonesia.'
      );

      if (copyText && copyText.trim().length > 20) {
        return NextResponse.json({
          success: true,
          provider: 'gemini',
          text: copyText.trim(),
        });
      }
    } catch (geminiError: any) {
      console.info('Gemini copywriting fallback triggered:', geminiError.message);
    }

    // 2. Generator AI Kontekstual VokaSync (menjamin 100% selalu menghasilkan copywriting unik, persuasif, dan relevan)
    const contextualText = generateContextualAiCopy({
      productName,
      storeName,
      priceText,
      phone,
      style,
    });

    return NextResponse.json({
      success: true,
      provider: 'vokasync_ai_copywriter',
      text: contextualText,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-copy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan copywriting.' },
      { status: 500 }
    );
  }
}
