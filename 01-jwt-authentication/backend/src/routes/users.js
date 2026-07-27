const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes here require authentication
router.use(authenticateToken);

// ─── GET /api/users/profile ──────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, bio, phone, location, avatar_color, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/users/profile ────────────────────────────────────────────────
router.patch('/profile', async (req, res) => {
  const { name, bio, phone, location, avatar_color } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, bio = $2, phone = $3, location = $4, avatar_color = $5
       WHERE id = $6
       RETURNING id, name, email, bio, phone, location, avatar_color, created_at`,
      [
        name.trim(),
        (bio || '').trim(),
        (phone || '').trim(),
        (location || '').trim(),
        avatar_color || '#6c63ff',
        req.user.userId,
      ]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/users/change-password ────────────────────────────────────────
router.patch('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from current password' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
