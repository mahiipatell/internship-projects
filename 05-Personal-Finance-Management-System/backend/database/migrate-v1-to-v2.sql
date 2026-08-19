-- One-time migration: live database (v1) -> v2 schema.sql
--
-- Root cause of the three reported runtime bugs (Import History empty,
-- Recurring won't load, imported Transactions disappear): the running
-- PostgreSQL database was still on the v1 schema while the application code
-- (models/controllers) was migrated to v2. This brings the live DB to the
-- exact v2 shape defined in schema.sql, preserving existing rows.
--
-- transactions / recurring_transactions / import_batches / savings_goals were
-- empty at migration time, so no row data is lost; users(1), categories(18),
-- budgets(1) are preserved.

BEGIN;

-- 1) accounts table (new in v2, referenced by transactions + recurring)
CREATE TABLE IF NOT EXISTS accounts (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('cash','bank','credit_card','wallet')),
    icon        VARCHAR(10),
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_account_per_user UNIQUE (user_id, name)
);
CREATE TRIGGER trg_accounts_updated
BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- 2) transactions: drop legacy batch_id, add account_id (fixes INSERT failure)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_batch_id_fkey;
ALTER TABLE transactions DROP COLUMN IF EXISTS batch_id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);

-- 3) recurring_transactions: rename v1 cols -> v2, add missing cols
--    (fixes SELECT failure: model queries is_active / next_run_date)
ALTER TABLE recurring_transactions RENAME COLUMN active TO is_active;
ALTER TABLE recurring_transactions RENAME COLUMN next_due TO next_run_date;
ALTER TABLE recurring_transactions ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE recurring_transactions ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS last_run_date DATE;

-- 4) import_batches (v1) -> import_history (v2)
--    v1 table is empty; schemas differ, so replace it.
DROP TABLE IF EXISTS import_batches CASCADE;
CREATE TABLE import_history (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name               VARCHAR(255) NOT NULL,
    import_type             VARCHAR(30) NOT NULL,
    detected_bank           VARCHAR(50),
    parser_used             VARCHAR(50),
    total_rows              INTEGER NOT NULL DEFAULT 0,
    transactions_imported   INTEGER NOT NULL DEFAULT 0,
    duplicates_skipped      INTEGER NOT NULL DEFAULT 0,
    failed_rows             INTEGER NOT NULL DEFAULT 0,
    import_duration_ms      INTEGER,
    status                  VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success','partial','failed')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_history_user ON import_history(user_id, created_at DESC);

-- 5) savings_goals: rename v1 cols -> v2 (code queries name / target_date)
ALTER TABLE savings_goals RENAME COLUMN title TO name;
ALTER TABLE savings_goals RENAME COLUMN deadline TO target_date;

COMMIT;
