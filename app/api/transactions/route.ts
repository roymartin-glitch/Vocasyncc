import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let query = supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        type,
        transaction_date,
        source,
        raw_voice_text,
        created_at,
        transaction_items (
          id,
          product_id,
          quantity,
          unit,
          unit_price,
          products (
            id,
            name
          )
        )
      `)
      .order('transaction_date', { ascending: false });

    if (type && (type === 'income' || type === 'expense')) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform into standard frontend interface
    const formatted = data.map((tx: any) => {
      let total = 0;
      const items = (tx.transaction_items || []).map((item: any) => {
        const subtotal = Number(item.quantity) * Number(item.unit_price);
        total += subtotal;
        return {
          id: item.id,
          transaction_id: tx.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Produk',
          quantity: Number(item.quantity),
          unit: item.unit,
          unit_price: Number(item.unit_price),
          subtotal,
        };
      });

      return {
        id: tx.id,
        user_id: tx.user_id,
        type: tx.type,
        transaction_date: tx.transaction_date,
        source: tx.source,
        raw_voice_text: tx.raw_voice_text,
        total_amount: total,
        items,
      };
    });

    // Filter by search if specified
    const result = search
      ? formatted.filter((t: any) =>
          t.items?.some((it: any) => it.product_name.toLowerCase().includes(search.toLowerCase()))
        )
      : formatted;

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('GET /api/transactions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { type, productName, quantity, unit = 'kg', totalAmount, source = 'manual', rawVoiceText } = body;

    if (!type || !productName || !quantity || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Get primary user profile
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 2. Check or create product
    let productId = '';
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .ilike('name', productName.trim())
      .limit(1);

    if (existingProduct && existingProduct.length > 0) {
      productId = existingProduct[0].id;
    } else {
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: productName.trim(),
          default_unit: unit,
        })
        .select('id')
        .single();

      if (prodErr) throw prodErr;
      productId = newProd.id;
    }

    // 3. Create transaction header
    const { data: newTx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        transaction_date: new Date().toISOString(),
        source,
        raw_voice_text: rawVoiceText || null,
      })
      .select('id')
      .single();

    if (txErr) throw txErr;

    // 4. Create transaction item
    const qty = parseFloat(quantity) || 1;
    const total = parseFloat(totalAmount) || 0;
    const unitPrice = total / qty;

    const { error: itemErr } = await supabase.from('transaction_items').insert({
      transaction_id: newTx.id,
      product_id: productId,
      quantity: qty,
      unit,
      unit_price: Math.round(unitPrice),
    });

    if (itemErr) throw itemErr;

    return NextResponse.json({
      success: true,
      data: {
        id: newTx.id,
        type,
        productName,
        quantity: qty,
        unit,
        totalAmount: total,
      },
    });
  } catch (err: any) {
    console.error('POST /api/transactions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
