import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function checkAllTables() {
  const tables = ['profiles', 'products', 'transactions', 'transaction_items', 'ai_insights', 'experiments', 'experiment_results'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table [${table}]: ERROR ->`, error.message);
    } else {
      console.log(`Table [${table}]: OK -> count:`, count);
    }
  }
}

checkAllTables();
