-- Personal Finance upgrade: Firebase auth fields, profile fields, accounts,
-- savings goals, recurring transactions. All additive/idempotent so this
-- is safe to re-run on an existing database.

ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) NOT NULL DEFAULT 'light';
-- Firebase now owns credentials, so a local password hash is optional.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ACCOUNTS (Cash / Bank / Credit Card / Wallet, extensible later)
CREATE TABLE IF NOT EXISTS accounts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'wallet')),
  icon        VARCHAR(10),
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_account_per_user UNIQUE (user_id, name)
);

DO $$ BEGIN
  CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Every transaction can belong to an account (nullable so existing rows
-- and simple use-without-accounts both keep working).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

-- SAVINGS GOALS (MacBook, Vacation, Emergency Fund, Car, ...)
CREATE TABLE IF NOT EXISTS savings_goals (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  icon            VARCHAR(10),
  target_amount   NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

-- RECURRING TRANSACTIONS (Rent, Netflix, Electricity, Gym, ...)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id      INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  title           VARCHAR(150) NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type            VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  frequency       VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date      DATE NOT NULL,
  next_run_date   DATE NOT NULL,
  last_run_date   DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_transactions(next_run_date) WHERE is_active = TRUE;

-- Backfill: give every existing user a default "Cash" account, and attach
-- any un-linked transactions to it, so account-based views work
-- immediately for accounts created before this upgrade.
INSERT INTO accounts (user_id, name, type, icon, is_default)
SELECT u.id, 'Cash', 'cash', '💵', TRUE
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id = u.id);

UPDATE transactions t
SET account_id = a.id
FROM accounts a
WHERE t.account_id IS NULL AND a.user_id = t.user_id AND a.is_default = TRUE;
