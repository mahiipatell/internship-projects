-- ==============================================================
-- Restaurant Management & Billing System - PostgreSQL Schema
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- ENUM TYPES ----------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'waiter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'served', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'waiter',
  phone           VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- MENU ITEMS ----------
CREATE TABLE IF NOT EXISTS menu_items (
  id              SERIAL PRIMARY KEY,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  image_url       VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- ---------- TABLES ----------
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id              SERIAL PRIMARY KEY,
  table_number    VARCHAR(20) NOT NULL UNIQUE,
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  status          table_status NOT NULL DEFAULT 'available',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  table_id        INTEGER NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
  waiter_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status          order_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  notes           VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);

-- ---------- BILLS ----------
CREATE TABLE IF NOT EXISTS bills (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  cashier_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subtotal        NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_percent     NUMERIC(5,2) NOT NULL DEFAULT 5,
  gst_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method  payment_method,
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);

-- ---------- INVOICES ----------
CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  bill_id         INTEGER NOT NULL UNIQUE REFERENCES bills(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(50) NOT NULL UNIQUE,
  pdf_path        VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','categories','menu_items','restaurant_tables','orders','bills']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;
