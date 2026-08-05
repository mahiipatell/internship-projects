-- Import History + analytics metadata for the Smart Import Center v2.1

CREATE TABLE IF NOT EXISTS import_history (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name               VARCHAR(255) NOT NULL,
  import_type             VARCHAR(30) NOT NULL, -- bank-csv | credit-card-csv | excel | upi-csv | pdf-bank
  detected_bank           VARCHAR(50),
  parser_used             VARCHAR(50),
  total_rows              INTEGER NOT NULL DEFAULT 0,
  transactions_imported   INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped      INTEGER NOT NULL DEFAULT 0,
  failed_rows             INTEGER NOT NULL DEFAULT 0,
  import_duration_ms      INTEGER,
  status                  VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id, created_at DESC);
