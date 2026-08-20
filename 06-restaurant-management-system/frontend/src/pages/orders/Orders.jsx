import React, { useEffect, useState } from 'react';
import { orderApi, tableApi, menuApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

// 'completed' is deliberately excluded — an order only becomes completed
// as a side effect of billing (see Billing page), never via a manual
// status change here, so a bill can never be skipped.
const STATUS_FLOW = ['pending', 'preparing', 'served'];

export default function Orders() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('admin', 'waiter');

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([{ menu_item_id: '', quantity: 1 }]);

  const load = () => {
    setLoading(true);
    orderApi.list(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => setOrders(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const openCreate = async () => {
    setFormError('');
    setTableId('');
    setNotes('');
    setLineItems([{ menu_item_id: '', quantity: 1 }]);
    setModalOpen(true);
    try {
      const [tRes, mRes] = await Promise.all([
        tableApi.list({ status: 'available' }),
        menuApi.list({ available: true }),
      ]);
      setTables(tRes.data.data);
      setMenuItems(mRes.data.data);
    } catch (err) {
      setFormError('Failed to load tables/menu');
    }
  };

  const addLine = () => setLineItems([...lineItems, { menu_item_id: '', quantity: 1 }]);
  const removeLine = (idx) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => {
    const copy = [...lineItems];
    copy[idx] = { ...copy[idx], [field]: value };
    setLineItems(copy);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    const items = lineItems
      .filter((li) => li.menu_item_id)
      .map((li) => ({ menu_item_id: Number(li.menu_item_id), quantity: Number(li.quantity) }));
    if (!tableId || items.length === 0) {
      setFormError('Select a table and at least one menu item');
      return;
    }
    setSaving(true);
    try {
      await orderApi.create({ table_id: Number(tableId), notes, items });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    try {
      await orderApi.updateStatus(order.id, next);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderApi.updateStatus(order.id, 'cancelled');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const orderTotal = (order) => order.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        {canCreate && <button className="btn-primary" onClick={openCreate}>+ New Order</button>}
      </div>

      <div className="mb-4">
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending', 'preparing', 'served', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id} · Table {order.table_number}</p>
                  <p className="text-xs text-gray-400">
                    Waiter: {order.waiter_name || 'N/A'} · {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <ul className="mt-3 divide-y divide-gray-100 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-1">
                    <span>{item.item_name} × {item.quantity}</span>
                    <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>₹{orderTotal(order).toFixed(2)}</span>
              </div>

              {!['completed', 'cancelled'].includes(order.status) && (
                <div className="mt-3 flex gap-3 text-sm">
                  {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                    <button className="text-primary-600 hover:underline" onClick={() => advanceStatus(order)}>
                      Mark as {STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]}
                    </button>
                  )}
                  <button className="text-red-600 hover:underline" onClick={() => cancelOrder(order)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Order" width="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className="label">Table</label>
            <select className="input" value={tableId} onChange={(e) => setTableId(e.target.value)} required>
              <option value="">Select an available table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.table_number} (seats {t.capacity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Items</label>
            <div className="space-y-2">
              {lineItems.map((li, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    className="input"
                    value={li.menu_item_id}
                    onChange={(e) => updateLine(idx, 'menu_item_id', e.target.value)}
                  >
                    <option value="">Select item</option>
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} — ₹{Number(m.price).toFixed(2)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input w-24"
                    value={li.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                  />
                  {lineItems.length > 1 && (
                    <button type="button" className="text-red-600" onClick={() => removeLine(idx)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm text-primary-600 hover:underline" onClick={addLine}>
              + Add another item
            </button>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Placing order...' : 'Place Order'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
