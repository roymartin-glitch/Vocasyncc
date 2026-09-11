import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';
import { getParseVoicePrompt } from '@/lib/ai/prompts';

// Helper to cleanly extract commodity/product name without conversational noise
function cleanProductName(text: string): string {
  let cleaned = text.toLowerCase();

  // 1. Remove explicit currency/price expressions: "rp. 500.000", "500 ribu", "10rb", "1.5 juta"
  cleaned = cleaned.replace(/rp\.?\s*[\d.,]+(\s*(ribu|rb|k|juta|jt))?/gi, ' ');
  cleaned = cleaned.replace(/[\d.,]+\s*(ribu|rb|k|juta|jt)\b/gi, ' ');
  cleaned = cleaned.replace(/\b(harga|seharga|sebesar|dapat|total|bayar)\s*[\d.,]+/gi, ' ');

  // 2. Remove quantity expressions: "10 kilo", "1kg", "5 ikat", "2 karung"
  cleaned = cleaned.replace(/[\d.,]+\s*(kg|kilo|kilogram|ikat|butir|liter|bungkus|karung|pcs|renteng|ons|papan|dus|biji)\b/gi, ' ');

  // 3. Remove all remaining digits, isolated "rp", and punctuation
  cleaned = cleaned.replace(/[\d.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');
  cleaned = cleaned.replace(/\brp\b/gi, ' ');

  // 4. Remove conversational filler & operational words
  const stopWords = new Set([
    'saya', 'aku', 'gua', 'gue', 'kita', 'kami',
    'beli', 'jual', 'laku', 'kulak', 'kulakan', 'belanja', 'bayar', 'dapat', 'stok',
    'seharga', 'harga', 'per', 'buat', 'dong', 'tolong', 'catat', 'catatkan', 'masukin',
    'masukkan', 'tambahkan', 'tambah', 'barang', 'hari', 'ini', 'tadi', 'barusan',
    'rupiah', 'kilo', 'kg', 'kilogram', 'ikat', 'butir', 'liter', 'bungkus', 'karung',
    'pcs', 'renteng', 'ons', 'dus', 'papan', 'ribu', 'rb', 'k', 'juta', 'jt', 'unit',
    'ada', 'yang', 'dan', 'sama', 'ke', 'ya'
  ]);

  // Common phonetic speech-to-text mistakes in Indonesian traditional market speech
  const phoneticCorrections: Record<string, string> = {
    kampung: 'kangkung',
    kangkong: 'kangkung',
    kakung: 'kangkung',
    kankung: 'kangkung',
    tumat: 'tomat',
    tomed: 'tomat',
    umat: 'tomat',
    rawang: 'bawang',
    bayem: 'bayam',
    belas: 'beras',
    bras: 'beras',
    cabe: 'cabai',
    cabay: 'cabai',
    telor: 'telur',
  };

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .map((w) => phoneticCorrections[w] || w)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  // Deduplicate consecutive/repeated words (e.g. "Kangkung ... Kangkung" -> "Kangkung")
  const uniqueWords: string[] = [];
  for (const w of words) {
    if (!uniqueWords.includes(w)) {
      uniqueWords.push(w);
    }
  }

  if (uniqueWords.length === 0) return 'Barang Dagangan';

  return uniqueWords
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Advanced heuristic parser for Indonesian market speech (works with or without internet)
function fallbackParseIndonesianSpeech(text: string) {
  const lower = text.toLowerCase();

  // 1. Determine type
  const isExpense = /\b(beli|kulak|kulakan|bayar|belanja|stok|modal|ambil)\b/i.test(lower);
  const type = isExpense ? 'expense' : 'income';

  // 2. Extract unit
  const units = ['kg', 'kilo', 'kilogram', 'ikat', 'butir', 'liter', 'bungkus', 'karung', 'pcs', 'renteng', 'ons', 'papan', 'dus'];
  let unit = 'kg';
  for (const u of units) {
    if (new RegExp(`\\b${u}\\b`, 'i').test(lower)) {
      if (u === 'kilo' || u === 'kilogram') unit = 'kg';
      else unit = u;
      break;
    }
  }

  // 3. Extract quantity (prioritize number directly before unit)
  let quantity = 1;
  const qtyWithUnitMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogram|ikat|butir|liter|bungkus|karung|pcs|renteng|ons|papan|dus)\b/);
  const qtyMatch = lower.match(/(\d+(?:[.,]\d+)?)/);

  if (qtyWithUnitMatch && qtyWithUnitMatch[1]) {
    quantity = parseFloat(qtyWithUnitMatch[1].replace(',', '.'));
  } else if (qtyMatch && qtyMatch[1]) {
    quantity = parseFloat(qtyMatch[1].replace(',', '.'));
  }

  // 4. Extract total price (explicitly match currency patterns to avoid quantity confusion)
  let totalPrice = 0;
  const rpMatch = lower.match(/rp\.?\s*(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt)?/i);
  const wordPriceMatch = lower.match(/(?:harga|seharga|bayar|dapat|sebesar|total)\s*(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt)?/i);
  const multMatch = lower.match(/(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt)\b/i);
  const dotCurrencyMatch = lower.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);

  const matched = rpMatch || wordPriceMatch || multMatch || dotCurrencyMatch;
  if (matched) {
    const rawNumStr = matched[1].replace(/\./g, '').replace(',', '.');
    let num = parseFloat(rawNumStr);
    const mult = (matched[2] || '').toLowerCase();
    if (mult === 'ribu' || mult === 'rb' || mult === 'k') num = num * 1000;
    else if (mult === 'juta' || mult === 'jt') num = num * 1000000;
    else if (num < 1000 && !matched[2] && (lower.includes('ribu') || lower.includes('rb'))) {
      num = num * 1000;
    }
    totalPrice = Math.round(num);
  }

  // 5. Clean product name
  const productName = cleanProductName(text);
  const unitPrice = quantity > 0 && totalPrice > 0 ? Math.round(totalPrice / quantity) : totalPrice;

  return {
    type,
    product_name: productName,
    quantity,
    unit,
    unit_price: unitPrice,
    total_price: totalPrice,
  };
}

