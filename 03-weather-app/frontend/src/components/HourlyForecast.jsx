import styles from './HourlyForecast.module.css';

const formatHour = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function HourlyForecast({ hourly, displayTemp, displayWind }) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Today's Hourly Forecast</h3>
      <div className={styles.strip}>
        {hourly.map((entry, i) => (
          <div key={i} className={`${styles.slot} ${i === 0 ? styles.slotNow : ''}`}>
            <p className={styles.time}>{i === 0 ? 'Now' : formatHour(entry.time)}</p>
            <img
              src={entry.weather.iconUrl}
              alt={entry.weather.description}
              className={styles.icon}
            />
            <p className={styles.temp}>{displayTemp(entry.temperature)}</p>
            {entry.pop > 0 && (
              <p className={styles.pop}>💧 {entry.pop}%</p>
            )}
            <p className={styles.wind}>{displayWind(entry.windSpeed)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
