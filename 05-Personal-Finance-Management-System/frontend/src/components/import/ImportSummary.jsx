import { CheckCircle2, XCircle, Ban, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji, suggestCategory } from '../../utils/importUtils';

function MiniStat({ icon: Icon, label, value, tone }) {
  const TONES = {
    income: 'text-income bg-income/10',
    expense: 'text-expense bg-expense/10',
    neutral: 'text-olive-900 bg-primary-100',
    warn: 'text-primary-600 bg-primary-100',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-olive-600/60">{label}</p>
        <p className="text-base font-bold text-olive-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function BudgetStatusBadge({ status }) {
  const MAP = {
    'on-track': { emoji: '🟢', label: 'On Track', className: 'bg-income/10 text-income' },
    'near-limit': { emoji: '🟡', label: 'Near Budget Limit', className: 'bg-primary-100 text-primary-700' },
    exceeded: { emoji: '🔴', label: 'Budget Exceeded', className: 'bg-expense/10 text-expense' },
  };
  const info = MAP[status];
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${info.className}`}>
      {info.emoji} {info.label}
    </span>
  );
}

function ImportSummary({ result, stats, budget, onGoToDashboard, onViewTransactions }) {
  const budgetStatus =
    budget?.enabled && budget.totalAllocated > 0
      ? budget.totalSpent >= budget.totalAllocated
        ? 'exceeded'
        : budget.totalSpent / budget.totalAllocated >= 0.9
        ? 'near-limit'
        : 'on-track'
      : null;

  const highestAllocation = budget?.enabled
    ? [...(budget.allocations || [])].sort((a, b) => b.spent - a.spent)[0]
    : null;

  return (
    <Card className="text-center">
      <div className="text-5xl mb-3">🎉</div>
      <h2 className="text-xl font-bold text-olive-900 mb-1">Import Complete!</h2>
      <p className="text-sm text-olive-600/70 mb-6">
        We've analyzed your transactions{budget?.enabled ? ' and updated your Monthly Financial Plan' : ''}.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left mb-6">
        <MiniStat icon={CheckCircle2} label="Total Imported" value={`${result.imported} Transactions`} tone="neutral" />
        <MiniStat icon={TrendingUp} label="Income" value={formatCurrency(stats.incomeTotal)} tone="income" />
        <MiniStat icon={TrendingDown} label="Expenses" value={formatCurrency(stats.expenseTotal)} tone="expense" />
        <MiniStat
          icon={stats.currentSavings >= 0 ? TrendingUp : TrendingDown}
          label="Current Savings"
          value={formatCurrency(stats.currentSavings)}
          tone={stats.currentSavings >= 0 ? 'income' : 'expense'}
        />
        <MiniStat icon={Ban} label="Skipped Duplicates" value={result.skippedDuplicates} tone="warn" />
        <MiniStat icon={XCircle} label="Failed Imports" value={result.failed} tone="expense" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
        {stats.topSpendingCategory && (
          <div className="rounded-xl bg-cream p-4">
            <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Top Spending Category</p>
            <p className="text-base font-bold text-olive-900 mt-1">
              {getCategoryEmoji(stats.topSpendingCategory)} {stats.topSpendingCategory}
            </p>
          </div>
        )}
        {stats.largestExpense && (
          <div className="rounded-xl bg-cream p-4">
            <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Largest Expense</p>
            <p className="text-base font-bold text-olive-900 mt-1">
              {getCategoryEmoji(stats.largestExpense.categoryName)} {stats.largestExpense.title} –{' '}
              {formatCurrency(stats.largestExpense.amount)}
            </p>
          </div>
        )}
        {stats.mostFrequentMerchant && (
          <div className="rounded-xl bg-cream p-4">
            <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Most Frequent Merchant</p>
            <p className="text-base font-bold text-olive-900 mt-1">
              {getCategoryEmoji(suggestCategory(stats.mostFrequentMerchant))} {stats.mostFrequentMerchant}
            </p>
          </div>
        )}
        {stats.averageDailySpend > 0 && (
          <div className="rounded-xl bg-cream p-4">
            <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Average Daily Spend</p>
            <p className="text-base font-bold text-olive-900 mt-1">{formatCurrency(stats.averageDailySpend)}</p>
          </div>
        )}
        <div className="rounded-xl bg-cream p-4">
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">This Month's Savings Rate</p>
          <p className="text-base font-bold text-olive-900 mt-1">{stats.savingsRate}%</p>
        </div>
        {budgetStatus && (
          <div className="rounded-xl bg-cream p-4 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Budget Status</p>
            <BudgetStatusBadge status={budgetStatus} />
          </div>
        )}
      </div>

      {budget?.enabled && (
        <div className="rounded-2xl border border-olive-900/10 p-5 text-left mb-6">
          <h3 className="font-semibold text-olive-900 mb-3">Monthly Financial Plan Update</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-olive-600/70">Budget Utilization</span>
                <span className="font-semibold text-olive-900">
                  {Math.round((budget.totalSpent / (budget.totalAllocated || 1)) * 100)}%
                </span>
              </div>
              <ProgressBar
                percentage={Math.round((budget.totalSpent / (budget.totalAllocated || 1)) * 100)}
                isOverBudget={budget.totalSpent > budget.totalAllocated}
              />
            </div>
            {highestAllocation && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-olive-600/70">Highest Spending Allocation</span>
                <span className="font-semibold text-olive-900">
                  {getCategoryEmoji(highestAllocation.name, highestAllocation.icon)} {highestAllocation.name} —{' '}
                  {formatCurrency(highestAllocation.spent)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-olive-600/70">Remaining Planned Budget</span>
              <span
                className={`font-semibold ${budget.totalRemaining < 0 ? 'text-expense' : 'text-income'}`}
              >
                {formatCurrency(budget.totalRemaining)}
              </span>
            </div>
            {budget.savingsGoal > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-olive-600/70">Current Savings Goal Progress</span>
                  <span className="font-semibold text-olive-900">
                    {formatCurrency(budget.actualSavings)} / {formatCurrency(budget.savingsGoal)} (
                    {Math.min(budget.savingsPercentage, 100)}%)
                  </span>
                </div>
                <ProgressBar percentage={budget.savingsPercentage} isOverBudget={false} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button
          onClick={onViewTransactions}
          className="text-sm font-medium text-olive-700 hover:text-olive-900 underline underline-offset-2"
        >
          View Transactions
        </button>
        <button
          onClick={onGoToDashboard}
          className="rounded-2xl px-5 py-2.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-olive-900 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    </Card>
  );
}

export default ImportSummary;
