import {
  Profile,
  DashboardMetrics,
  TrendDayData,
  AIInsight,
  ProductAnalysisItem,
  Transaction,
  Experiment
} from '@/types';

export const mockProfile: Profile = {
  id: 'user-001',
  business_name: 'Kios Berkah Sayur',
  owner_name: 'Pak Budi',
  business_type: 'pasar',
  margin_alert_threshold: 20,
};

export const mockDashboardMetrics: DashboardMetrics = {
  today_income: 1450000,
  today_income_change: 12.8,
  today_expense: 920000,
  today_expense_change: -3.5,
  today_profit: 530000,
  today_profit_change: 18.2,
  today_margin: 36.5,
  today_margin_change: 2.4,
};

export const mockTrendData: TrendDayData[] = [
  { date: '2026-09-01', dayName: 'Sen', income: 1100000, expense: 750000 },
  { date: '2026-09-02', dayName: 'Sel', income: 1250000, expense: 800000 },
  { date: '2026-09-03', dayName: 'Rab', income: 980000, expense: 620000 },
  { date: '2026-09-04', dayName: 'Kam', income: 1320000, expense: 910000 },
  { date: '2026-09-05', dayName: 'Jum', income: 1540000, expense: 1050000 },
  { date: '2026-09-06', dayName: 'Sab', income: 1780000, expense: 1120000 },
  { date: '2026-09-07', dayName: 'Min', income: 1450000, expense: 920000 },
];

export const mockInsights: AIInsight[] = [
  {
    id: 'ins-1',
    user_id: 'user-001',
    product_id: 'prod-1',
    product_name: 'Bawang Merah Brebes',
    severity: 'red',
    message:
      'Pak Budi, margin Bawang Merah tergerus turun ke 14,3% (di bawah target 20%). Penyebabnya: harga beli dari agen naik dari Rp28.000 ke Rp34.000/kg sejak kemarin, namun harga jual Bapak masih bertahan di Rp40.000/kg.',
    has_quick_action: true,
    metric_snapshot: {
      current_margin: 14.3,
      threshold: 20,
      cost_increase: 6000,
    },
    created_at: '10 menit yang lalu',
  },
  {
    id: 'ins-2',
    user_id: 'user-001',
    product_id: 'prod-2',
    product_name: 'Bawang Putih Kating',
    severity: 'green',
    message:
      'Bawang Putih mencatat margin paling sehat minggu ini sebesar 42,8%. Pembeli stabil 15 kg/hari dan pasokan grosir masih sangat aman.',
    has_quick_action: false,
    metric_snapshot: {
      current_margin: 42.8,
    },
    created_at: '2 jam yang lalu',
  },
  {
    id: 'ins-3',
    user_id: 'user-001',
    product_id: 'prod-3',
    product_name: 'Cabai Rawit Merah',
    severity: 'yellow',
    message:
      'Harga kulakan Cabai Rawit mulai fluktuatif di Pasar Induk. Disarankan pantau stok harian dan jangan menyetok lebih dari 2 hari ke depan.',
    has_quick_action: false,
    metric_snapshot: {
      current_margin: 22.5,
    },
    created_at: '5 jam yang lalu',
  },
];

