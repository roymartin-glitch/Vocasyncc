import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';
import { getParseVoicePrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transkrip suara tidak valid.' },
        { status: 400 }
      );
    }

    const prompt = getParseVoicePrompt(transcript);
    const rawResult = await callGemini(
      prompt,
      'Anda adalah parser entitas transaksi perdagangan. HANYA kembalikan JSON valid tanpa markdown.'
    );

    // Clean JSON response from any markdown wrapping if present
    const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/parse-voice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses suara via Gemini.' },
      { status: 500 }
    );
  }
}
