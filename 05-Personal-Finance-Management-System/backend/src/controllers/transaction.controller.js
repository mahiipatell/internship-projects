const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const TransactionModel = require('../models/transaction.model');
const CategoryModel = require('../models/category.model');

async function assertCategoryOwnedOrDefault(categoryId, userId) {
  const category = await CategoryModel.findById(categoryId);
  if (!category || (category.user_id !== null && category.user_id !== userId)) {
    throw new ApiError(422, 'Invalid category selected');
  }
  return category;
}

const listTransactions = asyncHandler(async (req, res) => {
  const {
    search,
    type,
    categoryId,
    from,
    to,
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
  } = req.query;

  const { transactions, total } = await TransactionModel.list({
    userId: req.user.id,
    search,
    type,
    categoryId,
    from,
    to,
    sortBy,
    sortOrder,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      },
    },
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await TransactionModel.findById(req.params.id, req.user.id);
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  res.json({ success: true, data: { transaction } });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { title, amount, type, categoryId, date, notes, accountId } = req.body;
  await assertCategoryOwnedOrDefault(categoryId, req.user.id);

  const transaction = await TransactionModel.create(req.user.id, {
    title,
    amount,
    type,
    categoryId,
    date,
    notes,
    accountId,
  });

  res.status(201).json({ success: true, data: { transaction } });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { title, amount, type, categoryId, date, notes, accountId } = req.body;
  await assertCategoryOwnedOrDefault(categoryId, req.user.id);

  const transaction = await TransactionModel.update(req.params.id, req.user.id, {
    title,
    amount,
    type,
    categoryId,
    date,
    notes,
    accountId,
  });

  if (!transaction) throw new ApiError(404, 'Transaction not found');
  res.json({ success: true, data: { transaction } });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const deleted = await TransactionModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new ApiError(404, 'Transaction not found');
  res.json({ success: true, message: 'Transaction deleted' });
});

const getSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const summary = await TransactionModel.getSummary(req.user.id, { from, to });
  res.json({ success: true, data: summary });
});

const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const months = Number(req.query.months) || 6;
  const rows = await TransactionModel.getMonthlyBreakdown(req.user.id, months);

  // Reshape [{month, type, total}] into [{month, income, expense}]
  const map = new Map();
  rows.forEach(({ month, type, total }) => {
    if (!map.has(month)) map.set(month, { month, income: 0, expense: 0 });
    map.get(month)[type] = total;
  });

  res.json({ success: true, data: { monthly: Array.from(map.values()) } });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { from, to, type, limit } = req.query;
  const breakdown = await TransactionModel.getCategoryBreakdown(req.user.id, {
    from,
    to,
    type: type || 'expense',
    limit,
  });
  res.json({ success: true, data: { breakdown } });
});

