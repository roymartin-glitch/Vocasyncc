import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getFIFOCostPrice } from '@/lib/calculations/financial';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';
import { mockTransactions, mockProducts } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await getActiveUserProfile();
    const isDemo = !user;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    // Early return untuk mode demo
    if (isDemo) {
      let list = [...mockTransactions];

      if (type && (type === 'income' || type === 'expense')) {
        list = list.filter((t) => t.type === type);
      }
      if (search) {
        list = list.filter((t) =>
          t.items?.some((it) => it.product_name?.toLowerCase().includes(search.toLowerCase()))
        );
      }
      if (startDate) {
        list = list.filter((t) => (t.transaction_date || '').split('T')[0] >= startDate);
      }
      if (endDate) {
        list = list.filter((t) => (t.transaction_date || '').split('T')[0] <= endDate);
      }
      if (limitParam) {
        list = list.slice(0, parseInt(limitParam, 10));
      }
      return NextResponse.json(
        { success: true, data: list },
        { headers: { 'Cache-Control': 'private, no-cache, must-revalidate' } }
      );
    }

    const supabase = createAdminClient();

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

    if (profile?.id) {
      query = query.eq('user_id', profile.id);
    } else {
      query = query.eq('user_id', 'demo-user-pak-budi');
    }

    if (type && (type === 'income' || type === 'expense')) {
      query = query.eq('type', type);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', `${endDate}T23:59:59.999Z`);
    }

    if (limitParam) {
      query = query.limit(parseInt(limitParam, 10));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Jika di database belum ada data transaksi, gunakan memory store (mockTransactions & DEMO_TRANSACTIONS)
    if (!data || data.length === 0) {
      let list = [...mockTransactions];

      if (type && (type === 'income' || type === 'expense')) {
        list = list.filter((t) => t.type === type);
      }
      if (search) {
        list = list.filter((t) =>
          t.items?.some((it) => it.product_name?.toLowerCase().includes(search.toLowerCase()))
        );
      }
      if (startDate) {
        list = list.filter((t) => (t.transaction_date || '').split('T')[0] >= startDate);
      }
      if (endDate) {
        list = list.filter((t) => (t.transaction_date || '').split('T')[0] <= endDate);
      }
      if (limitParam) {
        list = list.slice(0, parseInt(limitParam, 10));
      }
      return NextResponse.json(
        { success: true, data: list },
        { headers: { 'Cache-Control': 'private, no-cache, must-revalidate' } }
      );
    }

    // Transform into standard frontend interface
    const formatted = (data || []).map((tx: any) => {
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

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'private, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    console.error('GET /api/transactions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, productName, quantity, unit = 'kg', totalAmount, source = 'manual', rawVoiceText } = body;

    if (!type || !productName || !quantity || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Get active user profile
    const { user, profile } = await getActiveUserProfile();
    const userId = profile?.id;
    const isDemo = !user;

    // 2. Clean product name & check or create product scoped to this user
    let productId = '';
    let isNewProduct = false;

    const cleanedRaw = productName
      .replace(/^(saya\s+beli\s+barang|saya\s+beli|beli\s+barang|beli|jual|barang)\s+/i, '')
      .replace(/\s*rp\s*\.?\s*$/i, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const finalCleanName = cleanedRaw
      ? cleanedRaw
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : 'Barang Dagangan';

    const qty = parseFloat(quantity) || 1;
    const total = parseFloat(totalAmount) || 0;
    const unitPrice = total / qty;

    // A. Demo Mode Handler: Dukung penuh pencatatan transaksi & auto-tambah barang baru tanpa login
    if (isDemo) {
      const existingDemoProd = mockProducts.find(
        (p) => p.name.toLowerCase() === finalCleanName.toLowerCase()
      );

      if (existingDemoProd) {
        productId = existingDemoProd.id;
        if (userId) existingDemoProd.user_id = userId;
        if (type === 'expense') {
          existingDemoProd.cost_price = Math.round(unitPrice);
          existingDemoProd.remaining_stock = (existingDemoProd.remaining_stock || 0) + qty;
        } else {
          existingDemoProd.selling_price = Math.round(unitPrice);
          existingDemoProd.remaining_stock = Math.max(0, (existingDemoProd.remaining_stock || 0) - qty);
        }
      }

      let demoProdObj = existingDemoProd;
      if (!demoProdObj) {
        isNewProduct = true;
        productId = 'prod-' + Date.now();
        const costPrice = type === 'expense' ? Math.round(unitPrice) : Math.round(unitPrice * 0.8);
        const sellPrice = type === 'income' ? Math.round(unitPrice) : Math.round(unitPrice * 1.25);
        const margin = Math.round(((sellPrice - costPrice) / (sellPrice || 1)) * 100);

        demoProdObj = {
          id: productId,
          user_id: userId || (isDemo ? 'demo' : 'guest'),
          name: finalCleanName,
          unit: unit || 'kg',
          cost_price: costPrice,
          selling_price: sellPrice,
          margin_percentage: margin,
          action_category: margin >= 20 ? 'dorong' : 'perbaiki',
          avg_daily_volume: qty,
          total_revenue_7d: total,
          remaining_stock: qty,
          is_stock_low: false,
        };
        mockProducts.unshift(demoProdObj);
      }

      const newTxId = 'tx-' + Date.now();
      const newDemoTx = {
        id: newTxId,
        user_id: userId || '00000000-0000-0000-0000-000000000001',
        type,
        transaction_date: new Date().toISOString(),
        source,
        raw_voice_text: rawVoiceText || null,
        total_amount: total,
        items: [
          {
            id: 'txi-' + Date.now(),
            transaction_id: newTxId,
            product_id: productId,
            product_name: finalCleanName,
            quantity: qty,
            unit,
            unit_price: Math.round(unitPrice),
            subtotal: total,
          },
        ],
      };
      mockTransactions.unshift(newDemoTx);

      return NextResponse.json({
        success: true,
        data: newDemoTx,
        productId,
        productName: finalCleanName,
        isNewProduct,
        product: demoProdObj,
        message: 'Transaksi dan barang berhasil dicatat.',
      });
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const supabase = createAdminClient();
    let newTxRecord: any = null;
    try {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', finalCleanName)
        .limit(1);

      if (existingProduct && existingProduct.length > 0) {
        productId = existingProduct[0].id;
      } else {
        isNewProduct = true;
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            name: finalCleanName,
            default_unit: unit || 'kg',
          })
          .select()
          .single();

        if (prodErr || !newProd) {
          throw new Error(`Gagal membuat produk baru: ${prodErr?.message}`);
        }
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
      const { error: itemErr } = await supabase.from('transaction_items').insert({
        transaction_id: newTx.id,
        product_id: productId,
        quantity: qty,
        unit,
        unit_price: Math.round(unitPrice),
      });

      if (itemErr) throw itemErr;

      newTxRecord = {
        id: newTx.id,
        user_id: userId,
        type,
        transaction_date: new Date().toISOString(),
        source,
        raw_voice_text: rawVoiceText || null,
        total_amount: total,
        items: [
          {
            id: 'txi-' + Date.now(),
            transaction_id: newTx.id,
            product_id: productId,
            product_name: finalCleanName,
            quantity: qty,
            unit,
            unit_price: Math.round(unitPrice),
            subtotal: total,
          },
        ],
      };
      mockTransactions.unshift(newTxRecord);

      // 5. FIFO Stock Batch Tracking
      try {
        if (type === 'expense') {
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
          const { data: activeBatches } = await supabase
            .from('stock_batches')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'active')
            .order('created_at', { ascending: true });

          if (activeBatches && activeBatches.length > 0) {
            const fifoResult = getFIFOCostPrice(productId, qty, activeBatches);
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
    } catch (dbErr) {
      console.warn('Supabase DB write error, activating in-memory transaction preservation:', dbErr);
      const fallbackTxId = 'tx-' + Date.now();
      newTxRecord = {
        id: fallbackTxId,
        user_id: userId || '00000000-0000-0000-0000-000000000001',
        type,
        transaction_date: new Date().toISOString(),
        source,
        raw_voice_text: rawVoiceText || null,
        total_amount: total,
        items: [
          {
            id: 'txi-' + Date.now(),
            transaction_id: fallbackTxId,
            product_id: productId || 'prod-' + Date.now(),
            product_name: finalCleanName,
            quantity: qty,
            unit,
            unit_price: Math.round(unitPrice),
            subtotal: total,
          },
        ],
      };
      mockTransactions.unshift(newTxRecord);
    }

    // Pastikan komoditas selalu tersimpan / diperbarui di mockProducts & dikembalikan ke frontend
    const costPrice = type === 'expense' ? Math.round(unitPrice) : Math.round(unitPrice * 0.8);
    const sellPrice = type === 'income' ? Math.round(unitPrice) : Math.round(unitPrice * 1.25);
    const margin = Math.round(((sellPrice - costPrice) / (sellPrice || 1)) * 100);

    let productObj = mockProducts.find(
      (p) => (p.user_id === userId || !p.user_id) && p.name.toLowerCase() === finalCleanName.toLowerCase()
    );

    if (productObj) {
      if (type === 'expense') {
        productObj.cost_price = Math.round(unitPrice);
        productObj.remaining_stock = (productObj.remaining_stock || 0) + qty;
      } else {
        productObj.selling_price = Math.round(unitPrice);
        productObj.remaining_stock = Math.max(0, (productObj.remaining_stock || 0) - qty);
      }
      productObj.total_revenue_7d = (productObj.total_revenue_7d || 0) + total;
    } else {
      productObj = {
        id: productId || 'prod-' + Date.now(),
        user_id: userId,
        name: finalCleanName,
        unit: unit || 'kg',
        cost_price: costPrice,
        selling_price: sellPrice,
        margin_percentage: margin,
        action_category: margin >= 20 ? 'dorong' : 'perbaiki',
        avg_daily_volume: qty,
        total_revenue_7d: total,
        remaining_stock: qty,
        is_stock_low: false,
      };
      mockProducts.unshift(productObj);
    }

    return NextResponse.json({
      success: true,
      data: newTxRecord,
      productId: productId || productObj.id,
      productName: finalCleanName,
      isNewProduct: isNewProduct || true,
      product: productObj,
      message: 'Transaksi dan barang berhasil dicatat.',
    });
  } catch (err: any) {
    console.error('POST /api/transactions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
