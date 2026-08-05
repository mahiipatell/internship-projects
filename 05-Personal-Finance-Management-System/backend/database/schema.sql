DROP TABLE IF EXISTS budget_allocations CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS import_batches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS set_updated_at CASCADE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------
-- USERS
---------------------------------------------------

CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,

    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,

    name                VARCHAR(120) NOT NULL,

    email               VARCHAR(255) UNIQUE NOT NULL,

    email_verified      BOOLEAN DEFAULT FALSE,

    avatar_url          TEXT,

    currency            VARCHAR(10) DEFAULT 'INR',

    monthly_income      NUMERIC(12,2) DEFAULT 0,

    country             VARCHAR(100),

    timezone            VARCHAR(100),

    theme               VARCHAR(20) DEFAULT 'light',

    notifications       BOOLEAN DEFAULT TRUE,

    last_login          TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

---------------------------------------------------
-- CATEGORIES
---------------------------------------------------

CREATE TABLE categories (

    id                  SERIAL PRIMARY KEY,

    user_id             INTEGER REFERENCES users(id)
                         ON DELETE CASCADE,

    name                VARCHAR(80) NOT NULL,

    icon                VARCHAR(60),

    color               VARCHAR(30),

    type                VARCHAR(20)
                         CHECK(type IN ('income','expense')),

    is_default          BOOLEAN DEFAULT FALSE,

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id,name)

);

---------------------------------------------------
-- IMPORT BATCHES
---------------------------------------------------

CREATE TABLE import_batches(

    id                  SERIAL PRIMARY KEY,

    user_id             INTEGER NOT NULL REFERENCES users(id)
                         ON DELETE CASCADE,

    source              VARCHAR(30)
                         CHECK(source IN
                         ('manual','csv','pdf','upi')),

    file_name           TEXT,

    imported_records    INTEGER DEFAULT 0,

    failed_records      INTEGER DEFAULT 0,

    created_at          TIMESTAMPTZ DEFAULT NOW()

);

---------------------------------------------------
-- TRANSACTIONS
---------------------------------------------------

CREATE TABLE transactions(

    id                      SERIAL PRIMARY KEY,

    user_id                 INTEGER NOT NULL REFERENCES users(id)
                            ON DELETE CASCADE,

    category_id             INTEGER REFERENCES categories(id)
                            ON DELETE SET NULL,

    batch_id                INTEGER REFERENCES import_batches(id)
                            ON DELETE SET NULL,

    title                   VARCHAR(200) NOT NULL,

    merchant                VARCHAR(150),

    payment_method          VARCHAR(40),

    amount                  NUMERIC(12,2) NOT NULL,

    type                    VARCHAR(20)
                            CHECK(type IN ('income','expense')),

    transaction_date        DATE NOT NULL,

    notes                   TEXT,

    is_recurring            BOOLEAN DEFAULT FALSE,

    attachment_url          TEXT,

    import_source           VARCHAR(30)
                            DEFAULT 'manual'
                            CHECK(import_source IN
                            ('manual','csv','pdf','upi')),

    created_at              TIMESTAMPTZ DEFAULT NOW(),

    updated_at              TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_transactions_updated
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

---------------------------------------------------
-- BUDGETS
---------------------------------------------------

CREATE TABLE budgets(

    id                      SERIAL PRIMARY KEY,

    user_id                 INTEGER NOT NULL REFERENCES users(id)
                            ON DELETE CASCADE,

    month                   INTEGER NOT NULL
                            CHECK(month BETWEEN 1 AND 12),

    year                    INTEGER NOT NULL,

    monthly_income          NUMERIC(12,2) DEFAULT 0,

    savings_goal            NUMERIC(12,2) DEFAULT 0,

    enabled                 BOOLEAN DEFAULT TRUE,

    created_at              TIMESTAMPTZ DEFAULT NOW(),

    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id,month,year)

);

CREATE TRIGGER trg_budgets_updated
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

