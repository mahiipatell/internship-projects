import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import styles from './Profile.module.css';

const AVATAR_COLORS = [
  '#6c63ff', '#e05c97', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
];

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Profile form
  const [form, setForm] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    avatar_color: '#6c63ff',
  });

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Populate form from user context
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        avatar_color: user.avatar_color || '#6c63ff',
      });
    }
  }, [user]);

  // ─── Profile save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      setSaveError('Name cannot be empty');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save');
        return;
      }

      updateUser(data.user);
      setSaveSuccess('Profile saved!');
      setEditing(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch {
      setSaveError('Unable to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // reset form to current user values
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || '',
      avatar_color: user.avatar_color || '#6c63ff',
    });
    setSaveError('');
    setEditing(false);
  };

  // ─── Password change ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All fields are required');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Failed to change password');
        return;
      }

      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setPwSuccess(''); setShowPwSection(false); }, 3000);
    } catch {
      setPwError('Unable to connect to server');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const displayColor = editing ? form.avatar_color : (user?.avatar_color || '#6c63ff');

  return (
    <div className={styles.pageWrap}>
      <Navbar />

      <div className={styles.page}>
        <div className={styles.container}>

          {/* ── Profile card ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile</h2>
              {!editing && (
                <button className={styles.editBtn} onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
            </div>

            {/* Avatar */}
            <div className={styles.avatarRow}>
              <div
                className={styles.avatarBig}
                style={{ background: displayColor }}
              >
                {initials}
              </div>

              {editing && (
                <div className={styles.colorSection}>
                  <p className={styles.colorLabel}>Avatar color</p>
                  <div className={styles.colorGrid}>
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`${styles.colorSwatch} ${form.avatar_color === color ? styles.colorSelected : ''}`}
                        style={{ background: color }}
                        onClick={() => setForm((f) => ({ ...f, avatar_color: color }))}
                        aria-label={`Pick color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className={styles.fields}>
              <Field
                label="Full name"
                value={editing ? form.name : user?.name}
                editing={editing}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Your name"
              />
              <Field
                label="Email"
                value={user?.email}
                editing={false}
                hint="Email cannot be changed"
              />
              <Field
                label="Bio"
                value={editing ? form.bio : user?.bio}
                editing={editing}
                onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                placeholder="A short bio about yourself..."
                multiline
              />
              <div className={styles.row2}>
                <Field
                  label="Phone"
                  value={editing ? form.phone : user?.phone}
                  editing={editing}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  placeholder="+91 98765 43210"
                />
                <Field
                  label="Location"
                  value={editing ? form.location : user?.location}
                  editing={editing}
                  onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                  placeholder="City, Country"
                />
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Member since</span>
                <span className={styles.fieldValue}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>

            {/* Feedback */}
            {saveError && <div className={styles.error}>⚠ {saveError}</div>}
            {saveSuccess && <div className={styles.success}>✓ {saveSuccess}</div>}

            {/* Actions */}
            {editing && (
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <span className={styles.spinner} /> : 'Save changes'}
                </button>
              </div>
            )}
          </div>

          {/* ── Change password card ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Security</h2>
              <button
                className={styles.editBtn}
                onClick={() => { setShowPwSection((p) => !p); setPwError(''); setPwSuccess(''); }}
              >
                {showPwSection ? 'Hide' : 'Change password'}
              </button>
            </div>

            {!showPwSection && (
              <p className={styles.securityHint}>
                Your password was last set when you created your account. Use a strong, unique password.
              </p>
            )}

            {showPwSection && (
              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Current password</label>
                  <div className={styles.pwWrapper}>
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="••••••••"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowCurrentPw((p) => !p)}
                    >{showCurrentPw ? '🙈' : '👁'}</button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>New password</label>
                  <div className={styles.pwWrapper}>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Min. 6 characters"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowNewPw((p) => !p)}
                    >{showNewPw ? '🙈' : '👁'}</button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Confirm new password</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Repeat new password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>

                {pwError && <div className={styles.error}>⚠ {pwError}</div>}
                {pwSuccess && <div className={styles.success}>✓ {pwSuccess}</div>}

                <div className={styles.actions}>
                  <button
                    className={styles.saveBtn}
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                  >
                    {pwSaving ? <span className={styles.spinner} /> : 'Update password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field sub-component ───────────────────────────────────────────────────────
function Field({ label, value, editing, onChange, placeholder, multiline, hint }) {
  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}{hint && <span className={styles.hint}> · {hint}</span>}</span>
      {editing && onChange ? (
        multiline ? (
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            type="text"
            className={styles.input}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <span className={`${styles.fieldValue} ${!value ? styles.empty : ''}`}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}
