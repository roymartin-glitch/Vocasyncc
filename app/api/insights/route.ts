import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { determineSeverity, build7DayTrend, isStockLow } from '@/lib/calculations/financial';
import { callGemini } from '@/lib/ai/gemini';
import { getDailyAdvisorPrompt } from '@/lib/ai/prompts';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';


export async function GET(req: NextRequest) {
  try {
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
            name
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

    // Use only DB transactions - no mock fallback to avoid stale/wrong data
    const dbTx = txRes.data || [];
    const allTx = dbTx;

    const batches = batchesRes.data || [];
    const insights = insightsRes.data || [];

    // 3. Compute Today's Financials
    const todayStr = new Date().toISOString().split('T')[0];
    let todayIncome = 0;
    let todayExpense = 0;

    allTx.forEach((tx) => {
      const txDate = (tx.transaction_date || '').split('T')[0];
      if (txDate === todayStr) {
        const total = (tx.transaction_items || []).reduce(
          (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unit_price),
          0
        );
        if (tx.type === 'income') todayIncome += total;
        if (tx.type === 'expense') todayExpense += total;
      }
    });

    // NOTE: When today has 0 transactions, metrics remain 0 - this is correct behavior.
    // The insight message will handle the "no data today" case gracefully.

    const todayProfit = todayIncome - todayExpense;
    const todayMargin = todayIncome > 0 ? Math.round((todayProfit / todayIncome) * 1000) / 10 : 0;

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

    // Low stock signals only if detected from actual batches
    // (no fake alerts for empty database)

    // 6. Get recent insights from pre-fetched parallel query
    let primaryInsight = insights?.[0];

    const hasTodayData = todayIncome > 0 || todayExpense > 0;
    const hasHistoricalData = allTx.length > 0;

    const defaultMessage = hasTodayData
      ? todayMargin < threshold
        ? `${activeProfile.owner_name}, margin hari ini sedang di ${todayMargin}% (di bawah target ${threshold}%). Sebaiknya sesuaikan harga jual atau kurangi harga beli modal.`
        : `${activeProfile.owner_name}, margin usaha hari ini terpantau sehat di ${todayMargin}%. Sistem terus memantau pergerakan harga jual vs modal secara otomatis.`
      : hasHistoricalData
      ? `${activeProfile.owner_name}, belum ada transaksi hari ini. Yuk catat penjualan atau belanja stok pertama hari ini!`
      : `Selamat datang di VokaSync, ${activeProfile.owner_name}! Mulai catat transaksi penjualan atau belanja stok pertama Anda hari ini untuk melihat analisa keuangan otomatis.`;

    if (!primaryInsight && profile?.id && dbTx.length > 0) {
      // Background worker: generate rich narrative without blocking response
      const prompt = getDailyAdvisorPrompt(activeProfile.owner_name, {
        todayIncome,
        todayExpense,
        todayProfit,
        todayMargin,
        threshold,
      });

      callGemini(prompt)
        .then(async (generatedMessage) => {
          if (generatedMessage?.trim()) {
            await supabase
              .from('ai_insights')
              .insert({
                user_id: profile.id,
                severity,
                message: generatedMessage.trim(),
                has_quick_action: hasQuickAction,
                metric_snapshot: { todayMargin, threshold },
              });
          }
        })
        .catch((e) => console.warn('Background Gemini insight info:', e));
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
        primaryInsight: primaryInsight || {
          severity: severity || 'green',
          has_quick_action: hasQuickAction || false,
          message: defaultMessage,
          created_at: 'Baru saja',
        },
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
