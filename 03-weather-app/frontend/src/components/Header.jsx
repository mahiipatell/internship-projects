import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⛅</span>
        <h1 className={styles.logoText}>WeatherNow</h1>
      </div>
      <p className={styles.tagline}>Real-time weather for any city in the world</p>
    </header>
  );
}
