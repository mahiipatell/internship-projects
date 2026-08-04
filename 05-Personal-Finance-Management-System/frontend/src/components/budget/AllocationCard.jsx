import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatCurrency';

function AllocationCard({ allocation, onEdit, onDelete }) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-100 flex items-center justify-center text-xl">
            {allocation.icon || '🏷️'}
          </div>
          <h3 className="font-semibold text-olive-900 dark:text-gray-100">{allocation.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(allocation)}
            className="p-1.5 rounded-lg hover:bg-cream text-olive-600"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(allocation)}
            className="p-1.5 rounded-lg hover:bg-expense/10 text-expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Budget</p>
          <p className="text-sm font-semibold text-olive-900 dark:text-gray-100">
            {formatCurrency(allocation.allocated)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Spent</p>
          <p className="text-sm font-semibold text-expense">{formatCurrency(allocation.spent)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Remaining</p>
          <p
            className={`text-sm font-semibold ${
              allocation.remaining < 0 ? 'text-expense' : 'text-income'
            }`}
          >
            {formatCurrency(allocation.remaining)}
          </p>
        </div>
      </div>

      <ProgressBar percentage={allocation.percentage} isOverBudget={allocation.isOverBudget} />

      {(allocation.isOverBudget || allocation.isNearLimit) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <AlertTriangle size={12} className={allocation.isOverBudget ? 'text-expense' : 'text-primary-600'} />
          <span className={allocation.isOverBudget ? 'text-expense' : 'text-primary-600'}>
            {allocation.isOverBudget
              ? `Over by ${formatCurrency(allocation.spent - allocation.allocated)}`
              : 'Approaching limit'}
          </span>
        </div>
      )}
    </Card>
  );
}

export default AllocationCard;
