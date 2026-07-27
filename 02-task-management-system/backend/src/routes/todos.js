const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All todo routes require authentication
router.use(authenticateToken);

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_ORDER = `CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`;

// ─── GET /api/todos ───────────────────────────────────────────────────────────
// Query params: ?filter=all|active|completed
router.get('/', async (req, res) => {
  const { filter = 'all' } = req.query;

  let whereClause = 'WHERE user_id = $1';
  if (filter === 'active')    whereClause += ' AND completed = false';
  if (filter === 'completed') whereClause += ' AND completed = true';

  try {
    const result = await pool.query(
      `SELECT * FROM todos ${whereClause}
       ORDER BY completed ASC, ${PRIORITY_ORDER}, created_at DESC`,
      [req.user.userId]
    );
    res.json({ todos: result.rows });
  } catch (err) {
    console.error('Get todos error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/todos ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, priority = 'medium' } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO todos (user_id, title, priority)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.userId, title.trim(), priority]
    );
    res.status(201).json({ todo: result.rows[0] });
  } catch (err) {
    console.error('Create todo error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/todos/:id ─────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed, priority } = req.body;

  // Validate ownership
  try {
    const check = await pool.query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }

  // Build dynamic update
  const updates = [];
  const values = [];
  let i = 1;

  if (title !== undefined) {
    if (title.trim().length === 0) return res.status(400).json({ error: 'Title cannot be empty' });
    updates.push(`title = $${i++}`);
    values.push(title.trim());
  }
  if (completed !== undefined) {
    updates.push(`completed = $${i++}`);
    values.push(completed);
    if (completed) {
      updates.push(`completed_at = $${i++}`);
      values.push(new Date());
    } else {
      updates.push(`completed_at = NULL`);
    }
  }
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
    updates.push(`priority = $${i++}`);
    values.push(priority);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json({ todo: result.rows[0] });
  } catch (err) {
    console.error('Update todo error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/todos/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete todo error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/todos/completed/clear ───────────────────────────────────────
router.delete('/completed/clear', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE user_id = $1 AND completed = true RETURNING id',
      [req.user.userId]
    );
    res.json({ message: 'Cleared', count: result.rowCount });
  } catch (err) {
    console.error('Clear completed error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
