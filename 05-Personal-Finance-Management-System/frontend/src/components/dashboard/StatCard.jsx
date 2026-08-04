import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

const COLOR_MAP = {
  income: 'text-income bg-income/10',
  expense: 'text-expense bg-expense/10',
  balance: 'text-olive-900 bg-primary-100',
  savings: 'text-sage-600 bg-sage-100',
  plan: 'text-primary-600 bg-primary-100',
};

function StatCard({ label, value, icon: Icon, emoji, tone = 'balance', suffix }) {
  return (
    <Card hover className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${COLOR_MAP[tone]}`}>
        {Icon ? <Icon size={20} /> : emoji}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-olive-600/70 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-olive-900 dark:text-gray-100 truncate">
          {typeof value === 'number' ? formatCurrency(value) : value}
          {suffix && <span className="text-sm font-medium text-olive-600/60 ml-1">{suffix}</span>}
        </p>
      </div>
    </Card>
  );
}

export default StatCard;
