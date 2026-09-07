import { ProductActionCategory, SeverityLevel, TrendDayData } from '@/types';

export function calculateMargin(costPrice: number, sellingPrice: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  if (!costPrice || costPrice <= 0) return 100;
  const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
  return Math.round(margin * 10) / 10;
}

export function determineActionCategory(
  margin: number,
  threshold: number = 20
): ProductActionCategory {
  if (margin >= 35) return 'dorong';
  if (margin >= threshold) return 'pertahankan';
  if (margin >= 10) return 'perbaiki';
  return 'kurangi';
}

export function determineSeverity(
  margin: number,
  threshold: number = 20
): { severity: SeverityLevel; hasQuickAction: boolean } {
  if (margin < threshold) {
    return { severity: 'red', hasQuickAction: true };
  }
  if (margin < threshold + 5) {
    return { severity: 'yellow', hasQuickAction: false };
  }
  return { severity: 'green', hasQuickAction: false };
}

export function build7DayTrend(transactionsWithItems: any[]): TrendDayData[] {
  const days: TrendDayData[] = [];
  const now = new Date();

  // Create array for past 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayName = dayNames[d.getDay()];

    days.push({
      date: dateStr,
      dayName,
      income: 0,
      expense: 0,
    });
  }

  // Aggregate transactions by date
  transactionsWithItems.forEach((tx) => {
    const txDate = tx.transaction_date.split('T')[0];
    const targetDay = days.find((d) => d.date === txDate);
    if (targetDay) {
      let totalAmount = 0;
      if (tx.transaction_items && tx.transaction_items.length > 0) {
        totalAmount = tx.transaction_items.reduce(
          (acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_price) || 0),
          0
        );
      }
      if (tx.type === 'income') {
        targetDay.income += totalAmount;
      } else if (tx.type === 'expense') {
        targetDay.expense += totalAmount;
      }
    }
  });

  return days;
}
