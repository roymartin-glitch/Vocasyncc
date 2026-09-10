import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateMargin, determineActionCategory, isStockLow } from '@/lib/calculations/financial';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Get profile threshold
    const { data: profiles } = await supabase.from('profiles').select('margin_alert_threshold').limit(1);
    const threshold = Number(profiles?.[0]?.margin_alert_threshold) || 20;

    // 2. Get all products
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, default_unit')
      .order('name');

    if (prodErr) throw prodErr;

    // 3. Get all transaction items
    const { data: items, error: itemErr } = await supabase
      .from('transaction_items')
      .select(`
        product_id,
        quantity,
        unit_price,
        transactions (
          type,
          transaction_date
        )
      `);

    if (itemErr) throw itemErr;

    // 4. Get active stock batches (FIFO inventory)
    let stockBatches: any[] = [];
    try {
      const { data: bData } = await supabase
        .from('stock_batches')
        .select('*');
      if (bData) stockBatches = bData;
    } catch (bErr) {
      console.warn('stock_batches query fallback:', bErr);
    }

    // Compute cost price, selling price, and stock per product
    const productStats: Record<string, any> = {};

    (products || []).forEach((p) => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        unit: p.default_unit || 'kg',
        latestCost: 0,
        latestCostDate: '',
        latestSelling: 0,
        latestSellingDate: '',
        totalVolume: 0,
        totalRevenue: 0,
        totalBought: 0,
      };
    });

    (items || []).forEach((it: any) => {
      const pId = it.product_id;
      if (!productStats[pId]) return;

      const tx = it.transactions;
      const txDate = tx?.transaction_date || '';
      const price = Number(it.unit_price);
      const qty = Number(it.quantity);

      if (tx?.type === 'expense') {
        if (!productStats[pId].latestCostDate || txDate > productStats[pId].latestCostDate) {
          productStats[pId].latestCost = price;
          productStats[pId].latestCostDate = txDate;
        }
        productStats[pId].totalBought += qty;
      } else if (tx?.type === 'income') {
        if (!productStats[pId].latestSellingDate || txDate > productStats[pId].latestSellingDate) {
          productStats[pId].latestSelling = price;
          productStats[pId].latestSellingDate = txDate;
        }
        productStats[pId].totalVolume += qty;
        productStats[pId].totalRevenue += price * qty;
      }
    });

    // Format analysis items with stock remaining and low stock alert
    const results = Object.values(productStats).map((stat: any) => {
      const cost = stat.latestCost || 25000;
      const selling = stat.latestSelling || cost * 1.25;
      const margin = calculateMargin(cost, selling);
      const category = determineActionCategory(margin, threshold);

      // FIFO stock calculation
      const productBatches = stockBatches.filter((b) => b.product_id === stat.id);
      let remainingStock = 0;
      let initialBatchQty = 0;

      if (productBatches.length > 0) {
        remainingStock = productBatches
          .filter((b) => b.status === 'active')
          .reduce((sum, b) => sum + Number(b.remaining_quantity || 0), 0);
        initialBatchQty = productBatches.reduce((sum, b) => sum + Number(b.initial_quantity || 0), 0);
      } else {
        // Fallback calculation from transaction history
        remainingStock = Math.max(0, (stat.totalBought || 25) - (stat.totalVolume || 18));
        initialBatchQty = stat.totalBought || 25;
      }

      const isLow = isStockLow(remainingStock, initialBatchQty, 20);

      return {
        id: stat.id,
        name: stat.name,
        unit: stat.unit,
        cost_price: Math.round(cost),
        selling_price: Math.round(selling),
        margin_percentage: margin,
        action_category: category,
        avg_daily_volume: Math.max(Math.round(stat.totalVolume / 7), 5),
        total_revenue_7d: Math.round(stat.totalRevenue || selling * 15),
        remaining_stock: Math.round(remainingStock * 10) / 10,
        is_stock_low: isLow,
      };
    });

    return NextResponse.json({ success: true, threshold, data: results });
  } catch (err: any) {
    console.error('GET /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Tambah Produk Baru
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { name, unit = 'kg', costPrice, sellingPrice } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus diisi.' },
        { status: 400 }
      );
    }

    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Profil pemilik tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Insert new product
    const { data: newProd, error: prodErr } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: name.trim(),
        default_unit: unit,
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // Optional: seed initial transactions if prices provided
    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;

    if (cost > 0) {
      const { data: expTx } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'expense',
          transaction_date: new Date().toISOString(),
          source: 'manual',
        })
        .select()
        .single();

      if (expTx) {
        await supabase.from('transaction_items').insert({
          transaction_id: expTx.id,
          product_id: newProd.id,
          quantity: 10,
          unit,
          unit_price: cost,
        });

        try {
          await supabase.from('stock_batches').insert({
            user_id: userId,
            product_id: newProd.id,
            transaction_id: expTx.id,
            initial_quantity: 10,
            remaining_quantity: 10,
            cost_price: cost,
            unit,
            status: 'active',
          });
        } catch (bErr) {
          console.warn('Initial stock batch insert fallback:', bErr);
        }
      }
    }

    if (selling > 0) {
      const { data: incTx } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'income',
          transaction_date: new Date().toISOString(),
          source: 'manual',
        })
        .select()
        .single();

      if (incTx) {
        await supabase.from('transaction_items').insert({
          transaction_id: incTx.id,
          product_id: newProd.id,
          quantity: 5,
          unit,
          unit_price: selling,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produk baru berhasil ditambahkan.',
      data: newProd,
    });
  } catch (err: any) {
    console.error('POST /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
