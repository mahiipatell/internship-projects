import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, Store, Repeat, Percent, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';
import MonthlyExpenseChart from '../components/charts/MonthlyExpenseChart';
import IncomeVsExpenseChart from '../components/charts/IncomeVsExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TrendChart from '../components/charts/TrendChart';
import { formatCurrency } from '../utils/formatCurrency';
import transactionService from '../services/transaction.service';

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream p-4">
      <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-olive-600/60">{label}</p>
        <p className="text-base font-bold text-olive-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function Insights() {
  const [monthly, setMonthly] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [insightsData, setInsightsData] = useState(null);

  useEffect(() => {
    transactionService.getMonthlyAnalytics(6).then(setMonthly);
    transactionService.getCategoryBreakdown({}).then(setBreakdown);
    transactionService.getCategoryBreakdown({ limit: 5 }).then(setTopCategories);
    transactionService.getInsights().then(setInsightsData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Insights</h1>
        <p className="text-sm text-olive-600/70">Understand your spending patterns.</p>
      </div>

      {insightsData?.insights?.length > 0 && (
        <Card title="What we noticed">
          <div className="space-y-3">
            {insightsData.insights.map((line, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-olive-800">
                <Lightbulb size={15} className="text-primary-600 mt-0.5 shrink-0" />
                {line}
              </div>
            ))}
          </div>
        </Card>
      )}

      {insightsData?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile icon={Wallet} label="Avg. Daily Spend" value={formatCurrency(insightsData.stats.averageDailySpend)} />
          <StatTile icon={Percent} label="Savings Rate" value={`${insightsData.stats.savingsRate}%`} />
          <StatTile
            icon={Store}
            label="Most Visited Merchant"
            value={insightsData.stats.mostVisitedMerchant || '—'}
          />
          {insightsData.stats.highestExpenseThisMonth && (
            <StatTile
              icon={TrendingUp}
              label="Highest Expense"
              value={`${insightsData.stats.highestExpenseThisMonth.title} – ${formatCurrency(insightsData.stats.highestExpenseThisMonth.amount)}`}
            />
          )}
          {insightsData.stats.biggestCategoryGrowth && (
            <StatTile
              icon={Repeat}
              label="Biggest Category Growth"
              value={insightsData.stats.biggestCategoryGrowth.category}
            />
          )}
        </div>
      )}

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

export default Insights;