---------------------------------------------------
-- BUDGET ALLOCATIONS
---------------------------------------------------

CREATE TABLE budget_allocations(

    id                      SERIAL PRIMARY KEY,

    budget_id               INTEGER NOT NULL REFERENCES budgets(id)
                            ON DELETE CASCADE,

    category_id             INTEGER NOT NULL REFERENCES categories(id)
                            ON DELETE CASCADE,

    allocated_amount        NUMERIC(12,2) DEFAULT 0,

    spent_amount            NUMERIC(12,2) DEFAULT 0,

    created_at              TIMESTAMPTZ DEFAULT NOW(),

    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(budget_id,category_id)

);

CREATE TRIGGER trg_budget_allocations_updated
BEFORE UPDATE ON budget_allocations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

---------------------------------------------------
-- INDEXES
---------------------------------------------------

CREATE INDEX idx_user_email
ON users(email);

CREATE INDEX idx_user_firebase
ON users(firebase_uid);

CREATE INDEX idx_transactions_user_date
ON transactions(user_id,transaction_date DESC);

CREATE INDEX idx_transactions_category
ON transactions(category_id);

CREATE INDEX idx_transactions_type
ON transactions(type);

CREATE INDEX idx_transactions_batch
ON transactions(batch_id);

CREATE INDEX idx_categories_user
ON categories(user_id);

CREATE INDEX idx_budget_user
ON budgets(user_id);

---------------------------------------------------
-- DEFAULT CATEGORIES
---------------------------------------------------

INSERT INTO categories
(user_id,name,icon,color,type,is_default)

VALUES

(NULL,'Food','Utensils','#F9A826','expense',TRUE),

(NULL,'Groceries','ShoppingCart','#9CCC65','expense',TRUE),

(NULL,'Bills','Receipt','#64B5F6','expense',TRUE),

(NULL,'Rent','Home','#A1887F','expense',TRUE),

(NULL,'EMI','Wallet','#BA68C8','expense',TRUE),

(NULL,'Shopping','ShoppingBag','#F48FB1','expense',TRUE),

(NULL,'Travel','Plane','#4FC3F7','expense',TRUE),

(NULL,'Fuel','Fuel','#FFB74D','expense',TRUE),

(NULL,'Medical','HeartPulse','#E57373','expense',TRUE),

(NULL,'Education','Book','#7986CB','expense',TRUE),

(NULL,'Entertainment','Film','#FFD54F','expense',TRUE),

(NULL,'Gym','Dumbbell','#81C784','expense',TRUE),

(NULL,'Salary','BadgeIndianRupee','#66BB6A','income',TRUE),

(NULL,'Freelancing','Laptop','#26A69A','income',TRUE),

(NULL,'Investment','TrendingUp','#42A5F5','income',TRUE),

(NULL,'Gift','Gift','#EC407A','income',TRUE),

(NULL,'Refund','RotateCcw','#AB47BC','income',TRUE),

(NULL,'Other','Circle','#90A4AE','expense',TRUE);

---------------------------------------------------
-- SAVINGS GOALS
---------------------------------------------------

CREATE TABLE savings_goals (

    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(150) NOT NULL,

    target_amount NUMERIC(12,2) NOT NULL,

    current_amount NUMERIC(12,2) DEFAULT 0,

    deadline DATE,

    color VARCHAR(30),

    icon VARCHAR(50),

    completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_savings_updated
BEFORE UPDATE
ON savings_goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

---------------------------------------------------
-- RECURRING TRANSACTIONS
---------------------------------------------------

CREATE TABLE recurring_transactions (

    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    category_id INTEGER
        REFERENCES categories(id)
        ON DELETE SET NULL,

    title VARCHAR(150),

    amount NUMERIC(12,2),

    type VARCHAR(20)
        CHECK(type IN ('income','expense')),

    frequency VARCHAR(20)
        CHECK(frequency IN
        ('daily','weekly','monthly','yearly')),

    next_due DATE,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_recurring_updated
BEFORE UPDATE
ON recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();