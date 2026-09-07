import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase.from('profiles').select('*').limit(1).single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: profile });
  } catch (err: any) {
    console.error('GET /api/settings error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { business_name, owner_name, business_type, margin_alert_threshold } = body;

    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Profil tidak ditemukan.' }, { status: 404 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (business_name !== undefined) updates.business_name = business_name;
    if (owner_name !== undefined) updates.owner_name = owner_name;
    if (business_type !== undefined) updates.business_type = business_type;
    if (margin_alert_threshold !== undefined) updates.margin_alert_threshold = parseFloat(margin_alert_threshold) || 20;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('PATCH /api/settings error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
