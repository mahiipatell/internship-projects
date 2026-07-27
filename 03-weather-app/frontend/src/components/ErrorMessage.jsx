import styles from './ErrorMessage.module.css';

export default function ErrorMessage({ message }) {
  return (
    <div className={styles.wrapper} role="alert">
      <span className={styles.icon}>⚠️</span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
