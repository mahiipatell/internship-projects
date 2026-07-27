const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/profile', async (req, res) => {
  try {
    const [userResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT id,name,email,bio,phone,location,avatar_color,created_at FROM users WHERE id=$1`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT
           COUNT(*)                                      AS total_tasks,
           COUNT(*) FILTER (WHERE status='Completed')   AS completed_tasks,
           COUNT(*) FILTER (WHERE status='Pending')     AS pending_tasks
         FROM tasks WHERE user_id=$1`,
        [req.user.userId]
      ),
    ]);
    if (!userResult.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];
    const s    = statsResult.rows[0];
    const total     = parseInt(s.total_tasks);
    const completed = parseInt(s.completed_tasks);
    res.json({
      user: {
        ...user,
        task_stats: {
          total_tasks:      total,
          completed_tasks:  completed,
          pending_tasks:    parseInt(s.pending_tasks),
          productivity_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      },
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/profile', async (req, res) => {
  const { name, bio, phone, location, avatar_color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1,bio=$2,phone=$3,location=$4,avatar_color=$5
       WHERE id=$6
       RETURNING id,name,email,bio,phone,location,avatar_color,created_at`,
      [name.trim(),(bio||'').trim(),(phone||'').trim(),(location||'').trim(),avatar_color||'#6c63ff',req.user.userId]
    );
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  if (currentPassword === newPassword)
    return res.status(400).json({ error: 'New password must differ from current' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.userId]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