export const mockProducts: ProductAnalysisItem[] = [
  {
    id: 'prod-1',
    name: 'Bawang Merah Brebes',
    unit: 'kg',
    cost_price: 34000,
    selling_price: 40000,
    margin_percentage: 15.0,
    action_category: 'perbaiki',
    avg_daily_volume: 24,
    total_revenue_7d: 6720000,
    remaining_stock: 12,
    is_stock_low: false,
  },
  {
    id: 'prod-2',
    name: 'Bawang Putih Kating',
    unit: 'kg',
    cost_price: 28000,
    selling_price: 49000,
    margin_percentage: 42.8,
    action_category: 'dorong',
    avg_daily_volume: 18,
    total_revenue_7d: 6174000,
    remaining_stock: 18,
    is_stock_low: false,
  },
  {
    id: 'prod-3',
    name: 'Cabai Rawit Merah',
    unit: 'kg',
    cost_price: 45000,
    selling_price: 60000,
    margin_percentage: 25.0,
    action_category: 'pertahankan',
    avg_daily_volume: 12,
    total_revenue_7d: 5040000,
    remaining_stock: 3,
    is_stock_low: true,
  },
  {
    id: 'prod-4',
    name: 'Bawang Bombay',
    unit: 'kg',
    cost_price: 22000,
    selling_price: 32000,
    margin_percentage: 31.2,
    action_category: 'pertahankan',
    avg_daily_volume: 8,
    total_revenue_7d: 1792000,
    remaining_stock: 8,
    is_stock_low: false,
  },
  {
    id: 'prod-5',
    name: 'Jahe Gajah',
    unit: 'kg',
    cost_price: 26000,
    selling_price: 28000,
    margin_percentage: 7.1,
    action_category: 'kurangi',
    avg_daily_volume: 3,
    total_revenue_7d: 588000,
    remaining_stock: 2,
    is_stock_low: true,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    user_id: 'user-001',
    type: 'income',
    transaction_date: '2026-09-07T08:30:00Z',
    source: 'voice',
    raw_voice_text: 'Jual bawang merah 5 kilo dapat 200 ribu',
    total_amount: 200000,
    items: [
      {
        id: 'txi-001',
        transaction_id: 'tx-001',
        product_id: 'prod-1',
        product_name: 'Bawang Merah Brebes',
        quantity: 5,
        unit: 'kg',
        unit_price: 40000,
        subtotal: 200000,
      },
    ],
  },
  {
    id: 'tx-002',
    user_id: 'user-001',
    type: 'expense',
    transaction_date: '2026-09-07T05:15:00Z',
    source: 'manual',
    total_amount: 680000,
    items: [
      {
        id: 'txi-002',
        transaction_id: 'tx-002',
        product_id: 'prod-1',
        product_name: 'Bawang Merah Brebes',
        quantity: 20,
        unit: 'kg',
        unit_price: 34000,
        subtotal: 680000,
      },
    ],
  },
  {
    id: 'tx-003',
    user_id: 'user-001',
    type: 'income',
    transaction_date: '2026-09-07T09:45:00Z',
    source: 'manual',
    total_amount: 147000,
    items: [
      {
        id: 'txi-003',
        transaction_id: 'tx-003',
        product_id: 'prod-2',
        product_name: 'Bawang Putih Kating',
        quantity: 3,
        unit: 'kg',
        unit_price: 49000,
        subtotal: 147000,
      },
    ],
  },
  {
    id: 'tx-004',
    user_id: 'user-001',
    type: 'expense',
    transaction_date: '2026-09-07T05:30:00Z',
    source: 'manual',
    total_amount: 240000,
    items: [
      {
        id: 'txi-004',
        transaction_id: 'tx-004',
        product_id: 'prod-4',
        product_name: 'Bawang Bombay',
        quantity: 10,
        unit: 'kg',
        unit_price: 24000,
        subtotal: 240000,
      },
    ],
  },
  {
    id: 'tx-005',
    user_id: 'user-001',
    type: 'income',
    transaction_date: '2026-09-07T11:10:00Z',
    source: 'voice',
    raw_voice_text: 'Jual cabai rawit merah 2 kilo total 120 ribu',
    total_amount: 120000,
    items: [
      {
        id: 'txi-005',
        transaction_id: 'tx-005',
        product_id: 'prod-3',
        product_name: 'Cabai Rawit Merah',
        quantity: 2,
        unit: 'kg',
        unit_price: 60000,
        subtotal: 120000,
      },
    ],
  },
];

export const mockExperiments: Experiment[] = [
  {
    id: 'exp-1',
    user_id: 'user-001',
    product_id: 'prod-1',
    product_name: 'Bawang Merah Brebes',
    title: 'Naikkan harga jual Bawang Merah ke Rp42.000/kg',
    status: 'running',
    started_at: '2026-09-05T00:00:00Z',
    target_end_at: '2026-09-12T00:00:00Z',
    baseline_metric: {
      margin: 15.0,
      price: 40000,
      daily_volume: 24,
    },
    target_metric: {
      margin: 19.0,
      price: 42000,
      daily_volume: 22,
    },
    results: [
      {
        id: 'expr-1',
        experiment_id: 'exp-1',
        recorded_at: '2026-09-07T12:00:00Z',
        current_metric: {
          margin: 19.0,
          price: 42000,
          daily_volume: 23,
        },
        evaluation_status: 'in_progress',
        ai_verdict_text: 'Hingga hari ke-3, volume penjualan hanya turun 1 kg tetapi margin pulih mendekati target 20%. Pertahankan.',
      },
    ],
  },
  {
    id: 'exp-2',
    user_id: 'user-001',
    product_id: 'prod-2',
    product_name: 'Bawang Putih Kating',
    title: 'Paket Bundling Bawang Putih Kupas 500gr',
    status: 'completed',
    started_at: '2026-08-25T00:00:00Z',
    target_end_at: '2026-09-01T00:00:00Z',
    baseline_metric: {
      margin: 32.0,
      daily_profit: 180000,
    },
    target_metric: {
      margin: 40.0,
      daily_profit: 260000,
    },
    results: [
      {
        id: 'expr-2',
        experiment_id: 'exp-2',
        recorded_at: '2026-09-01T18:00:00Z',
        current_metric: {
          margin: 42.8,
          daily_profit: 310000,
        },
        evaluation_status: 'success',
        ai_verdict_text:
          'Eksperimen sangat berhasil! Pembeli rumah tangga menyukai opsi kupas siap pakai. Keuntungan harian naik 72% dari baseline.',
      },
    ],
  },
];
