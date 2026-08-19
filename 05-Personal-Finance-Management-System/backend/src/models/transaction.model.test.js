// Unit tests for transaction.model.js
// The db pool is mocked so no real Postgres is touched. Tests also assert
// the SQL uses the canonical `transaction_date` column (guards against the
// old `t.date` drift that broke every transaction query).

jest.mock('../config/db');

const db = require('../config/db');
const TransactionModel = require('./transaction.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];
const queryParams = (i = 0) => db.query.mock.calls[i][1];

beforeEach(() => db.query.mockReset());

describe('TransactionModel.list', () => {
  const dataRow = { id: 1, title: 'Lunch', amount: '120.00', type: 'expense', date: '2026-01-02' };

  it('returns transactions and total from the data + count queries', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [dataRow] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] });

    const res = await TransactionModel.list({ userId: 7, page: 1, limit: 10 });

    expect(res.transactions).toEqual([dataRow]);
    expect(res.total).toBe(1);
  });

  it('uses transaction_date (not the broken t.date) and joins accounts', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] });

    await TransactionModel.list({ userId: 7 });

    const sql = queryText(0);
    expect(sql).toMatch(/transaction_date/);
    expect(sql).not.toMatch(/t\.date >=/);
    expect(sql).not.toMatch(/t\.date <=/);
    expect(sql).toMatch(/LEFT JOIN accounts/);
  });

  it('maps sortBy:date to t.transaction_date in ORDER BY', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] });

    await TransactionModel.list({ userId: 7, sortBy: 'date', sortOrder: 'asc' });

    expect(queryText(0)).toMatch(/ORDER BY t\.transaction_date ASC/);
  });

  it('passes filters as bound parameters', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] });

    await TransactionModel.list({ userId: 7, type: 'expense', from: '2026-01-01', to: '2026-02-01' });

    expect(queryParams(0)).toEqual(expect.arrayContaining([7, 'expense', '2026-01-01', '2026-02-01']));
  });

  it('returns empty arrays when no rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const res = await TransactionModel.list({ userId: 7 });
    expect(res.transactions).toEqual([]);
    expect(res.total).toBe(0);
  });
});

describe('TransactionModel.create / findById / update', () => {
  it('create inserts transaction_date and aliases it to date in RETURNING', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Salary', amount: '5000', type: 'income', date: '2026-01-01', account_id: null }],
    });

    const created = await TransactionModel.create(7, {
      title: 'Salary', amount: 5000, type: 'income', categoryId: 2, date: '2026-01-01',
    });

    expect(queryText(0)).toMatch(/INSERT INTO transactions/);
    expect(queryText(0)).toMatch(/transaction_date/);
    expect(queryText(0)).toMatch(/RETURNING .*transaction_date AS date/);
    expect(queryParams(0)).toContain('2026-01-01');
    expect(created.date).toBe('2026-01-01');
  });

  it('create treats a missing accountId as NULL', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await TransactionModel.create(7, { title: 'X', amount: 1, type: 'expense', categoryId: 2, date: '2026-01-01' });

    // accountId || null -> params include null
    expect(queryParams(0)).toContain(null);
  });

  it('findById returns the row and LEFT JOINs accounts', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, date: '2026-01-01' }] });

    const row = await TransactionModel.findById(1, 7);
    expect(row).toEqual({ id: 1, date: '2026-01-01' });
    expect(queryText(0)).toMatch(/LEFT JOIN accounts/);
    expect(queryParams(0)).toEqual([1, 7]);
  });

  it('update writes transaction_date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, date: '2026-03-03' }] });

    await TransactionModel.update(1, 7, { title: 'Y', amount: 2, type: 'expense', categoryId: 2, date: '2026-03-03' });

    expect(queryText(0)).toMatch(/UPDATE transactions/);
    expect(queryText(0)).toMatch(/transaction_date = /);
    expect(queryParams(0)).toContain('2026-03-03');
  });

  it('delete returns the deleted id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await TransactionModel.delete(1, 7);
    expect(res).toEqual({ id: 1 });
  });
});

describe('TransactionModel analytics', () => {
  it('existsSimilar matches on transaction_date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 9 }] });

    const dup = await TransactionModel.existsSimilar(7, { title: 'Lunch', amount: 120, date: '2026-01-01' });

    expect(dup).toBe(true);
    expect(queryText(0)).toMatch(/transaction_date = /);
  });

  it('getSummary groups income/expense totals', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ type: 'income', total: 5000 }, { type: 'expense', total: 120 }],
    });

    const summary = await TransactionModel.getSummary(7, {});
    expect(summary).toEqual({ income: 5000, expense: 120, balance: 4880 });
  });

  it('getMonthlyBreakdown uses transaction_date in date_trunc', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await TransactionModel.getMonthlyBreakdown(7, 6);
    expect(queryText(0)).toMatch(/date_trunc\('month', transaction_date\)/);
  });

  it('getCategoryBreakdown returns category totals', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ category: 'Food', total: 500 }] });
    const rows = await TransactionModel.getCategoryBreakdown(7, { type: 'expense' });
    expect(rows).toEqual([{ category: 'Food', total: 500 }]);
  });

  it('listAllForExport aliases transaction_date as date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ title: 'Lunch', date: '2026-01-01' }] });
    const rows = await TransactionModel.listAllForExport(7, {});
    expect(rows[0].date).toBe('2026-01-01');
    expect(queryText(0)).toMatch(/transaction_date AS date/);
  });

  it('getTopMerchant and getHighestExpense return a single row', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ title: 'Cafe', visits: 5 }] });
    db.query.mockResolvedValueOnce({ rows: [{ title: 'Rent', amount: '2000', date: '2026-01-05' }] });

    expect(await TransactionModel.getTopMerchant(7, {})).toEqual({ title: 'Cafe', visits: 5 });
    expect(await TransactionModel.getHighestExpense(7, {})).toEqual({ title: 'Rent', amount: '2000', date: '2026-01-05' });
  });
});
