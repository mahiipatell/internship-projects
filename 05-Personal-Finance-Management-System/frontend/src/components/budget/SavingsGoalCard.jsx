import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

function SavingsGoalCard({ savingsGoal, actualSavings, savingsPercentage, savingsGoalReached }) {
  if (!savingsGoal) return null;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-sage-100 flex items-center justify-center text-xl">
          🎯
        </div>
        <h3 className="font-semibold text-olive-900 dark:text-gray-100">Savings Goal</h3>
      </div>

      {savingsGoalReached && (
        <div className="mb-4 rounded-xl bg-sage-100 text-sage-600 text-sm font-medium px-4 py-3 text-center">
          🎉 Congratulations! You&apos;ve reached your savings goal.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Goal</p>
          <p className="text-sm font-semibold text-olive-900 dark:text-gray-100">
            {formatCurrency(savingsGoal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Current Savings</p>
          <p className={`text-sm font-semibold ${actualSavings < 0 ? 'text-expense' : 'text-income'}`}>
            {formatCurrency(actualSavings)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Progress</p>
          <p className="text-sm font-semibold text-olive-900 dark:text-gray-100">
            {Math.min(savingsPercentage, 100)}%
          </p>
        </div>
      </div>

      <ProgressBar percentage={savingsPercentage} isOverBudget={false} />
    </Card>
  );
}

export default SavingsGoalCard;
