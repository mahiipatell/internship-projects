import { useLocalClock } from '../hooks/useLocalClock';
import styles from './LiveClock.module.css';

export default function LiveClock({ timezoneOffset, city }) {
  const time = useLocalClock(timezoneOffset);
  if (!time) return null;

  return (
    <div className={styles.clock}>
      <span className={styles.icon}>🕐</span>
      <div>
        <p className={styles.time}>{time}</p>
        <p className={styles.label}>Local time in {city}</p>
      </div>
    </div>
  );
}
