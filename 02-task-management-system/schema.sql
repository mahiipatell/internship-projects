-- Run this manually if you prefer to set up the DB yourself
-- Otherwise the server auto-creates the table on startup

CREATE DATABASE authdb;

\c authdb;

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Useful for debugging:
-- SELECT * FROM users;
-- DELETE FROM users WHERE email = 'test@test.com';
