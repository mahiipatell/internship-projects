const { query } = require('../config/db');

const getDashboardSummary = async () => {
  const [todaySales, todayOrders, tables, topItems] = await Promise.all([
    query(`SELECT COALESCE(SUM(grand_total), 0) AS revenue, COUNT(*) AS bill_count
           FROM bills WHERE created_at::date = CURRENT_DATE AND payment_status = 'paid'`),
    query(`SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status = 'pending') AS pending,
             COUNT(*) FILTER (WHERE status = 'preparing') AS preparing,
             COUNT(*) FILTER (WHERE status = 'served') AS served,
             COUNT(*) FILTER (WHERE status = 'completed') AS completed
           FROM orders WHERE created_at::date = CURRENT_DATE`),
    query(`SELECT status, COUNT(*) AS count FROM restaurant_tables GROUP BY status`),
    query(`SELECT mi.name, SUM(oi.quantity) AS total_qty
           FROM order_items oi
           JOIN menu_items mi ON mi.id = oi.menu_item_id
           JOIN orders o ON o.id = oi.order_id
           WHERE o.created_at::date = CURRENT_DATE
           GROUP BY mi.name ORDER BY total_qty DESC LIMIT 5`),
  ]);

  const tableStatusMap = { available: 0, occupied: 0, reserved: 0 };
  tables.rows.forEach((r) => { tableStatusMap[r.status] = Number(r.count); });

  return {
    todayRevenue: Number(todaySales.rows[0].revenue),
    todayBillCount: Number(todaySales.rows[0].bill_count),
    todayOrders: {
      total: Number(todayOrders.rows[0].total),
      pending: Number(todayOrders.rows[0].pending),
      preparing: Number(todayOrders.rows[0].preparing),
      served: Number(todayOrders.rows[0].served),
      completed: Number(todayOrders.rows[0].completed),
    },
    tables: tableStatusMap,
    topSellingItems: topItems.rows.map((r) => ({ name: r.name, quantity: Number(r.total_qty) })),
  };
};

module.exports = { getDashboardSummary };
