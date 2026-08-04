import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function RecentTransactions({ transactions, onAddFirst }) {
  return (
    <Card
      title="Recent Transactions"
      action={
        transactions.length > 0 && (
          <Link to="/transactions" className="text-sm text-primary-600 font-medium hover:underline">
            View all
          </Link>
        )
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="Welcome!"
          description="Let's start tracking your finances. Add your first income or expense to begin."
          action={
            onAddFirst && (
              <Button onClick={onAddFirst}>+ Add Your First Transaction</Button>
            )
          }
        />
      ) : (
        <div className="divide-y divide-olive-900/5 dark:divide-gray-800">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-olive-900 dark:text-gray-100">{t.title}</p>
                <p className="text-xs text-olive-600/60">
                  {t.category_name} • {formatDate(t.date)}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default RecentTransactions;
