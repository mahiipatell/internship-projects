import styles from './Loader.module.css';

export default function Loader() {
  return (
    <div className={styles.wrapper} role="status" aria-label="Loading weather data">
      <div className={styles.spinner}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>
      <p className={styles.text}>Fetching weather data…</p>
    </div>
  );
}
