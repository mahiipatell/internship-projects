import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import StatCard from '../components/dashboard/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import MonthlyExpenseChart from '../components/charts/MonthlyExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TransactionForm from '../components/transactions/TransactionForm';
import transactionService from '../services/transaction.service';
import budgetService from '../services/budget.service';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../hooks/useAuth';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [recent, setRecent] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [budget, setBudget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickType, setQuickType] = useState('expense');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    transactionService.getSummary().then(setSummary);
    transactionService
      .getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' })
      .then((data) => setRecent(data.transactions));
    transactionService.getMonthlyAnalytics(6).then(setMonthly);
    transactionService.getCategoryBreakdown({ limit: 6 }).then(setBreakdown);
    budgetService.getBudget().then(setBudget);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openQuickAdd = (type) => {
    setQuickType(type);
    setModalOpen(true);
  };

  const handleAdd = async (data) => {
    setSubmitting(true);
    try {
      await transactionService.createTransaction(data);
      setModalOpen(false);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const savings = summary.balance > 0 ? summary.balance : 0;
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long' });

  const spentPercentage =
    budget?.enabled && budget.totalAllocated > 0
      ? Math.round((budget.totalSpent / budget.totalAllocated) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="bg-gradient-to-br from-primary-100 via-cream to-mint/40 border-0">
        <h1 className="text-2xl font-bold text-olive-900">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-olive-700 mt-1">{monthLabel} Financial Overview</p>
        <p className="text-sm text-olive-600/80 mt-3 max-w-lg">
          {spentPercentage !== null
            ? `You've spent ${spentPercentage}% of your planned budget. `
            : ''}
          {savings > 0
            ? `You're on track to save ${formatCurrency(savings)} this month.`
            : "Add a few transactions to see how you're tracking this month."}
        </p>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => openQuickAdd('expense')}>＋ Add Expense</Button>
        <Button variant="secondary" onClick={() => openQuickAdd('income')}>
          ＋ Add Income
        </Button>
        <Link to="/financial-plan">
          <Button variant="secondary">📅 Monthly Financial Plan</Button>
        </Link>
        <Link to="/analytics">
          <Button variant="secondary">📊 Analytics</Button>
        </Link>
        <Link to="/import">
          <Button variant="secondary">📥 Import Transactions</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Income" value={summary.income} icon={TrendingUp} tone="income" />
        <StatCard label="Total Expenses" value={summary.expense} icon={TrendingDown} tone="expense" />
        <StatCard label="Current Balance" value={summary.balance} icon={Wallet} tone="balance" />
        <StatCard label="Savings" value={savings} icon={PiggyBank} tone="savings" />
        <StatCard
          label="Monthly Plan"
          value={budget?.enabled ? formatCurrency(budget.totalAllocated) : 'Not set up'}
          emoji="📅"
          tone="plan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyExpenseChart data={monthly} />
        <CategoryPieChart data={breakdown} />
      </div>

      <RecentTransactions transactions={recent} onAddFirst={() => openQuickAdd('expense')} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={quickType === 'income' ? 'Add Income' : 'Add Expense'}
      >
        <TransactionForm
          defaultType={quickType}
          onSubmit={handleAdd}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;
