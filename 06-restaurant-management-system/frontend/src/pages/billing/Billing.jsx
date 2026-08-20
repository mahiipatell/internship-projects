import React, { useEffect, useState } from 'react';
import { orderApi, billingApi, invoiceApi } from '../../api/endpoints';
import { downloadBlob } from '../../utils/downloadFile';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

export default function Billing() {
  const [servedOrders, setServedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [bills, setBills] = useState([]);

  const load = async () => {
    setLoading(true);

    try {
        const [ordersRes, billsRes] = await Promise.all([
            orderApi.list({ status: "served" }),
            billingApi.list()
        ]);

        setServedOrders(ordersRes.data.data);
        setBills(billsRes.data.data);
    } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
  load();
}, []);



  const openBillModal = (order) => {
    setSelectedOrder(order);
    setDiscountPercent(0);
    setGstPercent(5);
    setPaymentMethod('cash');
    setFormError('');
    setGeneratedBill(null);
    setModalOpen(true);
  };

  const subtotal = selectedOrder
    ? selectedOrder.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0)
    : 0;
  const discountAmount = (subtotal * Number(discountPercent || 0)) / 100;
  const taxable = subtotal - discountAmount;
  const gstAmount = (taxable * Number(gstPercent || 0)) / 100;
  const grandTotal = taxable + gstAmount;

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const { data } = await billingApi.create({
        order_id: selectedOrder.id,
        discount_percent: Number(discountPercent) || 0,
        gst_percent: Number(gstPercent) || 0,
        payment_method: paymentMethod,
      });
      setGeneratedBill(data.data);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

const markPaid = async () => {
  try {
    const { data } = await billingApi.recordPayment(generatedBill.id, {
      payment_status: 'paid',
      payment_method: generatedBill.payment_method || paymentMethod
    });

    setGeneratedBill(data.data);

    // Refresh orders after payment
    load();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to record payment');
  }
};

  const downloadInvoice = async () => {
    try {
      const { data } = await invoiceApi.generate(generatedBill.id);
      const invoiceNumber = data.data.invoice_number;
      const pdfResponse = await invoiceApi.download(invoiceNumber);
      downloadBlob(pdfResponse.data, `${invoiceNumber}.pdf`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate or download invoice');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Billing</h1>
      <p className="mb-4 text-sm text-gray-500">Orders marked as "served" are ready to be billed.</p>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : servedOrders.length === 0 ? (
        <EmptyState title="No orders awaiting billing" description="Orders will appear here once marked as served." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servedOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Order #{order.id} · Table {order.table_number}</p>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-2 text-sm text-gray-500">{order.items.length} item(s)</p>
              <button className="btn-primary mt-3 w-full" onClick={() => openBillModal(order)}>Generate Bill</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Bill for Order #${selectedOrder?.id}`}>
        {!generatedBill ? (
          <form onSubmit={handleGenerateBill} className="space-y-4">
            <ErrorBanner message={formError} />
            <ul className="divide-y divide-gray-100 text-sm">
              {selectedOrder?.items.map((item) => (
                <li key={item.id} className="flex justify-between py-1">
                  <span>{item.item_name} × {item.quantity}</span>
                  <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Discount %</label>
                <input type="number" min="0" max="100" className="input" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
              </div>
              <div>
                <label className="label">GST %</label>
                <input type="number" min="0" max="100" className="input" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-₹{discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>₹{gstAmount.toFixed(2)}</span></div>
              <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Generating...' : 'Generate Bill'}</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Bill #{generatedBill.id} generated · Grand Total ₹{Number(generatedBill.grand_total).toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Payment Status</span>
              <StatusBadge status={generatedBill.payment_status} />
            </div>
            <div className="flex justify-end gap-2">
              {generatedBill.payment_status !== 'paid' && (
                <button className="btn-secondary" onClick={markPaid}>Mark as Paid</button>
              )}
              <button className="btn-primary" onClick={downloadInvoice}>Download Invoice PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
