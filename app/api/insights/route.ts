import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { determineSeverity, build7DayTrend, isStockLow } from '@/lib/calculations/financial';
import { callGemini } from '@/lib/ai/gemini';
import { getDailyAdvisorPrompt } from '@/lib/ai/prompts';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';


export async function POST(req: NextRequest) {
  return handleInsights(req);
}

export async function GET(req: NextRequest) {
  return handleInsights(req);
}

async function handleInsights(req: NextRequest) {
  try {
    let localProductsOverride: any[] = [];
    let localTxsOverride: any[] = [];
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (Array.isArray(body.localProducts)) {
          localProductsOverride = body.localProducts.filter(Boolean);
        }
        if (Array.isArray(body.localTxs)) {
          localTxsOverride = body.localTxs.filter(Boolean);
        }
      } catch (e) {}
    }

    const { user, profile } = await getActiveUserProfile();
    const supabase = createAdminClient();
    const userId = profile?.id;

    let txQuery = supabase
      .from('transactions')
      .select(`
        id,
        type,
        transaction_date,
        source,
        raw_voice_text,
        transaction_items (
          quantity,
          unit_price,
          product_id,
          products (
            id,
            name,
            cost_price
          )
        )
      `)
      .order('transaction_date', { ascending: false });

    let insightsQuery = supabase
      .from('ai_insights')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    let batchesQuery = supabase
      .from('stock_batches')
      .select(`
        product_id,
        initial_quantity,
        remaining_quantity,
        unit,
        status,
        products (
          id,
          name
        )
      `);

    if (userId) {
      txQuery = txQuery.eq('user_id', userId);
      insightsQuery = insightsQuery.eq('user_id', userId);
      batchesQuery = batchesQuery.eq('user_id', userId);
    }

    // 1. Run all database queries in parallel for maximum speed & lowest latency
    const [txRes, batchesRes, insightsRes] = await Promise.all([
      txQuery,
      batchesQuery,
      insightsQuery,
    ]);

    const activeProfile = profile || {
      owner_name: 'Pedagang',
      business_name: 'Toko Saya',
      margin_alert_threshold: 20,
    };
    const threshold = Number(activeProfile.margin_alert_threshold) || 20;

    // Use DB transactions and merge with any offline/local ones
    const dbTx = txRes.data || [];
    const allTx: any[] = [...dbTx];
    
    // Sinkronisasi transaksi lokal yang belum ter-push ke database (penting untuk mode demo/offline)
    const existingIds = new Set(allTx.map(t => t.id));
    for (const l of localTxsOverride) {
      if (l && l.id && !existingIds.has(l.id)) {
        allTx.unshift(l);
        existingIds.add(l.id);
      }
    }

    const batches = batchesRes.data || [];
    const insights = insightsRes.data || [];

    // 3. Compute Today's Financials
    const todayStr = new Date().toISOString().split('T')[0];
    let todayIncome = 0;
    let todayExpense = 0;
    let todayCogs = 0; // Cost of Goods Sold for today's sales

    allTx.forEach((tx) => {
      const txDate = (tx.transaction_date || '').split('T')[0];
      if (txDate === todayStr) {
        if (tx.type === 'income') {
          let txIncome = 0;
          let txCogs = 0;
          const itemsList = tx.transaction_items || tx.items || [];
          itemsList.forEach((it: any) => {
            const q = Number(it.quantity) || 0;
            const p = Number(it.unit_price) || 0;
            txIncome += (q * p);

            // Determine cost price for COGS
            let cost = it.products?.cost_price || it.cost_price;
            
            // Override with local cache if available (for instant updates)
            const pName = it.products?.name || it.product_name || 'Lainnya';
            const localMatch = localProductsOverride.find((lp: any) => lp?.id === it.product_id || (lp?.name && pName && lp.name.toLowerCase() === pName.toLowerCase()));
            if (localMatch?.cost_price && localMatch.cost_price > 0) {
              cost = localMatch.cost_price;
            }

            // Fallback if no cost price exists (assume 20% margin to prevent negative or infinite math)
            if (!cost || cost <= 0) {
              cost = Math.round(p * 0.8);
            }
            
            txCogs += (q * cost);
          });
          // Fallback if no items array but has total_amount
          if (itemsList.length === 0 && tx.total_amount) {
            txIncome += tx.total_amount;
            txCogs += Math.round(tx.total_amount * 0.8);
          }
          todayIncome += txIncome;
          todayCogs += txCogs;
        } else if (tx.type === 'expense') {
          const itemsList = tx.transaction_items || tx.items || [];
          if (itemsList.length > 0) {
            const total = itemsList.reduce(
              (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unit_price),
              0
            );
            todayExpense += total;
          } else if (tx.total_amount) {
            todayExpense += tx.total_amount;
          }
        }
      }
    });

    // NOTE: When today has 0 transactions, metrics remain 0 - this is correct behavior.
    // The insight message will handle the "no data today" case gracefully.

    const todayProfit = todayIncome - todayExpense; // Net Cash Flow (Uang Masuk - Uang Keluar)
    const todayGrossProfit = todayIncome - todayCogs; // Real Profit from sales
    const todayMargin = todayIncome > 0 ? Math.round((todayGrossProfit / todayIncome) * 1000) / 10 : 0;

    // Deterministic severity
    const { severity, hasQuickAction } = determineSeverity(todayMargin, threshold);

    // 4. Build 7-day Trend
    const trendData = build7DayTrend(allTx);

    // 5. Check stock levels for "Peringatan Stok Hampir Habis" (Severity: yellow)
    const lowStockSignals: any[] = [];
    try {
      if (batches && batches.length > 0) {
        const prodMap: Record<string, { name: string; unit: string; initial: number; remaining: number }> = {};
        batches.forEach((b: any) => {
          const pId = b.product_id;
          if (!prodMap[pId]) {
            prodMap[pId] = {
              name: b.products?.name || 'Produk',
              unit: b.unit || 'kg',
              initial: 0,
              remaining: 0,
            };
          }
          prodMap[pId].initial += Number(b.initial_quantity || 0);
          if (b.status === 'active') {
            prodMap[pId].remaining += Number(b.remaining_quantity || 0);
          }
        });

        Object.entries(prodMap).forEach(([pId, data]) => {
          if (isStockLow(data.remaining, data.initial, 20)) {
            lowStockSignals.push({
              id: `stock-alert-${pId}`,
              user_id: profile?.id || 'demo-user',
              product_id: pId,
              product_name: data.name,
              severity: 'yellow',
              message: `Stok ${data.name} tinggal ${data.remaining} ${data.unit}. Segera belanja stok agar tidak kehabisan.`,
              has_quick_action: false,
              created_at: 'Baru saja',
            });
          }
        });
      }
    } catch (sErr) {
      console.warn('Stock alert check fallback:', sErr);
    }

    // 6. Ambil master produk untuk mendapatkan data harga modal & jual terkini (sinkron real-time dengan halaman Barang)
    let masterProductsQuery = supabase.from('products').select('id, name, default_unit, cost_price, selling_price');
    if (userId) {
      masterProductsQuery = masterProductsQuery.eq('user_id', userId);
    }
    const { data: masterProducts } = await masterProductsQuery;

    // Build cost map from expense transactions
    const prodCostMap: Record<string, { totalCost: number; totalQty: number; latestCost: number; latestCostDate: string }> = {};
    const prodSalesMap: Record<string, { id: string; name: string; totalRevenue: number; totalQty: number; profit: number; margin: number; latestSellingPrice: number; latestSellingDate: string }> = {};

    allTx.forEach((tx) => {
      const txDate = tx.transaction_date || '';
      if (tx.type === 'expense') {
        const itemsList = tx.transaction_items || tx.items || [];
        itemsList.forEach((it: any) => {
          const pId = it.product_id || it.products?.id;
          const pName = it.products?.name || it.product_name || 'Lainnya';
          const pKey = pId || pName.toLowerCase();
          const q = Number(it.quantity) || 1;
          const p = Number(it.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
          if (!prodCostMap[pKey]) {
            prodCostMap[pKey] = { totalCost: 0, totalQty: 0, latestCost: p, latestCostDate: txDate };
          }
          prodCostMap[pKey].totalCost += p * q;
          prodCostMap[pKey].totalQty += q;
          if (p > 0 && (!prodCostMap[pKey].latestCostDate || txDate >= prodCostMap[pKey].latestCostDate)) {
            prodCostMap[pKey].latestCost = p;
            prodCostMap[pKey].latestCostDate = txDate;
          }
        });
      }
    });

    allTx.forEach((tx) => {
      const txDate = tx.transaction_date || '';
      if (tx.type === 'income') {
        const itemsList = tx.transaction_items || tx.items || [];
        itemsList.forEach((it: any) => {
          const pId = it.product_id || it.products?.id;
          const pName = it.products?.name || it.product_name || 'Lainnya';
          const pKey = pId || pName.toLowerCase();
          const q = Number(it.quantity) || 1;
          const sellPrice = Number(it.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
          const revenue = q * sellPrice;

          const costObj = prodCostMap[pKey] || prodCostMap[pName.toLowerCase()];
          let unitCost = costObj?.latestCost || (costObj && costObj.totalQty > 0 ? costObj.totalCost / costObj.totalQty : 0);
          if (!unitCost || unitCost >= sellPrice) {
            unitCost = Math.round(sellPrice * 0.8);
          }
          const profit = Math.max(0, revenue - (q * unitCost));

          if (!prodSalesMap[pKey]) {
            prodSalesMap[pKey] = {
              id: pId || pKey,
              name: pName,
              totalRevenue: 0,
              totalQty: 0,
              profit: 0,
              margin: 0,
              latestSellingPrice: sellPrice,
              latestSellingDate: txDate,
            };
          }
          prodSalesMap[pKey].totalRevenue += revenue;
          prodSalesMap[pKey].totalQty += q;
          prodSalesMap[pKey].profit += profit;

          if (sellPrice > 0 && (!prodSalesMap[pKey].latestSellingDate || txDate >= prodSalesMap[pKey].latestSellingDate)) {
            prodSalesMap[pKey].latestSellingPrice = sellPrice;
            prodSalesMap[pKey].latestSellingDate = txDate;
          }
        });
      }
    });

    // Hitung margin terkini berdasarkan harga jual paling mutakhir dan harga modal paling mutakhir
    Object.values(prodSalesMap).forEach((item) => {
      const pKey = item.id;
      const masterProd = masterProducts?.find(p => p?.id === pKey || (p?.name && item?.name && p.name.toLowerCase() === item.name.toLowerCase()));
      const localOverride = localProductsOverride.find(p => p?.id === pKey || (p?.name && item?.name && p.name.toLowerCase() === item.name.toLowerCase()));
      
      const costObj = prodCostMap[pKey] || prodCostMap[item.name.toLowerCase()];
      
      // Override from frontend if available, else master, else transaction history
      const currentCost = (localOverride?.cost_price && localOverride.cost_price > 0)
        ? localOverride.cost_price
        : ((masterProd?.cost_price && masterProd.cost_price > 0) 
            ? masterProd.cost_price 
            : (costObj?.latestCost || (costObj && costObj.totalQty > 0 ? costObj.totalCost / costObj.totalQty : 0)));
        
      const currentSelling = (localOverride?.selling_price && localOverride.selling_price > 0)
        ? localOverride.selling_price
        : ((masterProd?.selling_price && masterProd.selling_price > 0)
            ? masterProd.selling_price
            : item.latestSellingPrice);

      if (currentSelling > 0 && currentCost > 0) {
        // Gunakan margin harga terkini jika tersedia (sinkron dengan harga yang baru diubah user)
        item.margin = Math.round(((currentSelling - currentCost) / currentSelling) * 100);
      } else if (item.totalRevenue > 0) {
        item.margin = Math.round((item.profit / item.totalRevenue) * 100);
      } else {
        item.margin = 25;
      }
    });

    const analyzedProducts = Object.values(prodSalesMap);
    // Cari produk yang margin saat ininya benar-benar di bawah batas aman
    const belowThresholdProducts = analyzedProducts
      .filter((p) => p.totalRevenue > 0 && p.margin < threshold)
      .sort((a, b) => a.margin - b.margin);

    const hasTodayData = todayIncome > 0 || todayExpense > 0;
    const hasHistoricalData = allTx.length > 0;

    let primaryInsight: any = null;

    if (belowThresholdProducts.length > 0) {
      // Real verified low margin alert based on actual recorded transactions
      const targetProd = belowThresholdProducts[0];
      primaryInsight = {
        id: `real-alert-${targetProd.id}`,
        product_id: targetProd.id,
        product_name: targetProd.name,
        severity: 'yellow',
        message: `Margin ${targetProd.name} (${targetProd.margin}%) saat ini di bawah batas aman ${threshold}%. Pertimbangkan menyesuaikan harga jual atau kurangi harga beli modal.`,
        has_quick_action: true,
        created_at: 'Baru saja',
      };
    } else if (hasTodayData) {
      if (todayMargin < threshold && todayIncome > 0) {
        primaryInsight = {
          id: 'today-margin-warning',
          severity: 'yellow',
          message: `${activeProfile.owner_name}, margin hari ini sedang di ${todayMargin}% (di bawah batas ${threshold}%). Evaluasi kembali pengeluaran belanja modal hari ini.`,
          has_quick_action: false,
          created_at: 'Baru saja',
        };
      } else {
        primaryInsight = {
          id: 'today-healthy-status',
          severity: 'green',
          message: `${activeProfile.owner_name}, keuntungan usaha terpantau sehat di ${todayMargin}%, di atas batas aman ${threshold}%. Semua barang dagangan mencatatkan margin yang baik.`,
          has_quick_action: false,
          created_at: 'Baru saja',
        };
      }
    } else if (hasHistoricalData) {
      primaryInsight = {
        id: 'no-today-data',
        severity: 'green',
        message: `${activeProfile.owner_name}, belum ada transaksi penjualan hari ini. Catat penjualan Anda sekarang agar keuntungan dihitung otomatis.`,
        has_quick_action: false,
        created_at: 'Baru saja',
      };
    } else {
      primaryInsight = {
        id: 'welcome-status',
        severity: 'green',
        message: `Selamat datang di VokaSync, ${activeProfile.owner_name}! Mulai catat transaksi penjualan atau belanja stok untuk melihat analisa keuangan otomatis.`,
        has_quick_action: false,
        created_at: 'Baru saja',
      };
    }

    // Combine low stock signals and general business signals
    const allSignals = [...lowStockSignals, ...(insights || [])];

    return NextResponse.json(
      {
        success: true,
        profile,
        metrics: {
          today_income: todayIncome,
          today_income_change: 0,
          today_expense: todayExpense,
          today_expense_change: 0,
          today_profit: todayProfit,
          today_profit_change: 0,
          today_margin: todayMargin,
          today_margin_change: 0,
        },
        trendData: trendData.length > 0 ? trendData : [],
        primaryInsight,
        signals: allSignals,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('GET /api/insights error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
