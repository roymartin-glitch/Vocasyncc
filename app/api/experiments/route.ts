import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { getExperimentVerdictPrompt } from '@/lib/ai/prompts';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('experiments')
      .select(`
        id,
        user_id,
        product_id,
        title,
        status,
        baseline_metric,
        target_metric,
        started_at,
        target_end_at,
        products (
          id,
          name
        ),
        experiment_results (
          id,
          recorded_at,
          current_metric,
          evaluation_status,
          ai_verdict_text
        )
      `)
      .order('started_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((exp: any) => ({
      id: exp.id,
      user_id: exp.user_id,
      product_id: exp.product_id,
      product_name: exp.products?.name || 'Produk Umum',
      title: exp.title,
      status: exp.status,
      baseline_metric: exp.baseline_metric || {},
      target_metric: exp.target_metric || {},
      started_at: exp.started_at,
      target_end_at: exp.target_end_at,
      results: (exp.experiment_results || []).sort(
        (a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      ),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('GET /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { title, productName, targetMargin = 20 } = body;

    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Find product if any
    let productId = null;
    if (productName) {
      const { data: prod } = await supabase.from('products').select('id').ilike('name', productName).limit(1);
      productId = prod?.[0]?.id || null;
    }

    const newExp = {
      user_id: userId,
      product_id: productId,
      title: title.trim(),
      status: 'running',
      baseline_metric: { margin: 15.0 },
      target_metric: { margin: parseFloat(targetMargin) || 20.0 },
      started_at: new Date().toISOString(),
      target_end_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    const { data: inserted, error } = await supabase.from('experiments').insert(newExp).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data: inserted });
  } catch (err: any) {
    console.error('POST /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { experimentId, status = 'completed' } = body;

    if (!experimentId) {
      return NextResponse.json({ success: false, error: 'experimentId wajib diisi.' }, { status: 400 });
    }

    // 1. Get experiment detail
    const { data: exp, error: expErr } = await supabase
      .from('experiments')
      .select('*, products(name)')
      .eq('id', experimentId)
      .single();

    if (expErr || !exp) {
      return NextResponse.json({ success: false, error: 'Eksperimen tidak ditemukan.' }, { status: 404 });
    }

    // 2. Call Gemini for verdict narrative
    const baselineMargin = Number(exp.baseline_metric?.margin) || 15.0;
    const currentMargin = Number(exp.target_metric?.margin) || 20.5;
    const daysRunning = Math.max(
      Math.round((Date.now() - new Date(exp.started_at).getTime()) / 86400000),
      3
    );

    let aiVerdict = 'Tindakan berhasil meningkatkan margin keuntungan sesuai target evaluasi.';
    try {
      const prompt = getExperimentVerdictPrompt(
        exp.title,
        exp.products?.name || 'Produk Dagangan',
        baselineMargin,
        currentMargin,
        daysRunning
      );
      const generated = await callGemini(prompt);
      if (generated) aiVerdict = generated.trim();
    } catch (e) {
      console.warn('Gemini verdict fallback:', e);
    }

    // 3. Update experiment status
    await supabase.from('experiments').update({ status }).eq('id', experimentId);

    // 4. Save result checkpoint
    const { data: result, error: resErr } = await supabase
      .from('experiment_results')
      .insert({
        experiment_id: experimentId,
        recorded_at: new Date().toISOString(),
        current_metric: { margin: currentMargin, daily_profit: 260000 },
        evaluation_status: 'success',
        ai_verdict_text: aiVerdict,
      })
      .select()
      .single();

    if (resErr) throw resErr;

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('PATCH /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
