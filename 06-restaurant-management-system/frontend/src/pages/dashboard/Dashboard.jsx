import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBanner from '../../components/common/ErrorBanner';

function StatCard({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    dashboardApi
      .summary()
      .then(({ data }) => mounted && setSummary(data.data))
      .catch((err) => mounted && setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorBanner message={error} />;
  if (!summary) return null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={`₹${summary.todayRevenue.toFixed(2)}`} accent="text-primary-600" />
        <StatCard label="Today's Orders" value={summary.todayOrders.total} />
        <StatCard label="Available Tables" value={summary.tables.available} accent="text-green-600" />
        <StatCard label="Occupied Tables" value={summary.tables.occupied} accent="text-red-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Order Status Breakdown</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Pending</span><span className="font-medium">{summary.todayOrders.pending}</span></li>
            <li className="flex justify-between"><span>Preparing</span><span className="font-medium">{summary.todayOrders.preparing}</span></li>
            <li className="flex justify-between"><span>Served</span><span className="font-medium">{summary.todayOrders.served}</span></li>
            <li className="flex justify-between"><span>Completed</span><span className="font-medium">{summary.todayOrders.completed}</span></li>
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Top Selling Items Today</h2>
          {summary.topSellingItems.length === 0 ? (
            <p className="text-sm text-gray-400">No sales yet today.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.topSellingItems.map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.quantity} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
