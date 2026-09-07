import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';
import { getMarketingCopyPrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { productName, storeName = 'Kios Berkah', style = 'pasar' } = await req.json();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus disediakan.' },
        { status: 400 }
      );
    }

    const prompt = getMarketingCopyPrompt(productName, storeName, style);
    const copyText = await callGemini(
      prompt,
      'Anda adalah copywriter spesialis promosi WhatsApp untuk pedagang pasar dan UMKM Indonesia.'
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
