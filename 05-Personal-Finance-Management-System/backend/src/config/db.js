/**
 * PostgreSQL connection pool.
 *
 * We use a single shared `pg.Pool` rather than opening a new client per
 * request. The pool manages a set of reusable connections, which is the
 * standard pattern for a request/response web server talking to Postgres.
 */
const { Pool } = require('pg');
require('dotenv').config();

console.log("===== ENV CHECK =====");
console.log("__dirname:", __dirname);
console.log("cwd:", process.cwd());
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("=====================");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
