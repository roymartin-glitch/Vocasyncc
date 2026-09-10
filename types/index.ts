export type BusinessType = 'pasar' | 'kuliner' | 'kriya' | 'kelontong' | 'lainnya';

export interface Profile {
  id: string;
  business_name: string;
  owner_name: string;
  business_type: BusinessType;
  margin_alert_threshold: number; // default 20%
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  default_unit: string;
  created_at?: string;
}

export type TransactionType = 'expense' | 'income';
export type TransactionSource = 'voice' | 'manual';

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  transaction_date: string;
  source: TransactionSource;
  raw_voice_text?: string | null;
  created_at?: string;
  items: TransactionItem[];
  total_amount?: number;
}

export type SeverityLevel = 'red' | 'yellow' | 'green';

export interface AIInsight {
  id: string;
  user_id: string;
  product_id?: string | null;
  product_name?: string | null;
  severity: SeverityLevel;
  message: string;
  has_quick_action: boolean;
  metric_snapshot?: {
    current_margin?: number;
    threshold?: number;
    price_change?: number;
    affected_item?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export type ExperimentStatus = 'running' | 'completed';
export type EvaluationStatus = 'in_progress' | 'success' | 'partial' | 'failed';

export interface ExperimentMetric {
  margin: number;
  price?: number;
  daily_volume?: number;
  daily_profit?: number;
  [key: string]: unknown;
}

export interface Experiment {
  id: string;
  user_id: string;
  product_id?: string | null;
  product_name?: string | null;
  title: string;
  status: ExperimentStatus;
  baseline_metric: ExperimentMetric;
  target_metric?: ExperimentMetric | null;
  started_at: string;
  target_end_at?: string | null;
  created_at?: string;
  results?: ExperimentResult[];
}

export interface ExperimentResult {
  id: string;
  experiment_id: string;
  recorded_at: string;
  current_metric: ExperimentMetric;
  evaluation_status?: EvaluationStatus | null;
  ai_verdict_text?: string | null;
  created_at?: string;
}

export type ProductActionCategory = 'dorong' | 'pertahankan' | 'perbaiki' | 'kurangi';

export type StockBatchStatus = 'active' | 'depleted';

export interface StockBatch {
  id: string;
  user_id: string;
  product_id: string;
  transaction_id?: string | null;
  initial_quantity: number;
  remaining_quantity: number;
  cost_price: number;
  unit: string;
  status: StockBatchStatus;
  created_at: string;
}

export interface ProductAnalysisItem {
  id: string;
  name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  margin_percentage: number;
  action_category: ProductActionCategory;
  avg_daily_volume: number;
  total_revenue_7d: number;
  remaining_stock?: number;
  is_stock_low?: boolean;
}

export interface DashboardMetrics {
  today_income: number;
  today_income_change: number; // percentage change vs yesterday
  today_expense: number;
  today_expense_change: number;
  today_profit: number;
  today_profit_change: number;
  today_margin: number;
  today_margin_change: number;
}

export interface TrendDayData {
  date: string;
  dayName: string;
  income: number;
  expense: number;
}
