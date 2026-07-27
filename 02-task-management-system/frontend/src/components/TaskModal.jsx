import { useState, useEffect, useRef } from 'react';
import { PRIORITIES, STATUSES, CATEGORIES } from './Badges';
import styles from './TaskModal.module.css';

const EMPTY = { title:'', description:'', priority:'Medium', status:'Pending', category:'Others', due_date:'' };

export default function TaskModal({ task, onSave, onClose, loading }) {
  const isEdit = !!task;
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    setForm(task ? {
      title:       task.title||'',
      description: task.description||'',
      priority:    task.priority||'Medium',
      status:      task.status||'Pending',
      category:    task.category||'Others',
      due_date:    task.due_date ? task.due_date.slice(0,10) : '',
    } : EMPTY);
    setErrors({});
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [task]);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (f) => (e) => { setForm(p=>({...p,[f]:e.target.value})); if(errors[f]) setErrors(p=>({...p,[f]:''})); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.trim().length > 200) e.title = 'Max 200 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await onSave({ ...form, title: form.title.trim(), description: form.description.trim() });
  };

  const sel = (label) => (
    <span style={{fontSize:11.5,fontWeight:500,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>
      {label}
    </span>
  );

  return (
    <div className={styles.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            {sel('Title *')}
            <input ref={titleRef} className={`${styles.input} ${errors.title?styles.inputErr:''}`}
              value={form.title} onChange={set('title')} placeholder="What needs to be done?" maxLength={200} />
            {errors.title && <p className={styles.fieldErr}>{errors.title}</p>}
          </div>
          <div className={styles.field}>
            {sel('Description')}
            <textarea className={`${styles.input} ${styles.textarea}`}
              value={form.description} onChange={set('description')}
              placeholder="Add more details…" rows={3} maxLength={1000} />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              {sel('Priority')}
              <select className={styles.select} value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              {sel('Status')}
              <select className={styles.select} value={form.status} onChange={set('status')}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              {sel('Category')}
              <select className={styles.select} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              {sel('Due Date')}
              <input type="date" className={styles.input} value={form.due_date} onChange={set('due_date')} />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? <span className="spinner"/> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
