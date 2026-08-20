const { query, getClient } = require('../config/db');
const ApiError = require('../utils/ApiError');

const round2 = (n) => Math.round(n * 100) / 100;

const BILL_SELECT = `
  SELECT b.*, o.table_id, t.table_number, u.name AS cashier_name
  FROM bills b
  JOIN orders o ON o.id = b.order_id
  JOIN restaurant_tables t ON t.id = o.table_id
  LEFT JOIN users u ON u.id = b.cashier_id
`;

const attachItemsAndInvoice = async (bill) => {
  const items = await query(
    `SELECT oi.*, mi.name AS item_name
     FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1 ORDER BY oi.id ASC`,
    [bill.order_id]
  );
  const invoice = await query('SELECT * FROM invoices WHERE bill_id = $1', [bill.id]);
  return { ...bill, items: items.rows, invoice: invoice.rows[0] || null };
};

const getBillById = async (id) => {
  const result = await query(`${BILL_SELECT} WHERE b.id = $1`, [id]);
  if (!result.rows[0]) throw ApiError.notFound('Bill not found');
  return attachItemsAndInvoice(result.rows[0]);
};

const getBillByOrderId = async (orderId) => {
  const result = await query(`${BILL_SELECT} WHERE b.order_id = $1`, [orderId]);
  if (!result.rows[0]) return null;
  return attachItemsAndInvoice(result.rows[0]);
};

const listBills = async ({ status, from, to, search } = {}) => {
  const clauses = [];
  const params = [];
  if (status) {
    params.push(status);
    clauses.push(`b.payment_status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`b.created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`b.created_at::date <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(t.table_number ILIKE $${params.length} OR CAST(b.id AS TEXT) ILIKE $${params.length})`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(`${BILL_SELECT} ${where} ORDER BY b.created_at DESC`, params);
  return Promise.all(result.rows.map(attachItemsAndInvoice));
};

/**
 * Generates a bill for an order: computes subtotal from order_items,
 * applies discount and GST, and marks the order completed.
 * Runs inside a transaction so bill creation + order status update
 * are atomic.
 */
const createBill = async ({ order_id, discount_percent = 0, gst_percent = 5, payment_method, cashier_id }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const order = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [order_id]);
    if (!order.rows[0]) throw ApiError.notFound('Order not found');
    if (order.rows[0].status !== 'served') {
      throw ApiError.badRequest(
        `Only orders with status "served" can be billed (this order is "${order.rows[0].status}")`
      );
    }

    const existingBill = await client.query('SELECT id FROM bills WHERE order_id = $1', [order_id]);
    if (existingBill.rows[0]) {
      throw ApiError.conflict('This order has already been billed');
    }

    const itemsResult = await client.query(
      'SELECT quantity, unit_price FROM order_items WHERE order_id = $1',
      [order_id]
    );
    if (itemsResult.rows.length === 0) {
      throw ApiError.badRequest('Cannot bill an order with no items');
    }

    const subtotal = round2(
      itemsResult.rows.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0)
    );
    const discountAmount = round2((subtotal * Number(discount_percent)) / 100);
    const taxable = round2(subtotal - discountAmount);
    const gstAmount = round2((taxable * Number(gst_percent)) / 100);
    const grandTotal = round2(taxable + gstAmount);

    const billResult = await client.query(
      `INSERT INTO bills
        (order_id, cashier_id, subtotal, discount_percent, discount_amount, gst_percent, gst_amount, grand_total, payment_method, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       RETURNING *`,
      [order_id, cashier_id, subtotal, discount_percent, discountAmount, gst_percent, gstAmount, grandTotal, payment_method || null]
    );

    await client.query(`UPDATE orders SET status = 'completed' WHERE id = $1`, [order_id]);

    await client.query('COMMIT');
    return getBillById(billResult.rows[0].id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const recordPayment = async (billId, { payment_method, payment_status }) => {
  const result = await query(
    `UPDATE bills
     SET
       payment_method = COALESCE($1, payment_method),
       payment_status = COALESCE($2, payment_status)
     WHERE id = $3
     RETURNING *`,
    [payment_method, payment_status, billId]
  );

  if (!result.rows.length) {
    throw ApiError.notFound('Bill not found');
  }

  // Free the table after payment
  if (result.rows[0].payment_status === 'paid') {
    await query(
      `UPDATE restaurant_tables
       SET status = 'available'
       WHERE id = (
         SELECT table_id
         FROM orders
         WHERE id = $1
       )`,
      [result.rows[0].order_id]
    );
  }

  // Return fresh bill with invoice + items
  return await getBillById(billId);
};

module.exports = { listBills, getBillById, getBillByOrderId, createBill, recordPayment };
