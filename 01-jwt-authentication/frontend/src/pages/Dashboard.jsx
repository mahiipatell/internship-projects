import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <div className={styles.pageWrap}>
      <Navbar />
      <div className={styles.page}>

        {/* Welcome banner */}
        <div className={styles.banner}>
          <div
            className={styles.bannerAvatar}
            style={{ background: user?.avatar_color || '#6c63ff' }}
          >
            {initials}
          </div>
          <div>
            <h1 className={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className={styles.sub}>Member since {memberSince}</p>
          </div>
        </div>

        {/* Info grid */}
        <div className={styles.grid}>
          <InfoCard label="Email" value={user?.email} icon="✉" />
          <InfoCard label="Location" value={user?.location || 'Not set'} icon="📍" dim={!user?.location} />
          <InfoCard label="Phone" value={user?.phone || 'Not set'} icon="📞" dim={!user?.phone} />
          <InfoCard label="Auth method" value="JWT" icon="🔐" />
        </div>

        {/* Bio */}
        {user?.bio && (
          <div className={styles.bioCard}>
            <p className={styles.bioLabel}>Bio</p>
            <p className={styles.bioText}>{user.bio}</p>
          </div>
        )}

        {/* CTA if profile incomplete */}
        {(!user?.bio && !user?.phone && !user?.location) && (
          <div className={styles.cta}>
            <span>Your profile is looking a bit empty.</span>
            <button className={styles.ctaBtn} onClick={() => navigate('/profile')}>
              Complete profile →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, dim }) {
  return (
    <div className={styles.infoCard}>
      <span className={styles.infoIcon}>{icon}</span>
      <div>
        <p className={styles.infoLabel}>{label}</p>
        <p className={`${styles.infoValue} ${dim ? styles.dimText : ''}`}>{value}</p>
      </div>
    </div>
  );
}
