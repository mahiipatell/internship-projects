-- ============================================================================
-- Expense Tracker — PostgreSQL Schema
-- ============================================================================
-- Design notes:
--   • 5 tables: users, categories, transactions, budget_settings, budget_categories
--   • categories are shared: rows with user_id IS NULL are system defaults
--     (visible to everyone), rows with a user_id are that user's custom
--     categories. This avoids duplicating the 12 default categories per user.
--   • budget_settings is one-row-per-user (enforced with UNIQUE) holding the
--     ON/OFF flag, monthly income and savings goal.
--   • budget_categories holds the per-category allocation for a user's
--     budget, linked to budget_settings.
--   • ON DELETE CASCADE on user_id FKs: deleting a user cleans up their data.
--   • ON DELETE RESTRICT on category_id in transactions: a category that is
--     already used by a transaction cannot be silently deleted.
-- ============================================================================

-- Reusable trigger function to keep "updated_at" columns fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- CATEGORIES
-- ============================================================================
-- user_id NULL  -> default/system category (Food, Bills, Salary, etc.)
-- user_id set   -> custom category created by that specific user
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user cannot create two categories with the same name
  CONSTRAINT uq_category_per_user UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================
CREATE TABLE transactions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title         VARCHAR(150) NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  date          DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Most queries filter by user and sort/filter by date -> composite index
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);

-- ============================================================================
-- BUDGET SETTINGS  (one row per user)
-- ============================================================================
CREATE TABLE budget_settings (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_income  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
  savings_goal    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (savings_goal >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_budget_settings_updated_at
BEFORE UPDATE ON budget_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- BUDGET CATEGORIES  (per-category allocation within a user's budget)
-- ============================================================================
CREATE TABLE budget_categories (
  id                  SERIAL PRIMARY KEY,
  budget_settings_id  INTEGER NOT NULL REFERENCES budget_settings(id) ON DELETE CASCADE,
  category_id         INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  allocated_amount    NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One allocation per category per budget
  CONSTRAINT uq_budget_category UNIQUE (budget_settings_id, category_id)
);

CREATE TRIGGER trg_budget_categories_updated_at
BEFORE UPDATE ON budget_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_budget_categories_settings_id ON budget_categories(budget_settings_id);

-- ============================================================================
-- SEED DATA — default categories (visible to all users, user_id = NULL)
-- ============================================================================
INSERT INTO categories (user_id, name, type, is_default) VALUES
  (NULL, 'Food',            'expense', TRUE),
  (NULL, 'Groceries',       'expense', TRUE),
  (NULL, 'Bills',           'expense', TRUE),
  (NULL, 'Shopping',        'expense', TRUE),
  (NULL, 'Travel',          'expense', TRUE),
  (NULL, 'Entertainment',   'expense', TRUE),
  (NULL, 'Gym & Sports',    'expense', TRUE),
  (NULL, 'Education',       'expense', TRUE),
  (NULL, 'Medical',         'expense', TRUE),
  (NULL, 'Other',           'expense', TRUE),
  (NULL, 'Salary',          'income',  TRUE),
  (NULL, 'Investments',     'income',  TRUE);
