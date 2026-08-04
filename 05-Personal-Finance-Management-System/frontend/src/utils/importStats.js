/**
 * Computes the "financial snapshot" stats shown on the Import Summary step,
 * from the rows that were actually committed in this import batch.
 */
export function computeImportStats(rows) {
  const expenseRows = rows.filter((r) => r.type === 'expense');
  const incomeRows = rows.filter((r) => r.type === 'income');

  const incomeTotal = incomeRows.reduce((sum, r) => sum + r.amount, 0);
  const expenseTotal = expenseRows.reduce((sum, r) => sum + r.amount, 0);
  const currentSavings = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.round((currentSavings / incomeTotal) * 100) : 0;

  let largestExpense = null;
  expenseRows.forEach((r) => {
    if (!largestExpense || r.amount > largestExpense.amount) largestExpense = r;
  });

  const merchantFrequency = {};
  rows.forEach((r) => {
    const key = (r.title || '').trim().toLowerCase();
    if (!key) return;
    merchantFrequency[key] = (merchantFrequency[key] || 0) + 1;
  });
  let mostFrequentMerchant = null;
  let topFreq = 0;
  Object.entries(merchantFrequency).forEach(([key, count]) => {
    if (count > topFreq) {
      topFreq = count;
      mostFrequentMerchant = rows.find((r) => (r.title || '').trim().toLowerCase() === key)?.title;
    }
  });

  const categoryTotals = {};
  expenseRows.forEach((r) => {
    categoryTotals[r.categoryName] = (categoryTotals[r.categoryName] || 0) + r.amount;
  });
  let topSpendingCategory = null;
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([name, total]) => {
    if (total > topCategoryAmount) {
      topCategoryAmount = total;
      topSpendingCategory = name;
    }
  });

  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  let averageDailySpend = 0;
  if (expenseTotal > 0 && dates.length) {
    const first = new Date(dates[0]);
    const last = new Date(dates[dates.length - 1]);
    const days = Math.max(1, Math.round((last - first) / 86400000) + 1);
    averageDailySpend = expenseTotal / days;
  }

  return {
    incomeTotal,
    expenseTotal,
    currentSavings,
    savingsRate,
    largestExpense,
    mostFrequentMerchant,
    topSpendingCategory,
    averageDailySpend,
  };
}
