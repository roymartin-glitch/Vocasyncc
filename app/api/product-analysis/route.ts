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

    // Jika akun demo dan di DB belum ada produk, selalu tampilkan mockProducts lengkap bawaan
    if (isDemo && products.length === 0) {
      return NextResponse.json({
        success: true,
        threshold,
        data: mockProducts,
      });
    }

    // Jika akun pribadi baru dan belum ada produk di DB, kembalikan daftar kosong bersih
    if (!isDemo && products.length === 0) {
      return NextResponse.json({
        success: true,
        threshold,
        data: [],
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

    const { profile } = await getActiveUserProfile();
    const userId = profile?.id;
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

// PATCH: Update product details (name, unit, selling price, image_url)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, name, unit, sellingPrice, image_url } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID wajib disertakan.' },
        { status: 400 }
      );
    }

    // Build update payload — only include fields that were sent
    const updates: Record<string, any> = {};
    if (name !== undefined && name.trim()) updates.name = name.trim();
    if (unit !== undefined && unit.trim()) updates.default_unit = unit.trim();
    if (image_url !== undefined) updates.image_url = image_url || null;
    updates.updated_at = new Date().toISOString();

    const { data: updatedProd, error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // If sellingPrice supplied, insert a new income transaction item to update selling price
    if (sellingPrice !== undefined && Number(sellingPrice) > 0) {
      const { profile } = await getActiveUserProfile();
      const userId = profile?.id;
      if (userId) {
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
            unit: unit || updatedProd.default_unit,
            unit_price: Number(sellingPrice),
          });
        }
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

    const { profile } = await getActiveUserProfile();
    const userId = profile?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Bersihkan dari mockProducts jika ID ditemukan (untuk demo / in-memory produk)
    const mockIdx = mockProducts.findIndex((p) => p.id === productId);
    if (mockIdx !== -1) {
      mockProducts.splice(mockIdx, 1);
      return NextResponse.json({
        success: true,
        message: 'Produk berhasil dihapus.',
      });
    }

    // Hapus child records yang berelasi dengan produk ini di database
    try {
      await supabase.from('stock_batches').delete().eq('product_id', productId);
      await supabase.from('transaction_items').delete().eq('product_id', productId);
      await supabase.from('ai_insights').delete().eq('product_id', productId);
      await supabase.from('experiments').delete().eq('product_id', productId);
    } catch (cleanupErr) {
      console.warn('Child records deletion warning:', cleanupErr);
    }

    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (delErr) {
      throw delErr;
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

