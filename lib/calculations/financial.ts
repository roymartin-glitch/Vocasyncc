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

export interface FIFOConsumptionResult {
  weightedCostPrice: number;
  totalCostConsumed: number;
  quantityConsumed: number;
  unfulfilledQuantity: number;
  batchDeductions: {
    batchId: string;
    deductedQty: number;
    newRemainingQty: number;
    status: 'active' | 'depleted';
    costPrice: number;
  }[];
}

/**
 * Mengambil batch aktif terlama (FIFO) untuk produk terkait,
 * menghitung modal rata-rata tertimbang dan daftar pengurangan sisa stok per batch.
 */
export function getFIFOCostPrice(
  productId: string,
  quantitySold: number,
  activeBatches: any[]
): FIFOConsumptionResult {
  const productBatches = (activeBatches || [])
    .filter((b) => b.product_id === productId && b.status === 'active' && Number(b.remaining_quantity) > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let neededQty = quantitySold;
  let totalCost = 0;
  let consumedQty = 0;
  const deductions: FIFOConsumptionResult['batchDeductions'] = [];

  for (const batch of productBatches) {
    if (neededQty <= 0) break;
    const remaining = Number(batch.remaining_quantity);
    const takeQty = Math.min(neededQty, remaining);
    const newRemaining = remaining - takeQty;
    const cost = Number(batch.cost_price);

    totalCost += takeQty * cost;
    consumedQty += takeQty;
    neededQty -= takeQty;

    deductions.push({
      batchId: batch.id,
      deductedQty: takeQty,
      newRemainingQty: Math.max(0, Math.round(newRemaining * 100) / 100),
      status: newRemaining <= 0 ? 'depleted' : 'active',
      costPrice: cost,
    });
  }

  const unfulfilledQty = Math.max(0, neededQty);
  let finalWeightedCost = consumedQty > 0 ? Math.round((totalCost / consumedQty) * 100) / 100 : 0;

  // Jika stok batch kurang dari jumlah jual, pro-rate sisa dengan harga batch terakhir
  if (unfulfilledQty > 0 && productBatches.length > 0) {
    const lastCost = Number(productBatches[productBatches.length - 1].cost_price);
    totalCost += unfulfilledQty * lastCost;
    finalWeightedCost = Math.round((totalCost / quantitySold) * 100) / 100;
  }

  return {
    weightedCostPrice: finalWeightedCost,
    totalCostConsumed: totalCost,
    quantityConsumed: consumedQty,
    unfulfilledQuantity: unfulfilledQty,
    batchDeductions: deductions,
  };
}

/**
 * Menghitung total sisa stok dari semua batch aktif untuk produk tertentu.
 */
export function calculateStockRemaining(productId: string, batches: any[]): number {
  return (batches || [])
    .filter((b) => b.product_id === productId && b.status === 'active')
    .reduce((sum, b) => sum + Number(b.remaining_quantity || 0), 0);
}

/**
 * Menentukan apakah sisa stok berada di bawah ambang batas (default 20%).
 */
export function isStockLow(
  remainingQty: number,
  initialOrReferenceQty: number,
  thresholdPercent: number = 20
): boolean {
  if (remainingQty <= 0) return true;
  if (!initialOrReferenceQty || initialOrReferenceQty <= 0) {
    return remainingQty <= 5;
  }
  const percentage = (remainingQty / initialOrReferenceQty) * 100;
  return percentage <= thresholdPercent;
}

/**
 * Normalisasi nama produk untuk perbandingan ramah pedagang pasar
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(cabe|cabee)\b/g, 'cabai')
    .replace(/\b(bwg|bwang)\b/g, 'bawang')
    .replace(/\b(klo|kilo|kilogram)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menghitung skor kemiripan antara dua nama produk (0.0 sampai 1.0)
 * Menggunakan kombinasi token overlap (Jaccard) dan Levenshtein distance
 */
export function calculateProductSimilarity(nameA: string, nameB: string): number {
  const normA = normalizeProductName(nameA);
  const normB = normalizeProductName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Substring inclusion check (misal "bawang merah" di dalam "bawang merah brebes")
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    const substringScore = minLen / maxLen;
    return Math.max(0.75, substringScore);
  }

  // Token Jaccard similarity
  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);
  const setB = new Set(tokensB);

  const intersection = tokensA.filter((t) => setB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  const jaccard = union.size > 0 ? intersection.length / union.size : 0;

  if (jaccard >= 0.5) {
    return jaccard;
  }

  // Levenshtein distance untuk typo
  const m = normA.length;
  const n = normB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normA[i - 1] === normB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const levDistance = dp[m][n];
  const maxLen = Math.max(m, n);
  const levSimilarity = maxLen > 0 ? (maxLen - levDistance) / maxLen : 0;

  return Math.max(jaccard, levSimilarity);
}

export interface SimilarProductResult {
  isExact: boolean;
  isSimilar: boolean;
  matchedProduct?: { id: string; name: string };
  similarityScore: number;
}

/**
 * Mencari apakah nama produk yang diucapkan memiliki padanan persis atau mirip
 * di daftar produk yang sudah dimiliki pedagang.
 */
export function findSimilarProduct(
  candidateName: string,
  existingProducts: Array<{ id: string; name: string }>
): SimilarProductResult {
  const normCandidate = normalizeProductName(candidateName);
  if (!normCandidate || !existingProducts || existingProducts.length === 0) {
    return { isExact: false, isSimilar: false, similarityScore: 0 };
  }

  // 1. Cek Exact Match (Persis sama setelah normalisasi)
  for (const prod of existingProducts) {
    if (normalizeProductName(prod.name) === normCandidate) {
      return {
        isExact: true,
        isSimilar: false,
        matchedProduct: prod,
        similarityScore: 1.0,
      };
    }
  }

  // 2. Cek Kemiripan Tertinggi (Fuzzy / Substring / Token overlap)
  let bestMatch: { id: string; name: string } | undefined;
  let highestScore = 0;

  for (const prod of existingProducts) {
    const score = calculateProductSimilarity(candidateName, prod.name);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = prod;
    }
  }

  // Ambang batas kemiripan ramah pedagang (>= 0.60)
  if (highestScore >= 0.60 && bestMatch) {
    return {
      isExact: false,
      isSimilar: true,
      matchedProduct: bestMatch,
      similarityScore: Math.round(highestScore * 100) / 100,
    };
  }

  return {
    isExact: false,
    isSimilar: false,
    similarityScore: Math.round(highestScore * 100) / 100,
  };
}

