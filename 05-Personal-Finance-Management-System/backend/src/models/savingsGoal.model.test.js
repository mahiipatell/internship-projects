// Unit tests for savingsGoal.model.js
// Guards the canonical savings_goals columns: name / target_date / target_amount
// (the old title/deadline naming caused INSERT failures on a fresh DB).

jest.mock('../config/db');

const db = require('../config/db');
const SavingsGoalModel = require('./savingsGoal.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];

beforeEach(() => db.query.mockReset());

describe('SavingsGoalModel.create', () => {
  it('inserts the name and target_date columns', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'MacBook', target_date: '2026-12-31' }] });

    const goal = await SavingsGoalModel.create(7, { name: 'MacBook', icon: '💻', targetAmount: 100000, targetDate: '2026-12-31' });

    const sql = queryText(0);
    expect(sql).toMatch(/INSERT INTO savings_goals/);
    expect(sql).toMatch(/\(user_id, name, icon, target_amount, target_date\)/);
    expect(sql).not.toMatch(/title/);
    expect(sql).not.toMatch(/deadline/);
    expect(goal.name).toBe('MacBook');
    expect(goal.target_date).toBe('2026-12-31');
  });
});

describe('SavingsGoalModel.update / contribute / delete', () => {
  it('update writes name/target_date and not title/deadline', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await SavingsGoalModel.update(1, 7, { name: 'Trip', icon: '✈️', targetAmount: 50000, targetDate: '2026-08-01' });

    const sql = queryText(0);
    expect(sql).toMatch(/UPDATE savings_goals/);
    expect(sql).toMatch(/name = /);
    expect(sql).toMatch(/target_date = /);
    expect(sql).not.toMatch(/title = /);
  });

  it('addContribution increments current_amount', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, current_amount: '5000' }] });
    const goal = await SavingsGoalModel.addContribution(1, 7, 5000);
    expect(queryText(0)).toMatch(/current_amount = current_amount \+ /);
    expect(goal.current_amount).toBe('5000');
  });

  it('list and findById return rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'MacBook' }] });
    expect(await SavingsGoalModel.list(7)).toEqual([{ id: 1, name: 'MacBook' }]);

    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    expect(await SavingsGoalModel.findById(1, 7)).toEqual({ id: 1 });
  });

  it('delete returns the deleted id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    expect(await SavingsGoalModel.delete(1, 7)).toEqual({ id: 1 });
  });
});
