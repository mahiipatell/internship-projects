const base = {
  display:'inline-flex',alignItems:'center',padding:'3px 10px',
  borderRadius:100,fontSize:12,fontWeight:600,whiteSpace:'nowrap',letterSpacing:'0.02em',
};

const P = { High:{c:'var(--priority-high)',bg:'var(--priority-high-dim)'}, Medium:{c:'var(--priority-medium)',bg:'var(--priority-medium-dim)'}, Low:{c:'var(--priority-low)',bg:'var(--priority-low-dim)'} };
const S = { 'Pending':{c:'var(--status-pending)',bg:'var(--status-pending-dim)'}, 'In Progress':{c:'var(--status-progress)',bg:'var(--status-progress-dim)'}, 'Completed':{c:'var(--status-completed)',bg:'var(--status-completed-dim)'} };
const C = { Work:'var(--cat-work)',Study:'var(--cat-study)',Personal:'var(--cat-personal)',Shopping:'var(--cat-shopping)',Others:'var(--cat-others)' };
const CICONS = { Work:'💼',Study:'📚',Personal:'🧘',Shopping:'🛒',Others:'📌' };

export function PriorityBadge({ priority }) {
  const s = P[priority] || P.Medium;
  const arrow = priority==='High'?'↑':priority==='Low'?'↓':'→';
  return <span style={{...base,color:s.c,background:s.bg,border:`1px solid ${s.c}33`}}>{arrow} {priority}</span>;
}

export function StatusBadge({ status }) {
  const s = S[status] || S['Pending'];
  const icon = status==='Completed'?'✓':status==='In Progress'?'◎':'○';
  return <span style={{...base,color:s.c,background:s.bg,border:`1px solid ${s.c}33`}}>{icon} {status}</span>;
}

export function CategoryBadge({ category }) {
  const color = C[category] || C.Others;
  return (
    <span style={{...base,color,background:`${color}18`,border:`1px solid ${color}33`,gap:4}}>
      <span style={{fontSize:11}}>{CICONS[category]||'📌'}</span>{category}
    </span>
  );
}

export function DueDateBadge({ dueDate }) {
  if (!dueDate) return null;
  const date  = new Date(dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = date < today;
  const isToday   = date.toDateString() === today.toDateString();
  const isSoon    = date <= new Date(today.getTime() + 3*24*60*60*1000);
  const label = date.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  const color = isOverdue ? 'var(--error)' : (isToday||isSoon) ? 'var(--warning)' : 'var(--muted)';
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color,fontWeight:500}}>
      {isOverdue?'⚠ ':'📅 '}{label}{isOverdue?' Overdue':isToday?' Today':''}
    </span>
  );
}

export const PRIORITIES = ['High','Medium','Low'];
export const STATUSES   = ['Pending','In Progress','Completed'];
export const CATEGORIES = ['Work','Study','Personal','Shopping','Others'];
