import { useState, useRef, useEffect } from 'react';
import styles from './TodoItem.module.css';

const PRIORITY_META = {
  high:   { color: '#ef4444', label: 'High' },
  medium: { color: '#f59e0b', label: 'Med'  },
  low:    { color: '#10b981', label: 'Low'  },
};

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleToggle = () => {
    onToggle(todo.id, !todo.completed);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    if (editTitle.trim() === todo.title && editPriority === todo.priority) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(todo.id, { title: editTitle.trim(), priority: editPriority });
      setEditing(false);
    } catch {
      // keep editing open
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(todo.id);
  };

  const meta = PRIORITY_META[todo.priority] || PRIORITY_META.medium;
  const completedAt = todo.completed_at
    ? new Date(todo.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <li className={`${styles.item} ${todo.completed ? styles.completed : ''} ${deleting ? styles.deleting : ''}`}>
      {/* Priority bar */}
      <div className={styles.priorityBar} style={{ background: meta.color }} />

      {/* Checkbox */}
      <button
        className={`${styles.checkbox} ${todo.completed ? styles.checked : ''}`}
        onClick={handleToggle}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        style={todo.completed ? { borderColor: meta.color, background: meta.color } : {}}
      >
        {todo.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <div className={styles.content}>
        {editing ? (
          <div className={styles.editRow}>
            <input
              ref={inputRef}
              className={styles.editInput}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={300}
            />
            <div className={styles.editPriorities}>
              {Object.entries(PRIORITY_META).map(([val, m]) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.pBtn} ${editPriority === val ? styles.pActive : ''}`}
                  style={editPriority === val ? { borderColor: m.color, color: m.color } : {}}
                  onClick={() => setEditPriority(val)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSaveEdit} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className={styles.titleRow}>
            <span className={styles.title}>{todo.title}</span>
            <span
              className={styles.priorityTag}
              style={{ color: meta.color, borderColor: `${meta.color}44` }}
            >
              {meta.label}
            </span>
          </div>
        )}

        {!editing && (
          <div className={styles.meta}>
            {completedAt
              ? <span className={styles.metaText}>Completed {completedAt}</span>
              : <span className={styles.metaText}>
                  Added {new Date(todo.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
            }
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => setEditing(true)}
            title="Edit"
            aria-label="Edit task"
          >
            ✏️
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            title="Delete"
            aria-label="Delete task"
            disabled={deleting}
          >
            🗑
          </button>
        </div>
      )}
    </li>
  );
}
