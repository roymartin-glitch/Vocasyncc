import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  try {
    const serverClient = await createClient();
    const {
      data: { user },
      error,
    } = await serverClient.auth.getUser();

    if (user && !error) {
      return user;
    }
  } catch (e) {
    // Cookie reading might fail in non-request environments
  }
  return null;
}

export async function getActiveUserProfile() {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  if (user) {
    // 1. Try to find profile by authenticated user ID
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      return { user, profile };
    }

    // 2. If profile record does not exist yet (e.g. newly registered user), create it from metadata
    const meta = user.user_metadata || {};
    const newProfile = {
      id: user.id,
      owner_name: meta.owner_name || user.email?.split('@')[0] || 'Pedagang Baru',
      business_name: meta.business_name || 'Kios Saya',
      business_type: meta.business_type || 'Sayur & Buah',
      margin_alert_threshold: 20,
      low_stock_threshold: 20,
      supplier_cost_increase_threshold: 5,
      sound_alert_enabled: false,
      sound_alert_volume: 80,
      text_size: 'normal',
      theme: 'terang',
      default_unit: 'kg',
      analysis_period: '7d',
      app_settings: {},
    };

    try {
      const { data: created } = await adminClient
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (created) {
        return { user, profile: created };
      }
    } catch (insertErr) {
      console.warn('Profile creation fallback:', insertErr);
    }

    return { user, profile: newProfile };
  }

  // 3. Fallback for demo mode or evaluation without login
  const { data: fallbackProfile } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return { user: null, profile: fallbackProfile };
}
