const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const RecurringModel = require('../models/recurring.model');
const TransactionModel = require('../models/transaction.model');

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
// Safety cap so a rule that's been inactive/unprocessed for a long time
// can't generate an unbounded backlog of transactions in one request.
const MAX_CATCHUP_RUNS = 60;

function nextDate(dateStr, frequency) {
  const d = new Date(dateStr);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

const getRecurring = asyncHandler(async (req, res) => {
  const rules = await RecurringModel.list(req.user.id);
  res.json({ success: true, data: { rules } });
});

const createRecurring = asyncHandler(async (req, res) => {
  const { categoryId, accountId, title, amount, type, frequency, startDate, notes } = req.body;

  if (!title || !title.trim() || !amount || Number(amount) <= 0) {
    throw new ApiError(422, 'A title and a positive amount are required');
  }
  if (!['income', 'expense'].includes(type)) {
    throw new ApiError(422, 'Type must be income or expense');
  }
  if (!FREQUENCIES.includes(frequency)) {
    throw new ApiError(422, 'Frequency must be daily, weekly, monthly, or yearly');
  }
  if (!categoryId || !startDate) {
    throw new ApiError(422, 'A category and start date are required');
  }

  const rule = await RecurringModel.create(req.user.id, {
    categoryId,
    accountId,
    title: title.trim(),
    amount: Number(amount),
    type,
    frequency,
    startDate,
    notes,
  });
  res.status(201).json({ success: true, data: { rule } });
});

const updateRecurring = asyncHandler(async (req, res) => {
  const { categoryId, accountId, title, amount, type, frequency, isActive, notes } = req.body;

  const rule = await RecurringModel.update(req.params.id, req.user.id, {
    categoryId,
    accountId,
    title: title?.trim(),
    amount: Number(amount),
    type,
    frequency,
    isActive: isActive !== undefined ? isActive : true,
    notes,
  });
  if (!rule) throw new ApiError(404, 'Recurring transaction not found');
  res.json({ success: true, data: { rule } });
});

const deleteRecurring = asyncHandler(async (req, res) => {
  const deleted = await RecurringModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new ApiError(404, 'Recurring transaction not found');
  res.json({ success: true, message: 'Recurring transaction deleted' });
});

// There's no background job runner in this app, so recurring rules are
// caught up opportunistically — called once when the app loads (see
// frontend AuthContext) and creates any transactions that are due,
// walking each rule's next_run_date forward until it's in the future.
const processRecurring = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const dueRules = await RecurringModel.findDue(req.user.id, today);

  let created = 0;

  for (const rule of dueRules) {
    let runDate = rule.next_run_date;
    let runs = 0;

    while (runDate <= today && runs < MAX_CATCHUP_RUNS) {
      await TransactionModel.create(req.user.id, {
        title: rule.title,
        amount: Number(rule.amount),
        type: rule.type,
        categoryId: rule.category_id,
        date: runDate,
        notes: rule.notes ? `${rule.notes} (recurring)` : 'Recurring transaction',
      });
      created += 1;
      runs += 1;
      const previousRunDate = runDate;
      runDate = nextDate(runDate, rule.frequency);
      await RecurringModel.advance(rule.id, { lastRunDate: previousRunDate, nextRunDate: runDate });
    }
  }

  res.json({ success: true, data: { created } });
});

module.exports = {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  processRecurring,
};
