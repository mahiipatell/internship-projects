const { query } = require('../config/db');

/**
 * period: 'daily' | 'weekly' | 'monthly'
 * Buckets paid bills by day/week/month over the requested range.
 */
const getSalesReport = async ({ period = 'daily', from, to }) => {
  const trunc = period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day';

  const clauses = [`payment_status = 'paid'`];
  const params = [];
  if (from) {
    params.push(from);
    clauses.push(`created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`created_at::date <= $${params.length}`);
  }
  const where = `WHERE ${clauses.join(' AND ')}`;

  const result = await query(
    `SELECT date_trunc('${trunc}', created_at) AS bucket,
            COUNT(*) AS bill_count,
            COALESCE(SUM(grand_total), 0) AS revenue
     FROM bills ${where}
     GROUP BY bucket ORDER BY bucket ASC`,
    params
  );

  return result.rows.map((r) => ({
    period: r.bucket,
    billCount: Number(r.bill_count),
    revenue: Number(r.revenue),
  }));
};

const getBestSellingItems = async ({ from, to, limit = 10 }) => {
  const clauses = [`b.payment_status = 'paid'`];
  const params = [];
  if (from) {
    params.push(from);
    clauses.push(`b.created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`b.created_at::date <= $${params.length}`);
  }
  params.push(limit);
  const where = `WHERE ${clauses.join(' AND ')}`;

  const result = await query(
    `SELECT mi.id, mi.name, SUM(oi.quantity) AS total_qty,
            SUM(oi.quantity * oi.unit_price) AS total_revenue
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     JOIN orders o ON o.id = oi.order_id
     JOIN bills b ON b.order_id = o.id
     ${where}
     GROUP BY mi.id, mi.name
     ORDER BY total_qty DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    quantitySold: Number(r.total_qty),
    revenue: Number(r.total_revenue),
  }));
};

const getRevenueSummary = async ({ from, to }) => {
  const clauses = [`payment_status = 'paid'`];
  const params = [];
  if (from) {
    params.push(from);
    clauses.push(`created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`created_at::date <= $${params.length}`);
  }
  const where = `WHERE ${clauses.join(' AND ')}`;

  const result = await query(
    `SELECT COALESCE(SUM(grand_total),0) AS revenue, COALESCE(SUM(gst_amount),0) AS tax,
            COALESCE(SUM(discount_amount),0) AS discounts, COUNT(*) AS bills
     FROM bills ${where}`,
    params
  );
  const r = result.rows[0];
  return {
    revenue: Number(r.revenue),
    tax: Number(r.tax),
    discounts: Number(r.discounts),
    bills: Number(r.bills),
  };
};

module.exports = { getSalesReport, getBestSellingItems, getRevenueSummary };
