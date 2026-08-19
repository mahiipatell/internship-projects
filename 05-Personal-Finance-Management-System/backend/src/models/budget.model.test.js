// Unit tests for budget.model.js
// Guards: getCategories returns c.name/c.icon (the controller reads those,
// not category_name/category_icon); getSpentByCategoryThisMonth uses
// transaction_date; getSettings reads the `enabled` column; enable uses
// ON CONFLICT upsert.

jest.mock('../config/db');

const db = require('../config/db');
const BudgetModel = require('./budget.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];

beforeEach(() => db.query.mockReset());

describe('BudgetModel.getSettings', () => {
  it('selects from budgets ordered by year/month desc, limited to 1', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, enabled: true, monthly_income: '50000' }] });
    const settings = await BudgetModel.getSettings(7);
    expect(queryText(0)).toMatch(/SELECT \*[\s\S]*FROM budgets/);
    expect(queryText(0)).toMatch(/ORDER BY year DESC, month DESC/);
    expect(settings.enabled).toBe(true);
  });
});

describe('BudgetModel.getCategories', () => {
  it('returns c.name and c.icon (not category_name/category_icon)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, category_id: 2, allocated_amount: '5000', name: 'Rent', icon: 'Home' }] });
    const rows = await BudgetModel.getCategories(1);
    const sql = queryText(0);
    expect(sql).toMatch(/c\.name/);
    expect(sql).toMatch(/c\.icon/);
    expect(sql).not.toMatch(/category_name/);
    expect(sql).not.toMatch(/category_icon/);
    expect(rows[0]).toMatchObject({ name: 'Rent', icon: 'Home' });
  });
});

describe('BudgetModel.getSpentByCategoryThisMonth', () => {
  it('filters on transaction_date, not a bare date column', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ category_id: 2, spent: '1200' }] });
    const rows = await BudgetModel.getSpentByCategoryThisMonth(7);
    expect(queryText(0)).toMatch(/date_trunc\('month',\s*transaction_date\)/);
    expect(queryText(0)).not.toMatch(/date_trunc\('month', date\)/);
    expect(rows[0]).toEqual({ category_id: 2, spent: '1200' });
  });
});

describe('BudgetModel.enable / setEnabled / allocations', () => {
  it('enable upserts on (user_id,month,year) and sets enabled=true', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, enabled: true }] });
    await BudgetModel.enable(7, { monthlyIncome: 50000, savingsGoal: 5000 });
    const sql = queryText(0);
    expect(sql).toMatch(/INSERT INTO budgets/);
    expect(sql).toMatch(/ON CONFLICT\(user_id,month,year\)/);
    expect(sql).toMatch(/enabled=true/);
  });

  it('setEnabled updates enabled', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, enabled: false }] });
    const settings = await BudgetModel.setEnabled(7, false);
    expect(queryText(0)).toMatch(/SET enabled=\$1/);
    expect(settings.enabled).toBe(false);
  });

  it('addAllocation upserts on (budget_id,category_id)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    await BudgetModel.addAllocation(1, 2, 5000);
    expect(queryText(0)).toMatch(/INSERT INTO budget_allocations/);
    expect(queryText(0)).toMatch(/ON CONFLICT\(budget_id,category_id\)/);
  });

  it('findAllocationOwnedByUser and updateAllocationAmount run', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    expect(await BudgetModel.findAllocationOwnedByUser(5, 7)).toEqual({ id: 5 });

    db.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    await BudgetModel.updateAllocationAmount(5, 6000);
    expect(queryText(1)).toMatch(/SET allocated_amount=\$1/);
  });
});

describe('BudgetModel.reset', () => {
  it('deletes allocations and zeroes the budget inside a transaction', async () => {
    // getSettings is called first
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
    db.connect.mockResolvedValue(client);

    await BudgetModel.reset(7);

    expect(db.connect).toHaveBeenCalled();
    const texts = client.query.mock.calls.map((c) => c[0]);
    expect(texts).toContain('BEGIN');
    expect(texts).toContain('COMMIT');
    expect(texts.some((t) => /DELETE FROM budget_allocations/.test(t))).toBe(true);
    expect(texts.some((t) => /UPDATE budgets/.test(t))).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});
