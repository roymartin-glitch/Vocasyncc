import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase.from('profiles').select('*').limit(1).single();

    if (error) throw error;

    // Merge app_settings JSONB if present
    const appSettings = profile?.app_settings || {};
    const merged = {
      ...profile,
      low_stock_threshold: profile?.low_stock_threshold ?? appSettings.low_stock_threshold ?? 20,
      supplier_cost_increase_threshold: profile?.supplier_cost_increase_threshold ?? appSettings.supplier_cost_increase_threshold ?? 5,
      sound_alert_enabled: profile?.sound_alert_enabled ?? appSettings.sound_alert_enabled ?? false,
      sound_alert_volume: profile?.sound_alert_volume ?? appSettings.sound_alert_volume ?? 80,
      text_size: profile?.text_size ?? appSettings.text_size ?? 'normal',
      theme: profile?.theme ?? appSettings.theme ?? 'terang',
      default_unit: profile?.default_unit ?? appSettings.default_unit ?? 'kg',
      analysis_period: profile?.analysis_period ?? appSettings.analysis_period ?? '7d',
    };

    return NextResponse.json({ success: true, data: merged });
  } catch (err: any) {
    console.error('GET /api/settings error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const {
      business_name,
      owner_name,
      business_type,
      margin_alert_threshold,
      low_stock_threshold,
      supplier_cost_increase_threshold,
      sound_alert_enabled,
      sound_alert_volume,
      text_size,
      theme,
      default_unit,
      analysis_period,
    } = body;

    const { data: profiles } = await supabase.from('profiles').select('id, app_settings').limit(1);
    const userProfile = profiles?.[0];
    const userId = userProfile?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Profil tidak ditemukan.' }, { status: 404 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (business_name !== undefined) updates.business_name = business_name;
    if (owner_name !== undefined) updates.owner_name = owner_name;
    if (business_type !== undefined) updates.business_type = business_type;
    if (margin_alert_threshold !== undefined) updates.margin_alert_threshold = parseFloat(margin_alert_threshold) || 20;

    // Extended settings
    if (low_stock_threshold !== undefined) updates.low_stock_threshold = parseFloat(low_stock_threshold) || 20;
    if (supplier_cost_increase_threshold !== undefined) updates.supplier_cost_increase_threshold = parseFloat(supplier_cost_increase_threshold) || 5;
    if (sound_alert_enabled !== undefined) updates.sound_alert_enabled = Boolean(sound_alert_enabled);
    if (sound_alert_volume !== undefined) updates.sound_alert_volume = parseFloat(sound_alert_volume) || 80;
    if (text_size !== undefined) updates.text_size = text_size;
    if (theme !== undefined) updates.theme = theme;
    if (default_unit !== undefined) updates.default_unit = default_unit;
    if (analysis_period !== undefined) updates.analysis_period = analysis_period;

    // Try full update
    let updatedData: any = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      updatedData = data;
    } catch (updateErr) {
      // Fallback: update baseline columns + store extended settings in app_settings JSONB or return merged
      console.warn('Extended columns update fallback:', updateErr);
      const fallbackUpdates: any = {
        updated_at: new Date().toISOString(),
        business_name: updates.business_name,
        owner_name: updates.owner_name,
        business_type: updates.business_type,
        margin_alert_threshold: updates.margin_alert_threshold,
        app_settings: {
          ...(userProfile?.app_settings || {}),
          low_stock_threshold: updates.low_stock_threshold,
          supplier_cost_increase_threshold: updates.supplier_cost_increase_threshold,
          sound_alert_enabled: updates.sound_alert_enabled,
          sound_alert_volume: updates.sound_alert_volume,
          text_size: updates.text_size,
          theme: updates.theme,
          default_unit: updates.default_unit,
          analysis_period: updates.analysis_period,
        },
      };

      const { data: fbData } = await supabase
        .from('profiles')
        .update(fallbackUpdates)
        .eq('id', userId)
        .select()
        .single();

      updatedData = fbData || { ...userProfile, ...updates };
    }

    return NextResponse.json({ success: true, data: updatedData });
  } catch (err: any) {
    console.error('PATCH /api/settings error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
