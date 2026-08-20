import React, { useEffect, useState } from 'react';
import { billingApi, invoiceApi } from '../../api/endpoints';
import { downloadBlob } from '../../utils/downloadFile';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import StatusBadge from '../../components/common/StatusBadge';

export default function SalesHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    setLoading(true);
    billingApi.list({ search: search || undefined, status: status || undefined, from: from || undefined, to: to || undefined })
      .then(({ data }) => setBills(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load sales history'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, status, from, to]);

  const viewInvoice = async (bill) => {
    try {
      const { data } = await invoiceApi.generate(bill.id);
      const invoiceNumber = data.data.invoice_number;
      const pdfResponse = await invoiceApi.download(invoiceNumber);
      downloadBlob(pdfResponse.data, `${invoiceNumber}.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open invoice');
    }
  };

  const markAsPaid = async (bill) => {
  if (!window.confirm(`Mark Bill #${bill.id} as paid?`)) return;

  try {
    await billingApi.recordPayment(bill.id, {
      payment_status: "paid",
      payment_method: bill.payment_method,
    });

    load();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to update payment status");
  }
};

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Sales History</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search table / bill #" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" className="input max-w-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input max-w-xs" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : bills.length === 0 ? (
        <EmptyState title="No bills found" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Bill #</th><th>Table</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="font-medium">#{bill.id}</td>
                  <td>{bill.table_number}</td>
                  <td>{new Date(bill.created_at).toLocaleString()}</td>
                  <td>₹{Number(bill.grand_total).toFixed(2)}</td>
                  <td className="capitalize">{bill.payment_method || '—'}</td>
                  <td><StatusBadge status={bill.payment_status} /></td>
                  <td className="text-right">
                    <div className="flex justify-end items-center gap-2">

                      {bill.payment_status === "pending" && (
                        <button
                          onClick={() => markAsPaid(bill)}
                          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      )}

                      <button
                        className="text-primary-600 hover:underline"
                        onClick={() => viewInvoice(bill)}
                      >
                        View Invoice
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
