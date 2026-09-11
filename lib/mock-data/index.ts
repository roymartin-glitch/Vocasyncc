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
  today_income: 0,
  today_income_change: 0,
  today_expense: 0,
  today_expense_change: 0,
  today_profit: 0,
  today_profit_change: 0,
  today_margin: 0,
  today_margin_change: 0,
};

export const mockTrendData: TrendDayData[] = [];

export const mockInsights: AIInsight[] = [];

export const mockProducts: ProductAnalysisItem[] = [];

export const mockTransactions: Transaction[] = [];

export const mockExperiments: Experiment[] = [];
