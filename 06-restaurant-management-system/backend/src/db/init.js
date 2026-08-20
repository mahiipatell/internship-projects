/**
 * Initializes the database: runs schema.sql then seed.sql.
 * Usage: npm run db:init
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  const client = await pool.connect();
  try {
    console.log('Running schema.sql ...');
    await client.query(schema);
    console.log('Schema applied successfully.');

    console.log('Running seed.sql ...');
    await client.query(seed);
    console.log('Seed data applied successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
