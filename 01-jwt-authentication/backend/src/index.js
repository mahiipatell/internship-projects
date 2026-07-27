require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Auth API is running' });
});

// ─── Init DB and Start Server ────────────────────────────────────────────────
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT '',
        phone VARCHAR(30) DEFAULT '',
        location VARCHAR(100) DEFAULT '',
        avatar_color VARCHAR(7) DEFAULT '#6c63ff',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Migrate existing tables — add columns if they don't exist yet
    const migrations = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7) DEFAULT '#6c63ff'`,
    ];
    for (const sql of migrations) {
      await pool.query(sql);
    }
    console.log('Users table ready');
  } catch (err) {
    console.error('DB init error:', err.message);
    process.exit(1);
  }
};

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
