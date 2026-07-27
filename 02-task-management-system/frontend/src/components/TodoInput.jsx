import { useState } from 'react';
import styles from './TodoInput.module.css';

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#10b981' },
  { value: 'medium', label: 'Med',    color: '#f59e0b' },
  { value: 'high',   label: 'High',   color: '#ef4444' },
];

export default function TodoInput({ onAdd, error }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onAdd(title.trim(), priority);
      setTitle('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          maxLength={300}
          autoFocus
        />
        <div className={styles.priorities}>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`${styles.pBtn} ${priority === p.value ? styles.pActive : ''}`}
              style={priority === p.value ? { borderColor: p.color, color: p.color } : {}}
              onClick={() => setPriority(p.value)}
              title={`${p.label} priority`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          className={styles.addBtn}
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
        >
          {loading ? <span className={styles.spinner} /> : '+ Add'}
        </button>
      </div>
      {error && <p className={styles.error}>⚠ {error}</p>}
    </div>
  );
}
