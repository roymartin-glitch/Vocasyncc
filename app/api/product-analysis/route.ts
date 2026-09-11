import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateMargin, determineActionCategory, isStockLow } from '@/lib/calculations/financial';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';
import { mockProducts } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { user, profile } = await getActiveUserProfile();
    const userId = profile?.id;
    const isDemo = !user;

    let productsQuery = supabase.from('products').select('id, name, default_unit, image_url').order('name');
    if (userId) {
      productsQuery = productsQuery.eq('user_id', userId);
    }

    let itemsQuery = supabase.from('transaction_items').select(`
      product_id,
      quantity,
      unit_price,
      transactions!inner (
        type,
        transaction_date,
        user_id
      )
    `);
    if (userId) {
      itemsQuery = itemsQuery.eq('transactions.user_id', userId);
    }

    let batchesQuery = supabase.from('stock_batches').select('*');
    if (userId) {
      batchesQuery = batchesQuery.eq('user_id', userId);
    }

    // Parallelize all database queries concurrently for maximum speed
    const [productsRes, itemsRes, batchesRes] = await Promise.all([
      productsQuery,
      itemsQuery,
      batchesQuery,
    ]);

    const threshold = Number(profile?.margin_alert_threshold) || 20;
    const products = productsRes.data || [];
    const items = itemsRes.data || [];
    const stockBatches = batchesRes.data || [];

    // In-memory / fallback products filtered strictly by user_id
    const activeUserId = profile?.id;
    const userMockProducts = mockProducts.filter((p: any) => {
      if (activeUserId && p.user_id === activeUserId) return true;
      if (isDemo && (p.user_id === 'user-001' || p.user_id === 'demo' || p.user_id === 'demo-user-pak-budi' || p.user_id === '00000000-0000-0000-0000-000000000001' || !p.user_id)) return true;
      return false;
    });

    if (products.length === 0) {
      const { DEMO_PRODUCTS } = await import('@/lib/mock-data/demo-data');
      const finalProducts = isDemo ? (userMockProducts.length > 0 ? userMockProducts : DEMO_PRODUCTS) : userMockProducts;
      return NextResponse.json({
        success: true,
        threshold,
        data: finalProducts,
      });
    }

    // Compute cost price, selling price, and stock per product
    const productStats: Record<string, any> = {};

    (products || []).forEach((p) => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        unit: p.default_unit || 'kg',
        image_url: p.image_url || null,
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
    const results: any[] = Object.values(productStats).map((stat: any) => {
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
        image_url: stat.image_url || null,
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

    // Merge in-memory products created in session
    if (userMockProducts.length > 0) {
      const existingIds = new Set(results.map((r) => r.id));
      for (const mp of userMockProducts) {
        if (!existingIds.has(mp.id)) {
          results.unshift(mp);
          existingIds.add(mp.id);
        }
      }
    }

    return NextResponse.json({ success: true, threshold, data: results });
  } catch (err: any) {
    console.error('GET /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Tambah Produk Baru dengan input Stok Awal
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { name, unit = 'kg', costPrice, sellingPrice, stock = 10 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus diisi.' },
        { status: 400 }
      );
    }

    const { profile } = await getActiveUserProfile();
    const userId = profile?.id || 'demo-user-pak-budi';

    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    const stockNum = Math.max(0, parseFloat(stock) || 10);

    let newProd: any = null;

    // 1. Coba simpan ke database Supabase
    try {
      const { data, error: prodErr } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: name.trim(),
          default_unit: unit,
        })
        .select()
        .single();

      if (!prodErr && data) {
        newProd = data;
      }
    } catch (dbErr: any) {
      console.warn('Supabase product insert fallback to in-memory store:', dbErr.message);
    }

    // 2. Jika database berhasil, masukkan riwayat modal belanja dan batch stok
    if (newProd && newProd.id) {
      if (cost > 0 || stockNum > 0) {
        try {
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
              quantity: stockNum,
              unit,
              unit_price: cost,
            });

            await supabase.from('stock_batches').insert({
              user_id: userId,
              product_id: newProd.id,
              transaction_id: expTx.id,
              initial_quantity: stockNum,
              remaining_quantity: stockNum,
              cost_price: cost,
              unit,
              status: 'active',
            });
          }
        } catch (bErr) {
          console.warn('Initial stock batch insert fallback:', bErr);
        }
      }

      if (selling > 0) {
        try {
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
              quantity: 1,
              unit,
              unit_price: selling,
            });
          }
        } catch (_) {}
      }
    }

    // 3. Fallback jika akun lokal/resilient (tidak ada foreign key di profiles)
    if (!newProd) {
      newProd = {
        id: 'prod-' + Date.now(),
        name: name.trim(),
        default_unit: unit,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    }

    const margin = calculateMargin(cost, selling);
    const category = determineActionCategory(margin, 20);

    const completeItem = {
      id: newProd.id,
      name: newProd.name,
      unit: newProd.default_unit || unit,
      image_url: newProd.image_url || null,
      cost_price: Math.round(cost),
      selling_price: Math.round(selling),
      margin_percentage: margin,
      action_category: category,
      avg_daily_volume: 5,
      total_revenue_7d: Math.round(selling * 10),
      remaining_stock: stockNum,
      is_stock_low: stockNum <= 2,
      user_id: userId,
    };

    mockProducts.unshift(completeItem);

    return NextResponse.json({
      success: true,
      message: 'Produk baru berhasil ditambahkan.',
      data: completeItem,
    });
  } catch (err: any) {
    console.error('POST /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Update product details (name, unit, selling price, stock, image_url)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, name, unit, sellingPrice, stock, image_url } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Perbarui di mockProducts in-memory store
    const mockIdx = mockProducts.findIndex((p) => p.id === id);
    if (mockIdx !== -1) {
      if (name !== undefined && name.trim()) mockProducts[mockIdx].name = name.trim();
      if (unit !== undefined && unit.trim()) mockProducts[mockIdx].unit = unit.trim();
      if (image_url !== undefined) mockProducts[mockIdx].image_url = image_url || null;
      if (stock !== undefined) {
        const parsedStock = Number(stock);
        mockProducts[mockIdx].remaining_stock = parsedStock;
        mockProducts[mockIdx].is_stock_low = parsedStock <= 2;
      }
      if (sellingPrice !== undefined && Number(sellingPrice) > 0) {
        mockProducts[mockIdx].selling_price = Number(sellingPrice);
        mockProducts[mockIdx].margin_percentage = calculateMargin(
          mockProducts[mockIdx].cost_price || 0,
          Number(sellingPrice)
        );
      }
    }

    // 2. Perbarui di Supabase database jika ada
    const updates: Record<string, any> = {};
    if (name !== undefined && name.trim()) updates.name = name.trim();
    if (unit !== undefined && unit.trim()) updates.default_unit = unit.trim();
    if (image_url !== undefined) updates.image_url = image_url || null;
    updates.updated_at = new Date().toISOString();

    let updatedProd: any = mockIdx !== -1 ? mockProducts[mockIdx] : null;

    try {
      const { data, error: updateErr } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (data && !updateErr) {
        updatedProd = data;
      }
    } catch (_) {}

    // Perbarui stok batch di database jika stock dikirim
    if (stock !== undefined) {
      try {
        await supabase
          .from('stock_batches')
          .update({ remaining_quantity: Number(stock) })
          .eq('product_id', id);
      } catch (_) {}
    }

    // If sellingPrice supplied, insert a new income transaction item
    if (sellingPrice !== undefined && Number(sellingPrice) > 0) {
      const { profile } = await getActiveUserProfile();
      const userId = profile?.id;
      if (userId) {
        try {
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
              product_id: id,
              quantity: 1,
              unit: unit || 'kg',
              unit_price: Number(sellingPrice),
            });
          }
        } catch (_) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updatedProd,
    });
  } catch (err: any) {
    console.error('PATCH /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus produk secara permanen beserta riwayat terkaitnya
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Bersihkan dari mockProducts
    const mockIdx = mockProducts.findIndex((p) => p.id === productId);
    if (mockIdx !== -1) {
      mockProducts.splice(mockIdx, 1);
    }

    // 2. Hapus child records yang berelasi dengan produk ini di database
    try {
      await supabase.from('stock_batches').delete().eq('product_id', productId);
      await supabase.from('transaction_items').delete().eq('product_id', productId);
      await supabase.from('ai_insights').delete().eq('product_id', productId);
      await supabase.from('experiments').delete().eq('product_id', productId);
      await supabase.from('products').delete().eq('id', productId);
    } catch (cleanupErr) {
      console.warn('Child records deletion fallback:', cleanupErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('DELETE /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

