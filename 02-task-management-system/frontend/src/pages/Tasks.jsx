import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';
import { PRIORITIES, STATUSES, CATEGORIES } from '../components/Badges';
import ReportModal from '../components/ReportModal';
import styles from './Tasks.module.css';

const SORT_OPTIONS = [
  { value:'created_at|desc', label:'Newest First' },
  { value:'created_at|asc',  label:'Oldest First' },
  { value:'due_date|asc',    label:'Due Date ↑'   },
  { value:'due_date|desc',   label:'Due Date ↓'   },
  { value:'priority|asc',    label:'Priority ↑'   },
];
const LIMIT = 9;

export default function Tasks() {
  const [searchParams]  = useSearchParams();
  const toast           = useToast();

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [sort,     setSort]     = useState('created_at|desc');
  const [page,     setPage]     = useState(1);

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [reportOpen,  setReportOpen]  = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [status, priority, category, sort]);

  useEffect(() => {
    if (searchParams.get('new')==='1') { setEditingTask(null); setModalOpen(true); }
  }, [searchParams]);

  const [sortField, sortOrder] = sort.split('|');
  const filters = { search:debouncedSearch, status, priority, category, sort:sortField, order:sortOrder, page, limit:LIMIT };
  const { tasks, total, loading, error, createTask, updateTask, updateStatus, deleteTask } = useTasks(filters);

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = search || status || priority || category;

  const clearFilters = () => { setSearch(''); setStatus(''); setPriority(''); setCategory(''); };

  const handleSave = useCallback(async (form) => {
    setSaving(true);
    try {
      if (editingTask) { await updateTask(editingTask.id, form); toast.success('Task updated'); }
      else             { await createTask(form);                 toast.success('Task created'); }
      setModalOpen(false); setEditingTask(null);
    } catch (err) { toast.error(err.message || 'Failed to save task'); }
    finally { setSaving(false); }
  }, [editingTask, createTask, updateTask, toast]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try { await updateStatus(id, newStatus); toast.success(`Marked as ${newStatus}`); }
    catch (err) { toast.error(err.message || 'Failed to update'); }
  }, [updateStatus, toast]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try { await deleteTask(id); toast.success('Task deleted'); }
    catch (err) { toast.error(err.message || 'Failed to delete'); }
  }, [deleteTask, toast]);

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>My Tasks</h1>
            <p className={styles.pageSub}>{loading ? 'Loading…' : `${total} task${total!==1?'s':''} total`}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className={styles.reportBtn} onClick={() => setReportOpen(true)}>⬇ Report</button>
            <button className={styles.newBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>+ New Task</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input className={styles.searchInput} placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className={styles.clearSearch} onClick={()=>setSearch('')}>✕</button>}
          </div>
          <div className={styles.filters}>
            <select className={styles.filter} value={status}   onChange={e=>setStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <select className={styles.filter} value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select>
            <select className={styles.filter} value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <select className={styles.filter} value={sort} onChange={e=>setSort(e.target.value)}>
              {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hasFilters && <button className={styles.clearFilters} onClick={clearFilters}>✕ Clear</button>}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>{[...Array(6)].map((_,i)=><div key={i} className={styles.skeletonCard}/>)}</div>
        ) : error ? (
          <div className={styles.errorState}>⚠ {error}</div>
        ) : tasks.length===0 ? (
          <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} onNew={()=>{ setEditingTask(null); setModalOpen(true); }}/>
        ) : (
          <div className={styles.grid}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task}
                onEdit={t => { setEditingTask(t); setModalOpen(true); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <div className={styles.pageNums}>
              {[...Array(totalPages)].map((_,i)=>(
                <button key={i} className={`${styles.pageNum} ${page===i+1?styles.pageActive:''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
            </div>
            <button className={styles.pageBtn} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </div>

      {modalOpen && (
        <TaskModal task={editingTask} onSave={handleSave} onClose={()=>{ setModalOpen(false); setEditingTask(null); }} loading={saving}/>
      )}
      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} />}
    </AppLayout>
  );
}

function EmptyState({ hasFilters, onClear, onNew }) {
  const btnStyle = { background:'var(--accent)',border:'none',borderRadius:'var(--radius-sm)',padding:'10px 22px',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer' };
  return (
    <div style={{textAlign:'center',padding:'80px 20px',color:'var(--muted)'}}>
      <div style={{fontSize:48,marginBottom:16}}>{hasFilters?'🔍':'📋'}</div>
      <p style={{fontSize:16,fontWeight:600,color:'var(--text-2)',marginBottom:8}}>
        {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
      </p>
      <p style={{fontSize:13,marginBottom:24}}>
        {hasFilters ? 'Try adjusting or clearing your filters.' : 'Create your first task to get started.'}
      </p>
      {hasFilters ? <button onClick={onClear} style={btnStyle}>Clear Filters</button>
                  : <button onClick={onNew}  style={btnStyle}>+ Create Task</button>}
    </div>
  );
}
