// Unit tests for importHistory.model.js
// Guards the canonical import_history table + v2 columns (file_name,
// import_type, transactions_imported, ...). The legacy import_batches table
// was removed during the v1->v2 migration; a regression here (pointing the
// model back at import_batches) is exactly what broke Import History.

jest.mock('../config/db');

const db = require('../config/db');
const ImportHistoryModel = require('./importHistory.model');

const queryText = (i = 0) => db.query.mock.calls[i][0];

beforeEach(() => db.query.mockReset());

describe('ImportHistoryModel.list', () => {
  it('queries import_history (not import_batches) and uses v2 columns', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, file_name: 'hdfc.csv' }] });

    const rows = await ImportHistoryModel.list(7, { importType: 'csv', status: 'success' });

    const sql = queryText(0);
    expect(sql).toMatch(/FROM import_history/);
    expect(sql).not.toMatch(/import_batches/);
    expect(sql).toMatch(/import_type = /);
    expect(sql).toMatch(/status = /);
    expect(rows[0].file_name).toBe('hdfc.csv');
  });

  it('orders by created_at DESC by default', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await ImportHistoryModel.list(7);
    expect(queryText(0)).toMatch(/ORDER BY created_at DESC/);
  });
});

describe('ImportHistoryModel.create', () => {
  it('INSERTs into import_history with the v2 column set and 11 bound params', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await ImportHistoryModel.create(7, {
      fileName: 'hdfc.csv', importType: 'csv', detectedBank: 'HDFC', parserUsed: 'csv',
      totalRows: 2, transactionsImported: 2, duplicatesSkipped: 0, failedRows: 0,
      importDurationMs: 120, status: 'success',
    });

    const sql = queryText(0);
    expect(sql).toMatch(/INSERT INTO import_history/);
    expect(sql).not.toMatch(/import_batches/);
    expect(sql).toMatch(/file_name/);
    expect(sql).toMatch(/import_type/);
    expect(sql).toMatch(/transactions_imported/);
    expect(db.query.mock.calls[0][1]).toHaveLength(11);
  });

  it('defaults optional fields to null/success', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await ImportHistoryModel.create(7, { fileName: 'x.csv', importType: 'csv' });

    const params = db.query.mock.calls[0][1];
    expect(params[3]).toBeNull(); // detectedBank
    expect(params[4]).toBeNull(); // parserUsed
    expect(params[10]).toBe('success'); // status
  });
});

describe('ImportHistoryModel.findById / delete', () => {
  it('findById scopes by user_id on import_history', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 7 }] });
    const row = await ImportHistoryModel.findById(1, 7);
    expect(queryText(0)).toMatch(/FROM import_history WHERE id = \$1 AND user_id = \$2/);
    expect(row.user_id).toBe(7);
  });

  it('delete targets import_history', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await ImportHistoryModel.delete(1, 7);
    expect(queryText(0)).toMatch(/DELETE FROM import_history/);
    expect(queryText(0)).not.toMatch(/import_batches/);
  });
});
