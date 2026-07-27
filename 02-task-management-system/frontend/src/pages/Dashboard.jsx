import { useAuth } from '../context/AuthContext';
import { useTaskStats } from '../hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { PriorityBadge, StatusBadge, CategoryBadge, DueDateBadge } from '../components/Badges';
import { useState } from 'react';
import ReportModal from '../components/ReportModal';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { stats, recent, upcoming, loading } = useTaskStats();
  const [reportOpen, setReportOpen] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour<12 ? 'Good morning' : hour<17 ? 'Good afternoon' : 'Good evening';
  const initials = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';

  const CARDS = stats ? [
    { label:'Total Tasks',    value:stats.total,         icon:'📋', color:'var(--accent)',          bg:'var(--accent-dim)'         },
    { label:'Pending',        value:stats.pending,       icon:'○',  color:'var(--status-pending)',  bg:'var(--status-pending-dim)' },
    { label:'In Progress',    value:stats.in_progress,   icon:'◎',  color:'var(--status-progress)', bg:'var(--status-progress-dim)'},
    { label:'Completed',      value:stats.completed,     icon:'✓',  color:'var(--status-completed)',bg:'var(--status-completed-dim)'},
    { label:'Overdue',        value:stats.overdue,       icon:'⚠',  color:'var(--error)',           bg:'var(--error-dim)'          },
    { label:'High Priority',  value:stats.high_priority, icon:'↑',  color:'var(--priority-high)',   bg:'var(--priority-high-dim)'  },
  ] : [];

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <div className={styles.avatar} style={{ background: user?.avatar_color||'var(--accent)' }}>{initials}</div>
            <div>
              <p className={styles.greeting}>{greeting},</p>
              <h1 className={styles.name}>{firstName} 👋</h1>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button
              onClick={() => setReportOpen(true)}
              style={{background:'transparent',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 16px',color:'var(--text-2)',fontSize:14,fontWeight:500,cursor:'pointer',transition:'all var(--transition)',whiteSpace:'nowrap'}}
              onMouseOver={e=>{e.target.style.borderColor='var(--accent)';e.target.style.color='var(--accent)'}}
              onMouseOut={e=>{e.target.style.borderColor='var(--border)';e.target.style.color='var(--text-2)'}}
            >⬇ Report</button>
            <button className={styles.newBtn} onClick={() => navigate('/tasks?new=1')}>+ New Task</button>
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className={styles.grid6}>{[...Array(6)].map((_,i)=><div key={i} className={styles.skeleton}/>)}</div>
        ) : (
          <div className={styles.grid6}>
            {CARDS.map(({label,value,icon,color,bg}) => (
              <div key={label} className={styles.statCard} onClick={() => navigate('/tasks')}>
                <div className={styles.statIcon} style={{color,background:bg}}>{icon}</div>
                <div>
                  <p className={styles.statVal}>{value}</p>
                  <p className={styles.statLabel}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {stats && (
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.sectionTitle}>Overall Completion</span>
              <span className={styles.progressPct}>{stats.completion_pct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{width:`${stats.completion_pct}%`}}/>
            </div>
            <p className={styles.progressSub}>{stats.completed} of {stats.total} tasks completed</p>
          </div>
        )}

        {/* Recent + Upcoming */}
        <div className={styles.grid2}>
          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
              <button className={styles.viewAll} onClick={() => navigate('/tasks')}>View all</button>
            </div>
            {loading ? <Skeletons/> : recent.length===0 ? <Empty msg="No tasks yet. Create your first!"/> : (
              <ul className={styles.list}>
                {recent.map(t => (
                  <li key={t.id} className={styles.listItem}>
                    <div className={styles.listLeft}>
                      <p className={styles.listTitle}>{t.title}</p>
                      <CategoryBadge category={t.category}/>
                    </div>
                    <StatusBadge status={t.status}/>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>Upcoming (7 days)</h3>
              <button className={styles.viewAll} onClick={() => navigate('/tasks')}>View all</button>
            </div>
            {loading ? <Skeletons/> : upcoming.length===0 ? <Empty msg="No upcoming tasks this week."/> : (
              <ul className={styles.list}>
                {upcoming.map(t => (
                  <li key={t.id} className={styles.listItem}>
                    <div className={styles.listLeft}>
                      <p className={styles.listTitle}>{t.title}</p>
                      <DueDateBadge dueDate={t.due_date}/>
                    </div>
                    <PriorityBadge priority={t.priority}/>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} />}
    </AppLayout>
  );
}

const Skeletons = () => (
  <div style={{display:'flex',flexDirection:'column',gap:8}}>
    {[...Array(4)].map((_,i)=><div key={i} style={{height:48,background:'var(--surface-2)',borderRadius:'var(--radius-sm)',animation:'pulse 1.4s ease infinite'}}/>)}
  </div>
);

const Empty = ({msg}) => (
  <div style={{padding:'32px 0',textAlign:'center',color:'var(--muted)',fontSize:13}}>{msg}</div>
);
