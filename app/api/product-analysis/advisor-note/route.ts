import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productName,
      costPrice,
      sellingPrice,
      margin,
      actionCategory,
      unit = 'kg',
      ownerName = 'Pak Budi',
    } = body;

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus disediakan.' },
        { status: 400 }
      );
    }

    const prompt = `Anda adalah AI Business Advisor untuk pedagang UMKM/pasar tradisional (${ownerName}).
Berikut adalah data produk yang sedang ditinjau:
- Nama Produk: ${productName}
- Satuan: ${unit}
- Harga Modal Terkini: Rp${Number(costPrice).toLocaleString('id-ID')}
- Harga Jual Eceran Terkini: Rp${Number(sellingPrice).toLocaleString('id-ID')}
- Margin Keuntungan: ${margin}%
- Status Rekomendasi Aksi: ${actionCategory.toUpperCase()}

Tugas:
Buat catatan analisis singkat (1-2 kalimat padat, lugas, bersahabat, bahasa Indonesia awam tanpa istilah rumit).
Jelaskan arti margin ini bagi usaha dan berikan saran tindakan taktis nyata (misal: apakah perlu menaikkan harga Rp1.000, menjaga ketersediaan pasokan grosir, mempromosikan via WhatsApp, atau mengurangi kuota beli).`;

    const note = await callGemini(
      prompt,
      'Anda adalah konsultan bisnis UMKM mikro yang sangat paham kondisi pasar tradisional dan dagangan riil.'
    );

    return NextResponse.json({
      success: true,
      note: note.trim(),
    });
  } catch (err: any) {
    console.error('Error generating product advisor note:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghasilkan catatan AI.' },
      { status: 500 }
    );
  }
}
