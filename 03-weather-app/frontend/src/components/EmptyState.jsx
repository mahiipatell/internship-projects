import styles from './EmptyState.module.css';

const SUGGESTIONS = ['Mumbai', 'London', 'Tokyo', 'New York', 'Paris', 'Sydney'];

export default function EmptyState({ onSearch }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.globe}>🌍</div>
      <h2 className={styles.heading}>Search for a city to get started</h2>
      <p className={styles.sub}>Get real-time weather conditions for any city in the world</p>
      <div className={styles.suggestions}>
        <p className={styles.suggestLabel}>Try searching for:</p>
        <div className={styles.chips}>
          {SUGGESTIONS.map((city) => (
            <button
              key={city}
              className={styles.chip}
              onClick={() => onSearch(city)}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
