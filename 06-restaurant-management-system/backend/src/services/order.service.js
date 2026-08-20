const { query, getClient } = require('../config/db');
const ApiError = require('../utils/ApiError');

const ORDER_SELECT = `
  SELECT o.*, t.table_number, u.name AS waiter_name
  FROM orders o
  JOIN restaurant_tables t ON t.id = o.table_id
  LEFT JOIN users u ON u.id = o.waiter_id
`;

const attachItems = async (order) => {
  const items = await query(
    `SELECT oi.*, mi.name AS item_name
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [order.id]
  );
  return { ...order, items: items.rows };
};

const listOrders = async ({ status, date } = {}) => {
  const clauses = [];
  const params = [];
  if (status) {
    params.push(status);
    clauses.push(`o.status = $${params.length}`);
  }
  if (date) {
    params.push(date);
    clauses.push(`o.created_at::date = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(`${ORDER_SELECT} ${where} ORDER BY o.created_at DESC`, params);
  return Promise.all(result.rows.map(attachItems));
};

const getOrderById = async (id) => {
  const result = await query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  if (!result.rows[0]) throw ApiError.notFound('Order not found');
  return attachItems(result.rows[0]);
};

/**
 * Creates an order with its line items in a single transaction, and
 * marks the table as occupied. Item prices are snapshotted from the
 * menu at creation time so future menu price changes don't affect
 * historical orders/bills.
 */
const createOrder = async ({ table_id, waiter_id, notes, items }) => {
  if (!items || items.length === 0) {
    throw ApiError.badRequest('An order must contain at least one item');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const table = await client.query('SELECT * FROM restaurant_tables WHERE id = $1 FOR UPDATE', [table_id]);
    if (!table.rows[0]) throw ApiError.notFound('Table not found');

    const orderResult = await client.query(
      `INSERT INTO orders (table_id, waiter_id, notes, status) VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [table_id, waiter_id, notes || null]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      const menuItem = await client.query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
      if (!menuItem.rows[0]) throw ApiError.notFound(`Menu item ${item.menu_item_id} not found`);
      if (!menuItem.rows[0].is_available) {
        throw ApiError.badRequest(`Menu item "${menuItem.rows[0].name}" is currently unavailable`);
      }
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.quantity, menuItem.rows[0].price, item.notes || null]
      );
    }

    await client.query(`UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1`, [table_id]);

    await client.query('COMMIT');
    return getOrderById(order.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Replaces the item list on an order that hasn't been billed yet.
 */
const updateOrderItems = async (orderId, items) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const order = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!order.rows[0]) throw ApiError.notFound('Order not found');
    if (['completed', 'cancelled'].includes(order.rows[0].status)) {
      throw ApiError.badRequest(`Cannot modify items on a ${order.rows[0].status} order`);
    }

    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    for (const item of items) {
      const menuItem = await client.query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
      if (!menuItem.rows[0]) throw ApiError.notFound(`Menu item ${item.menu_item_id} not found`);
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.quantity, menuItem.rows[0].price, item.notes || null]
      );
    }

    await client.query('COMMIT');
    return getOrderById(orderId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateOrderStatus = async (id, status) => {
  const existing = await query('SELECT status FROM orders WHERE id = $1', [id]);
  if (!existing.rows[0]) throw ApiError.notFound('Order not found');
  if (['completed', 'cancelled'].includes(existing.rows[0].status)) {
    throw ApiError.badRequest(`Cannot change status of an order that is already ${existing.rows[0].status}`);
  }

  const result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);

  if (status === 'cancelled') {
    await query(
      `UPDATE restaurant_tables SET status = 'available' WHERE id = $1`,
      [result.rows[0].table_id]
    );
  }
  return getOrderById(id);
};

const deleteOrder = async (id) => {
  const order = await query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order.rows[0]) throw ApiError.notFound('Order not found');
  const billed = await query('SELECT 1 FROM bills WHERE order_id = $1', [id]);
  if (billed.rows[0]) {
    throw ApiError.badRequest('Cannot delete an order that has already been billed');
  }
  await query('DELETE FROM orders WHERE id = $1', [id]);
};

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderItems,
  updateOrderStatus,
  deleteOrder,
};
