import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

console.log('Testing Supabase URL:', supabaseUrl);
console.log('Testing Anon Key prefix:', supabaseKey?.substring(0, 10));
console.log('Testing Gemini Key prefix:', geminiKey?.substring(0, 8));

async function checkSupabase() {
  try {
    const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
    if (error) {
      console.error('Supabase Query Error:', error.message);
    } else {
      console.log('Supabase Connected Successfully! Profiles row count:', data.length);
      console.log('Sample profiles data:', data);
    }
  } catch (err) {
    console.error('Connection catch:', err);
  }
}

checkSupabase();
