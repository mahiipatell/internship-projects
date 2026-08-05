const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const SavingsGoalModel = require('../models/savingsGoal.model');

// Rough, honest estimate: projects completion from the average daily
// contribution rate since the goal was created. Returns null (shown as
// "Not enough data yet" in the UI) until there's at least some progress.
function estimateCompletion(goal) {
  const current = Number(goal.current_amount);
  const target = Number(goal.target_amount);
  if (current <= 0 || current >= target) return null;

  const daysSinceCreated = Math.max(
    1,
    Math.round((Date.now() - new Date(goal.created_at).getTime()) / 86400000)
  );
  const dailyRate = current / daysSinceCreated;
  if (dailyRate <= 0) return null;

  const daysRemaining = Math.ceil((target - current) / dailyRate);
  const estimate = new Date();
  estimate.setDate(estimate.getDate() + daysRemaining);
  return estimate.toISOString().split('T')[0];
}

function serialize(goal) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  return {
    id: goal.id,
    name: goal.name,
    icon: goal.icon,
    target,
    current,
    progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    targetDate: goal.target_date,
    estimatedCompletionDate: estimateCompletion(goal),
    isComplete: current >= target,
  };
}

const getGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoalModel.list(req.user.id);
  res.json({ success: true, data: { goals: goals.map(serialize) } });
});

const createGoal = asyncHandler(async (req, res) => {
  const { name, icon, targetAmount, targetDate } = req.body;
  if (!name || !name.trim() || !targetAmount || Number(targetAmount) <= 0) {
    throw new ApiError(422, 'A goal name and a positive target amount are required');
  }
  const goal = await SavingsGoalModel.create(req.user.id, {
    name: name.trim(),
    icon,
    targetAmount: Number(targetAmount),
    targetDate,
  });
  res.status(201).json({ success: true, data: { goal: serialize(goal) } });
});

const updateGoal = asyncHandler(async (req, res) => {
  const { name, icon, targetAmount, targetDate } = req.body;
  if (!name || !name.trim() || !targetAmount || Number(targetAmount) <= 0) {
    throw new ApiError(422, 'A goal name and a positive target amount are required');
  }
  const goal = await SavingsGoalModel.update(req.params.id, req.user.id, {
    name: name.trim(),
    icon,
    targetAmount: Number(targetAmount),
    targetDate,
  });
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  res.json({ success: true, data: { goal: serialize(goal) } });
});

const contribute = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    throw new ApiError(422, 'Contribution amount must be greater than 0');
  }
  const goal = await SavingsGoalModel.addContribution(req.params.id, req.user.id, Number(amount));
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  res.json({ success: true, data: { goal: serialize(goal) } });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const deleted = await SavingsGoalModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new ApiError(404, 'Savings goal not found');
  res.json({ success: true, message: 'Savings goal deleted' });
});

module.exports = { getGoals, createGoal, updateGoal, contribute, deleteGoal };
