const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'restaurant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

/**
 * Run a query using the shared pool.
 * @param {string} text
 * @param {Array} params
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for running a transaction.
 * Caller MUST call client.release() when done.
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