function monthRange(date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

// Calculated, non-AI observations for the Insights page — plain
// comparisons and aggregates derived from existing queries.
const getInsights = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentRange = monthRange(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevRange = monthRange(prevMonthDate);

  const [
    currentSummary,
    prevSummary,
    currentCategoryBreakdown,
    prevCategoryBreakdown,
    topMerchant,
    highestExpense,
  ] = await Promise.all([
    TransactionModel.getSummary(req.user.id, currentRange),
    TransactionModel.getSummary(req.user.id, prevRange),
    TransactionModel.getCategoryBreakdown(req.user.id, { ...currentRange, type: 'expense' }),
    TransactionModel.getCategoryBreakdown(req.user.id, { ...prevRange, type: 'expense' }),
    TransactionModel.getTopMerchant(req.user.id, currentRange),
    TransactionModel.getHighestExpense(req.user.id, currentRange),
  ]);

  const prevCategoryMap = new Map(prevCategoryBreakdown.map((c) => [c.category, c.total]));
  const categoryDeltas = currentCategoryBreakdown
    .map((c) => {
      const prevTotal = prevCategoryMap.get(c.category) || 0;
      const change = c.total - prevTotal;
      const percentChange = prevTotal > 0 ? Math.round((change / prevTotal) * 100) : null;
      return { category: c.category, total: c.total, prevTotal, change, percentChange };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const insights = [];
  categoryDeltas.slice(0, 3).forEach((c) => {
    if (Math.abs(c.change) < 1) return;
    if (c.change > 0) {
      insights.push(
        c.percentChange !== null
          ? `${c.category} spending increased by ${c.percentChange}%.`
          : `${c.category} spending increased by ₹${Math.round(c.change)}.`
      );
    } else {
      insights.push(`${c.category} spending decreased by ₹${Math.round(Math.abs(c.change))}.`);
    }
  });

  if (highestExpense) {
    insights.push(`Your highest expense this month was ${highestExpense.title}.`);
  }
  if (topMerchant) {
    insights.push(`You visited ${topMerchant.title} most often this month (${topMerchant.visits} times).`);
  }

  const daysElapsed = now.getDate();
  const averageDailySpend = currentSummary.expense / Math.max(1, daysElapsed);
  const savingsRate =
    currentSummary.income > 0
      ? Math.round(((currentSummary.income - currentSummary.expense) / currentSummary.income) * 100)
      : 0;

  const biggestCategoryGrowth = categoryDeltas.find((c) => c.change > 0) || null;

  res.json({
    success: true,
    data: {
      insights,
      stats: {
        averageDailySpend,
        savingsRate,
        mostVisitedMerchant: topMerchant ? topMerchant.title : null,
        highestExpenseThisMonth: highestExpense || null,
        biggestCategoryGrowth,
        categoryDeltas,
      },
    },
  });
});

// CSV Import — commits a batch of already-reviewed rows from the Import
// Center wizard. Each row's category is resolved by name (creating a new
// custom category on the fly if it doesn't exist yet, same pattern as
// Monthly Financial Plan allocations), so the client never has to look up
// category IDs itself before importing.
const bulkImportTransactions = asyncHandler(async (req, res) => {
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new ApiError(422, 'No transactions to import');
  }

  let imported = 0;
  let failed = 0;
  let incomeTotal = 0;
  let expenseTotal = 0;
  const errors = [];

  for (const row of transactions) {
    try {
      const { title, amount, type, categoryName, date, notes } = row;

      if (!title || !amount || !type || !categoryName || !date) {
        throw new Error('Missing required fields');
      }
      if (!['income', 'expense'].includes(type)) {
        throw new Error('Invalid transaction type');
      }

      const category = await CategoryModel.findOrCreate(req.user.id, categoryName, type);
      const created = await TransactionModel.create(req.user.id, {
        title,
        amount: Number(amount),
        type,
        categoryId: category.id,
        date,
        notes,
      });

      imported += 1;
      if (created.type === 'income') incomeTotal += Number(created.amount);
      else expenseTotal += Number(created.amount);
    } catch (err) {
      failed += 1;
      errors.push({ row: row.title || 'Untitled', reason: err.message });
    }
  }

  res.status(201).json({
    success: true,
    data: {
      total: transactions.length,
      imported,
      failed,
      incomeTotal,
      expenseTotal,
      errors,
    },
  });
});

// Duplicate-check helper used by the Import Center preview step. Given a
// small batch of candidate rows, reports which ones already exist.
const checkDuplicates = asyncHandler(async (req, res) => {
  const { transactions } = req.body;

  if (!Array.isArray(transactions)) {
    throw new ApiError(422, 'transactions must be an array');
  }

  const results = await Promise.all(
    transactions.map(async (row, index) => ({
      index,
      isDuplicate: row.title && row.amount && row.date
        ? await TransactionModel.existsSimilar(req.user.id, {
            title: row.title,
            amount: row.amount,
            date: row.date,
          })
        : false,
    }))
  );

  res.json({ success: true, data: { results } });
});

module.exports = {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyAnalytics,
  getCategoryBreakdown,
  bulkImportTransactions,
  checkDuplicates,
  getInsights,
};
