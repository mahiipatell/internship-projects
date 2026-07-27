import styles from './ForecastCard.module.css';

const formatDay = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' });

const formatDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function ForecastCard({ forecast, displayTemp }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>5-Day Forecast</h3>
      <div className={styles.strip}>
        {forecast.map((day) => (
          <div key={day.date} className={styles.dayCard}>
            <p className={styles.dayName}>{formatDay(day.date)}</p>
            <p className={styles.dayDate}>{formatDate(day.date)}</p>
            <img src={day.weather.iconUrl} alt={day.weather.description} className={styles.icon} />
            <p className={styles.desc}>{day.weather.main}</p>
            <div className={styles.temps}>
              <span className={styles.tempMax}>↑{displayTemp(day.temperature.max)}</span>
              <span className={styles.tempMin}>↓{displayTemp(day.temperature.min)}</span>
            </div>
            <div className={styles.wind}>💨 {day.windSpeed} km/h</div>
          </div>
        ))}
      </div>
    </div>
  );
}
