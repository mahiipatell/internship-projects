import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function TransactionList({ transactions, pagination, onPageChange, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        emoji="🔍"
        title="No transactions found"
        description="Try adjusting your search or filters, or add a new transaction."
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-600/70 border-b border-olive-900/5 dark:border-gray-800">
              <th className="py-3 font-medium">Title</th>
              <th className="py-3 font-medium">Category</th>
              <th className="py-3 font-medium">Date</th>
              <th className="py-3 font-medium text-right">Amount</th>
              <th className="py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="py-3 font-medium text-olive-900 dark:text-gray-100">{t.title}</td>
                <td className="py-3 text-olive-600/70">{t.category_name}</td>
                <td className="py-3 text-olive-600/70">{formatDate(t.date)}</td>
                <td
                  className={`py-3 text-right font-semibold ${
                    t.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-cream dark:hover:bg-gray-800 text-olive-600/70"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="p-1.5 rounded-lg hover:bg-expense/10 text-expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-olive-600/50">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionList;
