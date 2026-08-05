import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sage-100 flex items-center justify-center text-xl">
            {goal.icon || '🎯'}
          </div>
          <div>
            <h3 className="font-semibold text-olive-900 dark:text-gray-100">{goal.name}</h3>
            {goal.isComplete && <span className="text-xs text-income font-medium">🎉 Goal reached!</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-cream text-olive-600">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(goal)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Target</p>
          <p className="text-sm font-semibold text-olive-900 dark:text-gray-100">
            {formatCurrency(goal.target)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Current</p>
          <p className="text-sm font-semibold text-income">{formatCurrency(goal.current)}</p>
        </div>
      </div>

      <ProgressBar percentage={goal.progress} isOverBudget={false} />

      <div className="flex items-center justify-between mt-2 text-xs text-olive-600/60">
        <span>{goal.progress}% complete</span>
        <span>
          {goal.estimatedCompletionDate
            ? `Est. ${formatDate(goal.estimatedCompletionDate)}`
            : 'Not enough data yet'}
        </span>
      </div>

      <button
        onClick={() => onContribute(goal)}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-xl py-2 transition-colors"
      >
        <PlusCircle size={15} /> Add Contribution
      </button>
    </Card>
  );
}

export default GoalCard;
