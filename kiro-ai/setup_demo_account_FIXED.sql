-- ==============================================================================
-- SETUP AKUN DEMO PERMANENT - VokaSync (FIXED VERSION)
-- ✅ Sudah disesuaikan dengan constraint database yang ada
-- ==============================================================================

DO $$
DECLARE
  -- UUID user demo yang sudah dibuat di Supabase Auth
  v_demo_user_id UUID := '34f9e50b-d4ba-41b1-807d-7807eb5e0d77';
  
  -- Product UUIDs (fixed untuk kemudahan maintenance)
  v_prod_bawang UUID := 'dd90e8c0-1234-4001-a001-000000000001';
  v_prod_cabai UUID := 'dd90e8c0-1234-4001-a001-000000000002';
  v_prod_tomat UUID := 'dd90e8c0-1234-4001-a001-000000000003';
  v_prod_kangkung UUID := 'dd90e8c0-1234-4001-a001-000000000004';
  v_prod_ayam UUID := 'dd90e8c0-1234-4001-a001-000000000005';
  v_prod_telur UUID := 'dd90e8c0-1234-4001-a001-000000000006';
  
  -- Transaction UUIDs
  v_tx1 UUID := gen_random_uuid();
  v_tx2 UUID := gen_random_uuid();
  v_tx3 UUID := gen_random_uuid();
  v_tx4 UUID := gen_random_uuid();
  v_tx5 UUID := gen_random_uuid();
  v_tx6 UUID := gen_random_uuid();
  v_tx7 UUID := gen_random_uuid();
  v_tx8 UUID := gen_random_uuid();
  
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VokaSync Demo Account Setup';
  RAISE NOTICE 'User ID: %', v_demo_user_id;
  RAISE NOTICE '========================================';

  -- ============================================================================
  -- 1. INSERT PROFILE
  -- ⚠️ PERBAIKAN: business_type harus 'pasar' bukan 'Sayur & Buah'
  -- ============================================================================
  INSERT INTO public.profiles (
    id, 
    business_name, 
    owner_name, 
    business_type,
    margin_alert_threshold,
    low_stock_threshold,
    supplier_cost_increase_threshold,
    sound_alert_enabled,
    text_size
  ) VALUES (
    v_demo_user_id,
    'Kios Berkah Sayur',
    'Pak Budi',
    'pasar', -- ✅ DIPERBAIKI: pakai 'pasar' sesuai constraint
    20,
    2,
    5,
    true,
    'normal'
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = EXCLUDED.owner_name,
    business_type = EXCLUDED.business_type;

  RAISE NOTICE '✓ Profile created: Pak Budi - Kios Berkah Sayur';

  -- ============================================================================
  -- 2. INSERT PRODUCTS (TANPA image_url karena kolom tidak ada di DB)
  -- ============================================================================
  INSERT INTO public.products (id, user_id, name, default_unit) VALUES
    (v_prod_bawang, v_demo_user_id, 'Bawang Merah Brebes', 'kg'),
    (v_prod_cabai, v_demo_user_id, 'Cabai Rawit Merah', 'kg'),
    (v_prod_tomat, v_demo_user_id, 'Tomat Buah Segar', 'kg'),
    (v_prod_kangkung, v_demo_user_id, 'Kangkung Segar', 'ikat'),
    (v_prod_ayam, v_demo_user_id, 'Ayam Potong Segar', 'kg'),
    (v_prod_telur, v_demo_user_id, 'Telur Ayam Negeri', 'kg')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ 6 Products inserted (without images)';

  -- ============================================================================
  -- 3. TRANSAKSI BELANJA MODAL (EXPENSE) - 7 HARI LALU
  -- ============================================================================
  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx1, v_demo_user_id, 'expense', NOW() - INTERVAL '7 days', 'manual', 'Belanja stok pasar induk');

  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx1, v_prod_bawang, 50, 'kg', 30000),
    (v_tx1, v_prod_cabai, 20, 'kg', 45000),
    (v_tx1, v_prod_tomat, 40, 'kg', 10000),
    (v_tx1, v_prod_kangkung, 60, 'ikat', 2000),
    (v_tx1, v_prod_ayam, 15, 'kg', 32000),
    (v_tx1, v_prod_telur, 50, 'kg', 26000);

  RAISE NOTICE '✓ Expense (7 days ago): Rp3.990.000';

  -- ============================================================================
  -- 4. STOCK BATCHES (FIFO)
  -- ============================================================================
  INSERT INTO public.stock_batches (user_id, product_id, transaction_id, initial_quantity, remaining_quantity, cost_price, unit, status) VALUES
    (v_demo_user_id, v_prod_bawang, v_tx1, 50, 24, 30000, 'kg', 'active'),
    (v_demo_user_id, v_prod_cabai, v_tx1, 20, 6, 45000, 'kg', 'active'),
    (v_demo_user_id, v_prod_tomat, v_tx1, 40, 28, 10000, 'kg', 'active'),
    (v_demo_user_id, v_prod_kangkung, v_tx1, 60, 35, 2000, 'ikat', 'active'),
    (v_demo_user_id, v_prod_ayam, v_tx1, 15, 8, 32000, 'kg', 'active'),
    (v_demo_user_id, v_prod_telur, v_tx1, 50, 45, 26000, 'kg', 'active');

  RAISE NOTICE '✓ Stock batches (FIFO) created';

  -- ============================================================================
  -- 5. TRANSAKSI PENJUALAN KEMARIN (INCOME)
  -- ============================================================================
  
  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx2, v_demo_user_id, 'income', NOW() - INTERVAL '1 day' - INTERVAL '6 hours', 'voice', 'Jual bawang merah lima kilo dua ratus ribu');
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx2, v_prod_bawang, 5, 'kg', 40000);

  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx3, v_demo_user_id, 'income', NOW() - INTERVAL '1 day' - INTERVAL '3 hours', 'voice', 'Jual cabai rawit merah tiga kilo seratus enam puluh dua ribu');
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx3, v_prod_cabai, 3, 'kg', 54000);

  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx4, v_demo_user_id, 'income', NOW() - INTERVAL '1 day' - INTERVAL '1 hour', 'manual', NULL);
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx4, v_prod_ayam, 2, 'kg', 38000);

  RAISE NOTICE '✓ Income (yesterday): Rp338.000';

  -- ============================================================================
  -- 6. TRANSAKSI PENJUALAN HARI INI (INCOME)
  -- ============================================================================
  
  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx5, v_demo_user_id, 'income', NOW() - INTERVAL '3 hours', 'voice', 'Jual bawang merah dua kilo delapan puluh ribu');
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx5, v_prod_bawang, 2, 'kg', 40000);

  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx6, v_demo_user_id, 'income', NOW() - INTERVAL '2 hours', 'voice', 'Jual cabai rawit satu kilo lima puluh empat ribu');
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx6, v_prod_cabai, 1, 'kg', 54000);

  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx7, v_demo_user_id, 'income', NOW() - INTERVAL '1 hour', 'manual', NULL);
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx7, v_prod_tomat, 3, 'kg', 15000);

  INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text)
  VALUES (v_tx8, v_demo_user_id, 'expense', NOW() - INTERVAL '30 minutes', 'voice', 'Beli stok kangkung tiga puluh ikat enam puluh ribu');
  INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
    (v_tx8, v_prod_kangkung, 30, 'ikat', 2000);

  RAISE NOTICE '✓ Income (today): Rp179.000, Expense: Rp60.000';

  -- ============================================================================
  -- 7. AI INSIGHTS
  -- ============================================================================
  INSERT INTO public.ai_insights (user_id, product_id, severity, message, has_quick_action, metric_snapshot) VALUES
    (v_demo_user_id, v_prod_cabai, 'yellow', 
     'Pak Budi, keuntungan Cabai Rawit Merah (17%) di bawah target aman 20%. Coba naikkan harga jual dari Rp54.000 ke Rp56.000/kg atau pantau via Coba & Pantau.', 
     true, 
     '{"current_margin": 17, "threshold": 20, "price_change": 2000, "affected_item": "Cabai Rawit Merah"}'::jsonb),
    (v_demo_user_id, v_prod_bawang, 'green', 
     'Bawang Merah mencatat margin sehat 25% dengan penjualan stabil 15 kg/minggu. Pertahankan harga dan promosikan lebih gencar.', 
     false, 
     '{"current_margin": 25}'::jsonb);

  RAISE NOTICE '✓ 2 AI Insights inserted';

  -- ============================================================================
  -- 8. EKSPERIMEN BISNIS
  -- ============================================================================
  INSERT INTO public.experiments (user_id, product_id, title, status, baseline_metric, target_metric, started_at, target_end_at) VALUES
    (v_demo_user_id, v_prod_cabai, 'Naikkan Harga Cabai Rawit +Rp2.000', 'running', 
     '{"margin": 17, "price": 54000, "daily_volume": 8}'::jsonb,
     '{"margin": 20, "price": 56000, "daily_volume": 8}'::jsonb,
     NOW() - INTERVAL '2 days',
     NOW() + INTERVAL '5 days');

  RAISE NOTICE '✓ 1 Experiment created';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: demo@vokasync.id';
  RAISE NOTICE 'Password: demovokasync123';
  RAISE NOTICE '';
  RAISE NOTICE '• Profile: Pak Budi - Kios Berkah Sayur';
  RAISE NOTICE '• Products: 6 items';
  RAISE NOTICE '• Transactions: 8 records';
  RAISE NOTICE '• Stock Batches: 6 FIFO entries';
  RAISE NOTICE '• AI Insights: 2 recommendations';
  RAISE NOTICE '• Experiments: 1 running';
  RAISE NOTICE '========================================';

END $$;
