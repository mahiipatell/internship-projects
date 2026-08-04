import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import MonthlyExpenseChart from '../components/charts/MonthlyExpenseChart';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TrendChart from '../components/charts/TrendChart';
import { formatCurrency } from '../utils/formatCurrency';
import transactionService from '../services/transaction.service';

function Analytics() {
  const [monthly, setMonthly] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    transactionService.getMonthlyAnalytics(6).then(setMonthly);
    transactionService.getCategoryBreakdown({}).then(setBreakdown);
    transactionService.getCategoryBreakdown({ limit: 5 }).then(setTopCategories);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-olive-600/70">Understand your spending patterns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyExpenseChart data={monthly} />
        <IncomeVsExpenseChart data={monthly} />
        <CategoryPieChart data={breakdown} title="Category Distribution" />
        <TrendChart data={monthly} />
      </div>

      <Card title="Top Spending Categories">
        {topCategories.length === 0 ? (
          <p className="text-sm text-olive-600/50 py-6 text-center">No expense data yet.</p>
        ) : (
          <div className="space-y-3">
            {topCategories.map((c, i) => (
              <div key={c.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-olive-700 dark:text-gray-200">
                    {c.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-expense">
                  {formatCurrency(c.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Analytics;
