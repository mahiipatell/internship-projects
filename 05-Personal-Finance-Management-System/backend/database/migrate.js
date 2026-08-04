require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runFile(label, filePath, ignoreDuplicateTable = false) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  try {
    await pool.query(sql);
    console.log(`✅ ${label} applied.`);
  } catch (err) {
    if (ignoreDuplicateTable && err.code === '42P07') {
      console.log(`ℹ️  ${label}: base schema already exists, skipping.`);
      return;
    }
    throw err;
  }
}

async function migrate() {
  console.log('Running migrations against', process.env.DB_NAME, '...');
  try {
    await runFile('Base schema', path.join(__dirname, 'schema.sql'), true);

    const incrementsDir = path.join(__dirname, 'increments');
    const files = fs.existsSync(incrementsDir)
      ? fs.readdirSync(incrementsDir).sort()
      : [];
    for (const file of files) {
      await runFile(`Increment ${file}`, path.join(incrementsDir, file));
    }

    console.log('✅ All migrations applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
