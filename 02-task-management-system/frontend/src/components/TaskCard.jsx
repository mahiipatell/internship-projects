import { useState } from 'react';
import { PriorityBadge, StatusBadge, CategoryBadge, DueDateBadge, STATUSES } from './Badges';
import styles from './TaskCard.module.css';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen]           = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const isCompleted = task.status === 'Completed';

  const handleStatusChange = async (s) => {
    setStatusChanging(true); setMenuOpen(false);
    try { await onStatusChange(task.id, s); } finally { setStatusChanging(false); }
  };

  const createdAt = task.created_at
    ? new Date(task.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
    : '';

  return (
    <div className={`${styles.card} ${isCompleted?styles.cardDone:''}`}>
      {/* Top row */}
      <div className={styles.topRow}>
        <CategoryBadge category={task.category} />
        <div className={styles.actions}>
          <button
            className={`${styles.completeBtn} ${isCompleted?styles.completeDone:''}`}
            onClick={() => handleStatusChange(isCompleted?'Pending':'Completed')}
            disabled={statusChanging}
            title={isCompleted?'Mark Incomplete':'Mark Complete'}
          >
            {statusChanging
              ? <span style={{display:'inline-block',width:12,height:12,border:'2px solid var(--muted)',borderTopColor:'var(--success)',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}/>
              : '✓'}
          </button>
          <button className={styles.iconBtn} onClick={() => onEdit(task)} title="Edit">✏</button>
          <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => onDelete(task.id)} title="Delete">🗑</button>
        </div>
      </div>

      {/* Title */}
      <h3 className={`${styles.title} ${isCompleted?styles.titleDone:''}`}>{task.title}</h3>

      {/* Description */}
      {task.description && <p className={styles.desc}>{task.description}</p>}

      {/* Badges */}
      <div className={styles.badges}>
        <PriorityBadge priority={task.priority} />
        <StatusBadge   status={task.status} />
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {task.due_date
          ? <DueDateBadge dueDate={task.due_date} />
          : <span style={{fontSize:11.5,color:'var(--muted)'}}>No due date</span>}
        <span className={styles.created}>{createdAt}</span>
      </div>

      {/* Status quick-change */}
      <div className={styles.statusRow}>
        <span style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>Status:</span>
        <div style={{position:'relative'}}>
          <button className={styles.statusToggle} onClick={e => { e.stopPropagation(); setMenuOpen(o=>!o); }}>
            {task.status} ▾
          </button>
          {menuOpen && (
            <div className={styles.statusMenu} onClick={e=>e.stopPropagation()}>
              {STATUSES.filter(s=>s!==task.status).map(s => (
                <button key={s} className={styles.statusOpt} onClick={() => handleStatusChange(s)}>
                  {s==='Completed'?'✓':s==='In Progress'?'◎':'○'} {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
