// Unit tests for user.model.js
// Guards: createFromFirebase binds emailVerified to the email_verified column
// (not a broken emailVerified column); updateProfile SET-list uses snake_case
// avatar_url/monthly_income; updateEmailVerified writes email_verified;
// findByFirebaseUid looks up by firebase_uid.

jest.mock('../config/db');

const db = require('../config/db');
const UserModel = require('./user.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];
const queryParams = (i = 0) => db.query.mock.calls[i][1];

beforeEach(() => db.query.mockReset());

describe('UserModel.createFromFirebase', () => {
  it('inserts email_verified (not a broken emailVerified column) and avatar_url', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, email_verified: true }] });

    const user = await UserModel.createFromFirebase({
      firebaseUid: 'abc',
      email: 'a@b.com',
      name: 'Ada',
      avatarUrl: 'http://img',
      emailVerified: true,
    });

    const sql = queryText(0);
    expect(sql).toMatch(/INSERT INTO users/);
    expect(sql).toMatch(/email_verified/);
    expect(sql).not.toMatch(/emailVerified/);
    expect(sql).toMatch(/avatar_url/);
    expect(queryParams(0)).toEqual(['abc', 'Ada', 'a@b.com', 'http://img', true]);
    expect(user.email_verified).toBe(true);
  });

  it('treats a missing avatarUrl as NULL', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await UserModel.createFromFirebase({
      firebaseUid: 'def',
      email: 'c@d.com',
      name: 'Bob',
      emailVerified: false,
    });

    expect(queryParams(0)).toContain(null);
  });
});

describe('UserModel.updateProfile', () => {
  it('SET-list uses snake_case avatar_url/monthly_income and never binds undefined', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const data = {
      name: 'Ada',
      avatar_url: 'http://img',
      currency: 'USD',
      monthly_income: 50000,
      country: 'US',
      timezone: 'UTC',
      theme: 'dark',
      notifications: true,
    };
    await UserModel.updateProfile(7, data);

    const sql = queryText(0);
    expect(sql).toMatch(/UPDATE users/);
    expect(sql).toMatch(/avatar_url=\$/);
    expect(sql).toMatch(/monthly_income=\$/);
    expect(sql).not.toMatch(/avatarUrl/);
    expect(sql).not.toMatch(/monthlyIncome/);
    // exactly 9 bound params: 8 SET values + 1 WHERE id, none undefined
    const params = queryParams(0);
    expect(params).toHaveLength(9);
    expect(params).not.toContain(undefined);
    expect(params[8]).toBe(7);
  });
});

describe('UserModel.updateEmailVerified', () => {
  it('updates email_verified by id', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 7, email_verified: true }] });

    const user = await UserModel.updateEmailVerified(7, true);

    expect(queryText(0)).toMatch(/SET email_verified=\$1/);
    expect(queryParams(0)).toEqual([true, 7]);
    expect(user.email_verified).toBe(true);
  });
});

describe('UserModel.findByFirebaseUid', () => {
  it('looks up by firebase_uid', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 7, firebase_uid: 'abc' }] });

    const user = await UserModel.findByFirebaseUid('abc');

    expect(queryText(0)).toMatch(/WHERE firebase_uid=\$1/);
    expect(queryParams(0)).toEqual(['abc']);
    expect(user.firebase_uid).toBe('abc');
  });
});
