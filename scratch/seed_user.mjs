import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function seedUser() {
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  if (!profiles || profiles.length === 0) {
    console.error('No profiles found!');
    return;
  }
  const userId = profiles[0].id;
  console.log('Seeding data for user:', userId);

  // 1. Seed Products
  const products = [
    { name: 'Bawang Merah Brebes', default_unit: 'kg', user_id: userId },
    { name: 'Bawang Putih Kating', default_unit: 'kg', user_id: userId },
    { name: 'Cabai Rawit Merah', default_unit: 'kg', user_id: userId },
    { name: 'Bawang Bombay', default_unit: 'kg', user_id: userId },
    { name: 'Jahe Gajah', default_unit: 'kg', user_id: userId },
  ];

  const { data: insertedProducts, error: prodErr } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (prodErr) {
    console.error('Product insert error:', prodErr.message);
    return;
  }
  console.log('Inserted products:', insertedProducts.length);

  const prodMap = {};
  insertedProducts.forEach(p => { prodMap[p.name] = p.id; });

  // 2. Seed Transactions & Transaction Items (Past 7 days)
  const now = new Date();
  
  // Expense: Bawang Merah modal
  const { data: tx1 } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'expense',
    transaction_date: new Date(now.getTime() - 6 * 3600000).toISOString(),
    source: 'manual',
  }).select().single();

  await supabase.from('transaction_items').insert({
    transaction_id: tx1.id,
    product_id: prodMap['Bawang Merah Brebes'],
    quantity: 20,
    unit: 'kg',
    unit_price: 34000,
  });

  // Expense: Cabai Rawit Merah modal
  const { data: tx2 } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'expense',
    transaction_date: new Date(now.getTime() - 5 * 3600000).toISOString(),
    source: 'manual',
  }).select().single();

  await supabase.from('transaction_items').insert({
    transaction_id: tx2.id,
    product_id: prodMap['Cabai Rawit Merah'],
    quantity: 10,
    unit: 'kg',
    unit_price: 45000,
  });

  // Income: Jual Bawang Merah
  const { data: tx3 } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'income',
    transaction_date: new Date(now.getTime() - 3 * 3600000).toISOString(),
    source: 'voice',
    raw_voice_text: 'Jual bawang merah 5 kilo dapat 200 ribu',
  }).select().single();

  await supabase.from('transaction_items').insert({
    transaction_id: tx3.id,
    product_id: prodMap['Bawang Merah Brebes'],
    quantity: 5,
    unit: 'kg',
    unit_price: 40000,
  });

  // Income: Jual Bawang Putih
  const { data: tx4 } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'income',
    transaction_date: new Date(now.getTime() - 2 * 3600000).toISOString(),
    source: 'manual',
  }).select().single();

  await supabase.from('transaction_items').insert({
    transaction_id: tx4.id,
    product_id: prodMap['Bawang Putih Kating'],
    quantity: 3,
    unit: 'kg',
    unit_price: 49000,
  });

  // Income: Jual Cabai Rawit
  const { data: tx5 } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'income',
    transaction_date: new Date(now.getTime() - 1 * 3600000).toISOString(),
    source: 'voice',
    raw_voice_text: 'Jual cabai rawit merah 2 kilo total 120 ribu',
  }).select().single();

  await supabase.from('transaction_items').insert({
    transaction_id: tx5.id,
    product_id: prodMap['Cabai Rawit Merah'],
    quantity: 2,
    unit: 'kg',
    unit_price: 60000,
  });

  console.log('Inserted 5 transactions and items!');

  // 3. Seed AI Insights
  await supabase.from('ai_insights').insert([
    {
      user_id: userId,
      product_id: prodMap['Bawang Merah Brebes'],
      severity: 'red',
      message: 'Pak Budi, margin Bawang Merah tergerus turun ke 14,3% (di bawah target 20%). Penyebabnya: harga beli kulakan naik menjadi Rp34.000/kg namun harga jual masih Rp40.000/kg.',
      has_quick_action: true,
      metric_snapshot: { current_margin: 14.3, threshold: 20, cost_increase: 6000 },
    },
    {
      user_id: userId,
      product_id: prodMap['Bawang Putih Kating'],
      severity: 'green',
      message: 'Bawang Putih mencatat margin paling sehat sebesar 42,8% dengan penjualan stabil 15 kg/hari.',
      has_quick_action: false,
      metric_snapshot: { current_margin: 42.8 },
    },
  ]);
  console.log('Inserted AI insights!');

  // 4. Seed Experiments & Results
  const { data: exp1 } = await supabase.from('experiments').insert({
    user_id: userId,
    product_id: prodMap['Bawang Merah Brebes'],
    title: 'Naikkan harga jual Bawang Merah ke Rp42.000/kg',
    status: 'running',
    baseline_metric: { margin: 15.0, price: 40000 },
    target_metric: { margin: 19.0, price: 42000 },
    started_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    target_end_at: new Date(now.getTime() + 4 * 86400000).toISOString(),
  }).select().single();

  await supabase.from('experiment_results').insert({
    experiment_id: exp1.id,
    recorded_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
    current_metric: { margin: 19.0, daily_volume: 23 },
    evaluation_status: 'in_progress',
    ai_verdict_text: 'Hingga hari ke-3, volume penjualan stabil dan margin pulih mendekati target 20%.',
  });

  const { data: exp2 } = await supabase.from('experiments').insert({
    user_id: userId,
    product_id: prodMap['Bawang Putih Kating'],
    title: 'Paket Bundling Bawang Putih Kupas 500gr',
    status: 'completed',
    baseline_metric: { margin: 32.0, daily_profit: 180000 },
    target_metric: { margin: 40.0, daily_profit: 260000 },
    started_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
    target_end_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
  }).select().single();

  await supabase.from('experiment_results').insert({
    experiment_id: exp2.id,
    recorded_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
    current_metric: { margin: 42.8, daily_profit: 310000 },
    evaluation_status: 'success',
    ai_verdict_text: 'Eksperimen sangat berhasil! Pembeli rumah tangga menyukai opsi kupas siap pakai. Keuntungan harian naik 72%.',
  });

  console.log('Inserted experiments and results!');
  console.log('Seeding completed successfully!');
}

seedUser();
