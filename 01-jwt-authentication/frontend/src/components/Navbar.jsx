import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.logo}>⬡</span>
        <span className={styles.brandName}>AuthApp</span>
      </div>

      <div className={styles.links}>
        <Link
          to="/dashboard"
          className={`${styles.link} ${location.pathname === '/dashboard' ? styles.active : ''}`}
        >
          Dashboard
        </Link>
        <Link
          to="/profile"
          className={`${styles.link} ${location.pathname === '/profile' ? styles.active : ''}`}
        >
          Profile
        </Link>
      </div>

      <div className={styles.right}>
        <div
          className={styles.avatar}
          style={{ background: user?.avatar_color || '#6c63ff' }}
          title={user?.name}
        >
          {initials}
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
