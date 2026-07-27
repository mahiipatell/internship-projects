import styles from './UnitToggle.module.css';

export default function UnitToggle({ unit, onToggle }) {
  return (
    <button
      className={styles.toggle}
      onClick={onToggle}
      title={`Switch to °${unit === 'C' ? 'F' : 'C'}`}
      aria-label="Toggle temperature unit"
    >
      <span className={unit === 'C' ? styles.active : styles.inactive}>°C</span>
      <span className={styles.sep}>|</span>
      <span className={unit === 'F' ? styles.active : styles.inactive}>°F</span>
    </button>
  );
}
