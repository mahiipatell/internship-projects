const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const BudgetModel = require('../models/budget.model');
const CategoryModel = require('../models/category.model');

const WARNING_THRESHOLD = 0.9; // 90%

async function buildBudgetResponse(userId, settings) {
  const [categories, spentRows] = await Promise.all([
    BudgetModel.getCategories(settings.id),
    BudgetModel.getSpentByCategoryThisMonth(userId),
  ]);

  const spentMap = new Map(spentRows.map((r) => [r.category_id, r.spent]));

  let totalAllocated = 0;
  let totalSpent = 0;

  const allocations = categories.map((c) => {
    const spent = spentMap.get(c.category_id) || 0;
    const allocated = Number(c.allocated_amount);
    totalAllocated += allocated;
    totalSpent += spent;

    const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
    const isOverBudget = spent > allocated;

    return {
      id: c.id,
      categoryId: c.category_id,
      name: c.name,
      icon: c.icon,
      allocated,
      spent,
      remaining: allocated - spent,
      percentage,
      isOverBudget,
      isNearLimit: !isOverBudget && percentage >= WARNING_THRESHOLD * 100,
    };
  });

  const monthlyIncome = Number(settings.monthly_income);
  const savingsGoal = Number(settings.savings_goal);
  const totalExpenseThisMonth = spentRows.reduce((sum, r) => sum + r.spent, 0);
  const actualSavings = monthlyIncome - totalExpenseThisMonth;
  const savingsPercentage =
    savingsGoal > 0 ? Math.max(0, Math.round((actualSavings / savingsGoal) * 100)) : 0;

  const unallocatedAmount = monthlyIncome - totalAllocated - savingsGoal;
  const isOverAllocated = totalAllocated + savingsGoal > monthlyIncome;

  return {
    enabled: settings.enabled,
    monthlyIncome,
    savingsGoal,
    actualSavings,
    savingsPercentage,
    savingsGoalReached: savingsGoal > 0 && actualSavings >= savingsGoal,
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    unallocatedAmount,
    isOverAllocated,
    allocations,
  };
}

const getBudget = asyncHandler(async (req, res) => {
  const settings = await BudgetModel.getSettings(req.user.id);

  if (!settings || !settings.enabled) {
    return res.json({ success: true, data: { enabled: false } });
  }

  const data = await buildBudgetResponse(req.user.id, settings);
  res.json({ success: true, data });
});

const enableBudget = asyncHandler(async (req, res) => {
  const { monthlyIncome, savingsGoal } = req.body;
  const settings = await BudgetModel.enable(req.user.id, {
    monthlyIncome,
    savingsGoal: savingsGoal || 0,
  });
  const data = await buildBudgetResponse(req.user.id, settings);
  res.status(201).json({ success: true, data });
});

const updateIncome = asyncHandler(async (req, res) => {
  const { monthlyIncome, savingsGoal } = req.body;
  const settings = await BudgetModel.enable(req.user.id, {
    monthlyIncome,
    savingsGoal: savingsGoal || 0,
  });
  const data = await buildBudgetResponse(req.user.id, settings);
  res.json({ success: true, data });
});

// Finds an existing category the user can allocate against (case-insensitive),
// or creates a new custom expense category on the fly.
async function resolveAllocationCategory(userId, name, icon) {
  const trimmedName = name.trim();
  const existing = await CategoryModel.findByNameCaseInsensitive(userId, trimmedName);
  if (existing) return existing;
  return CategoryModel.create(userId, { name: trimmedName, type: 'expense', icon });
}

const addAllocation = asyncHandler(async (req, res) => {
  const { name, icon, amount } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(422, 'Allocation name is required');
  }
  if (amount === undefined || Number(amount) < 0) {
    throw new ApiError(422, 'Allocation amount must be zero or more');
  }

  const settings = await BudgetModel.getSettings(req.user.id);
  if (!settings || !settings.enabled) {
    throw new ApiError(400, 'Enable your Monthly Financial Plan before adding allocations');
  }

  const category = await resolveAllocationCategory(req.user.id, name, icon);
  await BudgetModel.addAllocation(settings.id, category.id, Number(amount));

  const data = await buildBudgetResponse(req.user.id, settings);
  res.status(201).json({ success: true, data });
});

const updateAllocation = asyncHandler(async (req, res) => {
  const { name, icon, amount } = req.body;
  const allocation = await BudgetModel.findAllocationOwnedByUser(req.params.id, req.user.id);

  if (!allocation) {
    throw new ApiError(404, 'Allocation not found');
  }

  if (amount === undefined || Number(amount) < 0) {
    throw new ApiError(422, 'Allocation amount must be zero or more');
  }

  if (name && name.trim()) {
    await CategoryModel.updateNameIcon(allocation.category_id, req.user.id, {
      name: name.trim(),
      icon,
    });
  }
  await BudgetModel.updateAllocationAmount(allocation.id, Number(amount));

  const settings = await BudgetModel.getSettings(req.user.id);
  const data = await buildBudgetResponse(req.user.id, settings);
  res.json({ success: true, data });
});

const deleteAllocation = asyncHandler(async (req, res) => {
  const allocation = await BudgetModel.findAllocationOwnedByUser(req.params.id, req.user.id);
  if (!allocation) {
    throw new ApiError(404, 'Allocation not found');
  }

  await BudgetModel.deleteAllocation(allocation.id);

  const settings = await BudgetModel.getSettings(req.user.id);
  const data = await buildBudgetResponse(req.user.id, settings);
  res.json({ success: true, data });
});

const disableBudget = asyncHandler(async (req, res) => {
  const settings = await BudgetModel.setEnabled(req.user.id, false);
  if (!settings) {
    return res.json({ success: true, message: 'Monthly Financial Plan is already disabled' });
  }
  res.json({ success: true, message: 'Monthly Financial Plan disabled' });
});

const resetBudget = asyncHandler(async (req, res) => {
  await BudgetModel.reset(req.user.id);
  res.json({ success: true, message: 'Monthly Financial Plan reset successfully' });
});

module.exports = {
  getBudget,
  enableBudget,
  updateIncome,
  addAllocation,
  updateAllocation,
  deleteAllocation,
  disableBudget,
  resetBudget,
};
