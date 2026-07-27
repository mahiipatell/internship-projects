const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const VALID_PRIORITIES  = ['High', 'Medium', 'Low'];
const VALID_STATUSES    = ['Pending', 'In Progress', 'Completed'];
const VALID_CATEGORIES  = ['Work', 'Study', 'Personal', 'Shopping', 'Others'];
const VALID_SORT_FIELDS = ['due_date', 'priority', 'created_at', 'updated_at'];

// ─── GET /api/tasks/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*)                                                        AS total,
        COUNT(*) FILTER (WHERE status = 'Pending')                     AS pending,
        COUNT(*) FILTER (WHERE status = 'In Progress')                 AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Completed')                   AS completed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'Completed') AS overdue,
        COUNT(*) FILTER (WHERE priority = 'High')                      AS high_priority,
        COUNT(*) FILTER (
          WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
          AND status != 'Completed'
        )                                                               AS due_this_week
       FROM tasks WHERE user_id = $1`,
      [req.user.userId]
    );
    const row = result.rows[0];
    const total     = parseInt(row.total);
    const completed = parseInt(row.completed);

    const recent = await pool.query(
      `SELECT id, title, status, priority, category, updated_at
       FROM tasks WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5`,
      [req.user.userId]
    );
    const upcoming = await pool.query(
      `SELECT id, title, status, priority, category, due_date
       FROM tasks
       WHERE user_id = $1
         AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
         AND status != 'Completed'
       ORDER BY due_date ASC LIMIT 5`,
      [req.user.userId]
    );

    res.json({
      stats: {
        total,
        pending:        parseInt(row.pending),
        in_progress:    parseInt(row.in_progress),
        completed,
        overdue:        parseInt(row.overdue),
        high_priority:  parseInt(row.high_priority),
        due_this_week:  parseInt(row.due_this_week),
        completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      recent_activity: recent.rows,
      upcoming_tasks:  upcoming.rows,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/tasks/report ────────────────────────────────────────────────────
// Returns ALL tasks for the user (no pagination) for report generation
router.get('/report', async (req, res) => {
  const { from, to, status, priority, category } = req.query;

  const conditions = ['user_id = $1'];
  const values     = [req.user.userId];
  let idx = 2;

  if (status   && ['Pending','In Progress','Completed'].includes(status))            { conditions.push(`status = $${idx++}`);   values.push(status); }
  if (priority && ['High','Medium','Low'].includes(priority))                        { conditions.push(`priority = $${idx++}`); values.push(priority); }
  if (category && ['Work','Study','Personal','Shopping','Others'].includes(category)){ conditions.push(`category = $${idx++}`); values.push(category); }
  if (from) { conditions.push(`created_at >= $${idx++}`); values.push(from); }
  if (to)   { conditions.push(`created_at <= $${idx++}`); values.push(to + 'T23:59:59'); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const [tasksResult, statsResult, userResult] = await Promise.all([
      pool.query(
        `SELECT id,title,description,priority,status,category,due_date,created_at,updated_at
         FROM tasks ${where}
         ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
                  status, created_at DESC`,
        values
      ),
      pool.query(
        `SELECT
           COUNT(*)                                                        AS total,
           COUNT(*) FILTER (WHERE status='Pending')                       AS pending,
           COUNT(*) FILTER (WHERE status='In Progress')                   AS in_progress,
           COUNT(*) FILTER (WHERE status='Completed')                     AS completed,
           COUNT(*) FILTER (WHERE due_date < NOW() AND status!='Completed') AS overdue,
           COUNT(*) FILTER (WHERE priority='High')                        AS high_priority,
           COUNT(*) FILTER (WHERE priority='Medium')                      AS medium_priority,
           COUNT(*) FILTER (WHERE priority='Low')                         AS low_priority,
           COUNT(*) FILTER (WHERE category='Work')                        AS cat_work,
           COUNT(*) FILTER (WHERE category='Study')                       AS cat_study,
           COUNT(*) FILTER (WHERE category='Personal')                    AS cat_personal,
           COUNT(*) FILTER (WHERE category='Shopping')                    AS cat_shopping,
           COUNT(*) FILTER (WHERE category='Others')                      AS cat_others
         FROM tasks ${where}`,
        values
      ),
      pool.query('SELECT name, email, created_at FROM users WHERE id=$1', [req.user.userId]),
    ]);

    const s     = statsResult.rows[0];
    const total = parseInt(s.total);
    const completed = parseInt(s.completed);

    res.json({
      user:  userResult.rows[0],
      tasks: tasksResult.rows,
      stats: {
        total,
        pending:          parseInt(s.pending),
        in_progress:      parseInt(s.in_progress),
        completed,
        overdue:          parseInt(s.overdue),
        completion_pct:   total > 0 ? Math.round((completed / total) * 100) : 0,
        by_priority: {
          High:   parseInt(s.high_priority),
          Medium: parseInt(s.medium_priority),
          Low:    parseInt(s.low_priority),
        },
        by_category: {
          Work:     parseInt(s.cat_work),
          Study:    parseInt(s.cat_study),
          Personal: parseInt(s.cat_personal),
          Shopping: parseInt(s.cat_shopping),
          Others:   parseInt(s.cat_others),
        },
      },
      generated_at: new Date().toISOString(),
      filters: { from, to, status, priority, category },
    });
  } catch (err) {
    console.error('Report error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { search = '', status, priority, category, sort = 'created_at', order = 'desc', page = 1, limit = 9 } = req.query;

  const conditions = ['user_id = $1'];
  const values = [req.user.userId];
  let idx = 2;

  if (search.trim()) {
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${search.trim()}%`); idx++;
  }
  if (status   && VALID_STATUSES.includes(status))     { conditions.push(`status = $${idx++}`);   values.push(status); }
  if (priority && VALID_PRIORITIES.includes(priority)) { conditions.push(`priority = $${idx++}`); values.push(priority); }
  if (category && VALID_CATEGORIES.includes(category)) { conditions.push(`category = $${idx++}`); values.push(category); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const priorityOrder = `CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END`;
  const safeSort  = VALID_SORT_FIELDS.includes(sort) ? sort : 'created_at';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const orderClause = sort === 'priority'
    ? `${priorityOrder} ${safeOrder}`
    : `${safeSort} ${safeOrder} NULLS LAST`;

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  try {
    const [tasks, count] = await Promise.all([
      pool.query(
        `SELECT * FROM tasks ${where} ORDER BY ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, parseInt(limit), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM tasks ${where}`, values),
    ]);
    res.json({ tasks: tasks.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, description = '', priority = 'Medium', status = 'Pending', category = 'Others', due_date = null } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
  if (!VALID_STATUSES.includes(status))    return res.status(400).json({ error: 'Invalid status' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id,title,description,priority,status,category,due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.userId, title.trim(), description.trim(), priority, status, category, due_date || null]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { title, description, priority, status, category, due_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
  if (!VALID_STATUSES.includes(status))    return res.status(400).json({ error: 'Invalid status' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1,description=$2,priority=$3,status=$4,category=$5,due_date=$6,updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title.trim(), (description||'').trim(), priority, status, category, due_date||null, req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await pool.query(
      `UPDATE tasks SET status=$1,updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *`,
      [status, req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
module.exports = router;
