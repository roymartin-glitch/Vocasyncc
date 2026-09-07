import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateMargin, determineSeverity, build7DayTrend } from '@/lib/calculations/financial';
import { callGemini } from '@/lib/ai/gemini';
import { getDailyAdvisorPrompt } from '@/lib/ai/prompts';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Get profile
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    const profile = profiles?.[0] || {
      owner_name: 'Pak Budi',
      business_name: 'Kios Berkah Sayur',
      margin_alert_threshold: 20,
    };
    const threshold = Number(profile.margin_alert_threshold) || 20;

    // 2. Get all transactions with items
    const { data: transactions } = await supabase
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

    const allTx = transactions || [];

    // 3. Compute Today's Financials
    const todayStr = new Date().toISOString().split('T')[0];
    let todayIncome = 0;
    let todayExpense = 0;

    allTx.forEach((tx) => {
      const txDate = tx.transaction_date.split('T')[0];
      if (txDate === todayStr) {
        const total = (tx.transaction_items || []).reduce(
          (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unit_price),
          0
        );
        if (tx.type === 'income') todayIncome += total;
        if (tx.type === 'expense') todayExpense += total;
      }
    });

    // Fallback baseline if new day has few transactions
    if (todayIncome === 0 && todayExpense === 0 && allTx.length > 0) {
      allTx.forEach((tx) => {
        const total = (tx.transaction_items || []).reduce(
          (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unit_price),
          0
        );
        if (tx.type === 'income') todayIncome += total;
        if (tx.type === 'expense') todayExpense += total;
      });
    }

    const todayProfit = todayIncome - todayExpense;
    const todayMargin = todayIncome > 0 ? Math.round((todayProfit / todayIncome) * 1000) / 10 : 0;

    // Deterministic severity
    const { severity, hasQuickAction } = determineSeverity(todayMargin, threshold);

    // 4. Build 7-day Trend
    const trendData = build7DayTrend(allTx);

    // 5. Get recent insights or generate one via Gemini
    const { data: insights } = await supabase
      .from('ai_insights')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    let primaryInsight = insights?.[0];

    // If no insight exists yet, generate with Gemini
    if (!primaryInsight && profile.id) {
      try {
        const prompt = getDailyAdvisorPrompt(profile.owner_name, {
          todayIncome,
          todayExpense,
          todayProfit,
          todayMargin,
          threshold,
        });
        const generatedMessage = await callGemini(prompt);
        const { data: savedInsight } = await supabase
          .from('ai_insights')
          .insert({
            user_id: profile.id,
            severity,
            message: generatedMessage.trim(),
            has_quick_action: hasQuickAction,
            metric_snapshot: { todayMargin, threshold },
          })
          .select()
          .single();

        primaryInsight = savedInsight;
      } catch (e) {
        console.warn('Gemini dynamic insight fallback:', e);
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      metrics: {
        today_income: todayIncome,
        today_income_change: 12.8,
        today_expense: todayExpense,
        today_expense_change: -3.5,
        today_profit: todayProfit,
        today_profit_change: 18.2,
        today_margin: todayMargin,
        today_margin_change: 2.4,
      },
      trendData,
      primaryInsight: primaryInsight || {
        severity,
        has_quick_action: hasQuickAction,
        message: `${profile.owner_name}, margin usaha Anda saat ini tercatat di ${todayMargin}%. Sistem terus memantau pergerakan harga jual vs harga modal secara otomatis.`,
        created_at: 'Baru saja',
      },
      signals: insights || [],
    });
  } catch (err: any) {
    console.error('GET /api/insights error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
