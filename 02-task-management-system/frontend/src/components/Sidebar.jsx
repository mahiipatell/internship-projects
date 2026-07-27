import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

const NAV = [
  { to:'/dashboard', icon:'▦', label:'Dashboard' },
  { to:'/tasks',     icon:'✔', label:'My Tasks'  },
  { to:'/profile',   icon:'◉', label:'Profile'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>⬡</div>
        <span className={styles.brandName}>TaskFlow</span>
      </div>
      <nav className={styles.nav}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
            <span className={styles.navIcon}>{icon}</span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{flex:1}} />
      <div className={styles.userSection}>
        <div className={styles.avatar} style={{ background: user?.avatar_color||'var(--accent)' }}>
          {initials}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user?.name}</p>
          <p className={styles.userEmail}>{user?.email}</p>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">⏻</button>
      </div>
    </aside>
  );
}
