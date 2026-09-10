import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';
import { getParseVoicePrompt } from '@/lib/ai/prompts';

// Heuristic fallback parser for Indonesian market speech
function fallbackParseIndonesianSpeech(text: string) {
  const lower = text.toLowerCase();
  
  // 1. Determine type
  const isExpense = lower.includes('beli') || lower.includes('kulak') || lower.includes('bayar') || lower.includes('belanja');
  const type = isExpense ? 'expense' : 'income';

  // 2. Extract unit
  const units = ['kg', 'kilo', 'ikat', 'butir', 'liter', 'bungkus', 'karung', 'pcs', 'renteng', 'ons'];
  let unit = 'kg';
  for (const u of units) {
    if (new RegExp(`\\b${u}\\b`, 'i').test(lower)) {
      unit = u === 'kilo' ? 'kg' : u;
      break;
    }
  }

  // 3. Extract quantity
  let quantity = 1;
  const qtyMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|ikat|butir|liter|bungkus|karung|pcs|renteng|ons)?/);
  if (qtyMatch && qtyMatch[1]) {
    quantity = parseFloat(qtyMatch[1].replace(',', '.'));
  }

  // 4. Extract total price
  let totalPrice = 0;
  // Patterns like "100 ribu", "100rb", "100.000", "100k"
  const priceMatch = lower.match(/(?:rp\.?|bayar|dapat|seharga|harga)?\s*(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/i);
  if (priceMatch) {
    let num = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
    const mult = (priceMatch[2] || '').toLowerCase();
    if (mult === 'ribu' || mult === 'rb' || mult === 'k') num = num * 1000;
    if (mult === 'juta' || mult === 'jt') num = num * 1000000;
    totalPrice = num;
  }

  // 5. Extract product name by stripping known operational words
  let cleanName = lower
    .replace(/\b(beli|jual|laku|kulak|bayar|dapat|seharga|harga|kilo|kg|ikat|butir|liter|bungkus|karung|pcs|renteng|ribu|rb|k|juta|jt|rupiah|rp|hari ini|tadi|dong|tolong)\b/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize product name
  const productName = cleanName
    ? cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Komoditas Pasar';

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

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transkrip suara tidak valid.' },
        { status: 400 }
      );
    }

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
        return NextResponse.json({
          success: true,
          provider: 'gemini',
          data: parsedData,
        });
      }
    } catch (geminiError: any) {
      console.warn('Gemini voice parse fallback triggered:', geminiError.message);
    }

    // Fallback: Heuristic Indonesian parser ensures voice NEVER fails
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
