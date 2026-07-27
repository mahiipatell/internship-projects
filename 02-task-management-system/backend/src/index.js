require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/users');
const taskRoutes  = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => res.json({ message: 'TaskFlow API running' }));

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        bio           TEXT         DEFAULT '',
        phone         VARCHAR(30)  DEFAULT '',
        location      VARCHAR(100) DEFAULT '',
        avatar_color  VARCHAR(7)   DEFAULT '#6c63ff',
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      );
    `);
    const userCols = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio          TEXT         DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone        VARCHAR(30)  DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS location     VARCHAR(100) DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7)   DEFAULT '#6c63ff'`,
    ];
    for (const sql of userCols) await pool.query(sql);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        priority    VARCHAR(10)  DEFAULT 'Medium'
                    CHECK (priority IN ('High','Medium','Low')),
        status      VARCHAR(20)  DEFAULT 'Pending'
                    CHECK (status IN ('Pending','In Progress','Completed')),
        category    VARCHAR(20)  DEFAULT 'Others'
                    CHECK (category IN ('Work','Study','Personal','Shopping','Others')),
        due_date    DATE,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`);

    console.log('✓ Database ready');
  } catch (err) {
    console.error('DB init error:', err.message);
    process.exit(1);
  }
};

initDB().then(() => {
  app.listen(PORT, () => console.log(`✓ Server on http://localhost:${PORT}`));
});
