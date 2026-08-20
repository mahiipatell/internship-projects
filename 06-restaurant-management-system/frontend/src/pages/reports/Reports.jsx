import React, { useEffect, useState } from 'react';
import { reportApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBanner from '../../components/common/ErrorBanner';
import EmptyState from '../../components/common/EmptyState';

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sales, setSales] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = { from: from || undefined, to: to || undefined };
    Promise.all([
      reportApi.sales({ ...params, period }),
      reportApi.bestSellers(params),
      reportApi.revenue(params),
    ])
      .then(([salesRes, bestRes, revRes]) => {
        setSales(salesRes.data.data);
        setBestSellers(bestRes.data.data);
        setRevenue(revRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [period, from, to]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Reports</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Period</label>
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {revenue && (
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="card"><p className="text-sm text-gray-500">Total Revenue</p><p className="mt-1 text-xl font-bold text-primary-600">₹{revenue.revenue.toFixed(2)}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Total Tax (GST)</p><p className="mt-1 text-xl font-bold">₹{revenue.tax.toFixed(2)}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Total Discounts</p><p className="mt-1 text-xl font-bold">₹{revenue.discounts.toFixed(2)}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Bills Generated</p><p className="mt-1 text-xl font-bold">{revenue.bills}</p></div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Sales Over Time ({period})</h2>
              {sales.length === 0 ? <EmptyState title="No sales data" /> : (
                <table className="table-base">
                  <thead><tr><th>Period</th><th>Bills</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {sales.map((s, idx) => (
                      <tr key={idx}>
                        <td>{new Date(s.period).toLocaleDateString()}</td>
                        <td>{s.billCount}</td>
                        <td>₹{s.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Best Selling Items</h2>
              {bestSellers.length === 0 ? <EmptyState title="No sales data" /> : (
                <table className="table-base">
                  <thead><tr><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {bestSellers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantitySold}</td>
                        <td>₹{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