// Helper to deduplicate repeated voice phrases (e.g. "saya beli kangkung saya beli kangkung")
function cleanRepeatedVoicePhrases(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  for (let n = 6; n >= 2; n--) {
    const regex = new RegExp(`\\b((?:[a-zA-Z0-9가-힣]+\\s+){${n - 1}}[a-zA-Z0-9가-힣]+)\\s+\\1\\b`, 'gi');
    cleaned = cleaned.replace(regex, '$1');
  }

  cleaned = cleaned.replace(/\b([a-zA-Z0-9]+)\s+\1\b/gi, '$1');

  const words = cleaned.split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(' ').toLowerCase();
    const secondHalf = words.slice(half).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      cleaned = words.slice(0, half).join(' ');
    }
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTranscript = body?.transcript;

    if (!rawTranscript || typeof rawTranscript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transkrip suara tidak valid.' },
        { status: 400 }
      );
    }

    const transcript = cleanRepeatedVoicePhrases(rawTranscript);

    try {
      const prompt = getParseVoicePrompt(transcript);
      const rawResult = await callGemini(
        prompt,
        'Anda adalah parser entitas transaksi perdagangan. HANYA kembalikan JSON valid tanpa teks lain atau markdown.'
      );

      // Robust JSON extraction using regex (handles markdown fences or extra text)
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // Post-sanitize product_name from Gemini to ensure no conversational prefix leaked
        if (parsedData.product_name) {
          const sanitized = cleanProductName(parsedData.product_name);
          if (sanitized && sanitized !== 'Barang Dagangan') {
            parsedData.product_name = sanitized;
          }
        }

        return NextResponse.json({
          success: true,
          provider: 'gemini',
          data: parsedData,
        });
      }
    } catch (geminiError: any) {
      console.warn('Gemini voice parse fallback triggered:', geminiError.message);
    }

    // Fallback: Advanced Heuristic Indonesian parser ensures voice ALWAYS succeeds accurately
    const fallbackData = fallbackParseIndonesianSpeech(transcript);
    return NextResponse.json({
      success: true,
      provider: 'heuristic_fallback',
      data: fallbackData,
    });
  } catch (error: any) {
    console.error('Error in /api/parse-voice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses suara.' },
      { status: 500 }
    );
  }
}
