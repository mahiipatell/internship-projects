// Unit tests for recurring.model.js
// Guards the canonical recurring columns: next_run_date / is_active /
// account_id / notes / start_date / last_run_date (the old next_due/active
// naming broke create, findDue and the processRecurring while-loop).

jest.mock('../config/db');

const db = require('../config/db');
const RecurringModel = require('./recurring.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];

beforeEach(() => db.query.mockReset());

describe('RecurringModel.create', () => {
  it('inserts next_run_date/is_active and maps startDate to both start_date and next_run_date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, next_run_date: '2026-02-01', start_date: '2026-02-01', is_active: true }] });

    const rule = await RecurringModel.create(7, {
      categoryId: 3, accountId: 2, title: 'Rent', amount: 2000, type: 'expense',
      frequency: 'monthly', startDate: '2026-02-01', notes: 'Feb rent',
    });

    const sql = queryText(0);
    expect(sql).toMatch(/INSERT INTO recurring_transactions/);
    expect(sql).toMatch(/next_run_date/);
    expect(sql).toMatch(/is_active/);
    expect(sql).not.toMatch(/next_due/);
    expect(sql).not.toMatch(/[^_]active =/); // no bare `active =` column
    // startDate is bound twice (start_date AND next_run_date)
    const params = db.query.mock.calls[0][1];
    expect(params).toContain('2026-02-01');
    expect(rule.next_run_date).toBe('2026-02-01');
  });

  it('treats missing accountId and notes as NULL', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    await RecurringModel.create(7, { categoryId: 3, title: 'Gym', amount: 500, type: 'expense', frequency: 'monthly', startDate: '2026-02-01' });
    const params = db.query.mock.calls[0][1];
    expect(params).toContain(null);
  });
});

describe('RecurringModel.update', () => {
  it('updates is_active (not active) and notes/account_id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_active: false }] });

    await RecurringModel.update(1, 7, {
      categoryId: 3, accountId: 2, title: 'Rent', amount: 2000, type: 'expense',
      frequency: 'monthly', isActive: false, notes: 'paused',
    });

    const sql = queryText(0);
    expect(sql).toMatch(/UPDATE recurring_transactions/);
    expect(sql).toMatch(/is_active=\$/);
    expect(sql).not.toMatch(/[^_]active=\$/);
    expect(db.query.mock.calls[0][1]).toContain(false);
  });
});

describe('RecurringModel.list / findDue / advance', () => {
  it('list orders by is_active DESC, next_run_date ASC and returns next_run_date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, next_run_date: '2026-02-01', is_active: true }] });

    const rows = await RecurringModel.list(7);
    expect(queryText(0)).toMatch(/ORDER BY\s+r\.is_active DESC,\s*r\.next_run_date ASC/);
    expect(rows[0].next_run_date).toBe('2026-02-01');
  });

  it('findDue selects active rules due on/before today via next_run_date', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await RecurringModel.findDue(7, '2026-02-01');

    const sql = queryText(0);
    expect(sql).toMatch(/is_active=true/);
    expect(sql).toMatch(/next_run_date <= /);
    expect(sql).not.toMatch(/next_due/);
    expect(db.query.mock.calls[0][1]).toEqual([7, '2026-02-01']);
  });

  it('advance updates both next_run_date and last_run_date', async () => {
    db.query.mockResolvedValueOnce({});
    await RecurringModel.advance(1, { nextRunDate: '2026-03-01', lastRunDate: '2026-02-01' });

    const sql = queryText(0);
    expect(sql).toMatch(/SET next_run_date=\$1, last_run_date=\$2/);
    expect(db.query.mock.calls[0][1]).toEqual(['2026-03-01', '2026-02-01', 1]);
  });

  it('delete returns the deleted id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    expect(await RecurringModel.delete(1, 7)).toEqual({ id: 1 });
  });
});
