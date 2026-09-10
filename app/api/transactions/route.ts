import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getFIFOCostPrice } from '@/lib/calculations/financial';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59.999Z`);
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
    let isNewProduct = false;
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', productName.trim())
      .limit(1);

    if (existingProduct && existingProduct.length > 0) {
      productId = existingProduct[0].id;
    } else {
      isNewProduct = true;
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

    // 5. FIFO Stock Batch Tracking
    let fifoResult = null;
    try {
      if (type === 'expense') {
        // Transaksi Beli (Kulakan): Buka batch stok baru
        await supabase.from('stock_batches').insert({
          user_id: userId,
          product_id: productId,
          transaction_id: newTx.id,
          initial_quantity: qty,
          remaining_quantity: qty,
          cost_price: Math.round(unitPrice),
          unit,
          status: 'active',
        });
      } else if (type === 'income') {
        // Transaksi Jual (Penjualan): Kurangi sisa stok dari batch terlama (FIFO)
        const { data: activeBatches } = await supabase
          .from('stock_batches')
          .select('*')
          .eq('product_id', productId)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (activeBatches && activeBatches.length > 0) {
          fifoResult = getFIFOCostPrice(productId, qty, activeBatches);
          for (const d of fifoResult.batchDeductions) {
            await supabase
              .from('stock_batches')
              .update({
                remaining_quantity: d.newRemainingQty,
                status: d.status,
              })
              .eq('id', d.batchId);
          }
        }
      }
    } catch (batchErr) {
      console.warn('Stock batch operation fallback:', batchErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newTx.id,
        productId,
        productName,
        type,
        quantity: qty,
        unit,
        totalAmount: total,
        isNewProduct,
        fifoCostPrice: fifoResult?.weightedCostPrice || null,
      },
    });
  } catch (err: any) {
    console.error('POST /api/transactions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
