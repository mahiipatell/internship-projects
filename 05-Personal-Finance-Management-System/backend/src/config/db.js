/**
 * PostgreSQL connection pool.
 *
 * We use a single shared `pg.Pool` rather than opening a new client per
 * request. The pool manages a set of reusable connections, which is the
 * standard pattern for a request/response web server talking to Postgres.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // max simultaneous connections in the pool
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Errors on idle clients (e.g. connection dropped by the DB) should not
  // crash the whole process — log and let the pool recover.
  console.error('Unexpected PostgreSQL error on idle client', err);
});

pool.on('connect', () => {
  console.log('PostgreSQL pool: new client connected');
});

module.exports = pool;
