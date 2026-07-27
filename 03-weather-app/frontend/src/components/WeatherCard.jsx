import { useLocalClock } from '../hooks/useLocalClock';
import styles from './WeatherCard.module.css';

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatSunTime = (isoString, offsetSeconds) => {
  const utcMs   = new Date(isoString).getTime();
  const localMs = utcMs + offsetSeconds * 1000;
  return new Date(localMs).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const getWindDirection = (deg) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
};

export default function WeatherCard({ weather, displayTemp, displayWind }) {
  const { city, country, temperature, weather: w, details, sun, timezone, timestamp } = weather;

  const localTime = useLocalClock(timezone);

  return (
    <div className={styles.card}>

      {/* ── City + live clock ── */}
      <div className={styles.location}>
        <h2 className={styles.cityName}>
          {city}, <span className={styles.country}>{country}</span>
        </h2>
        <p className={styles.date}>{formatDate(timestamp)}</p>
        {localTime && (
          <div className={styles.clockRow}>
            <span className={styles.clockIcon}>🕐</span>
            <span className={styles.clockTime}>{localTime}</span>
            <span className={styles.clockLabel}>local time</span>
          </div>
        )}
      </div>

      {/* ── Icon + Temperature ── */}
      <div className={styles.mainInfo}>
        <div className={styles.iconWrap}>
          <img src={w.iconUrl} alt={w.description} className={styles.weatherIcon} />
        </div>
        <div className={styles.tempBlock}>
          <span className={styles.temperature}>{displayTemp(temperature.current)}</span>
          <span className={styles.description}>{w.description}</span>
          <span className={styles.feelsLike}>Feels like {displayTemp(temperature.feelsLike)}</span>
        </div>
      </div>

      {/* ── Min / Max ── */}
      <div className={styles.minMax}>
        <span>↑ {displayTemp(temperature.max)}</span>
        <span className={styles.divider}>|</span>
        <span>↓ {displayTemp(temperature.min)}</span>
      </div>

      {/* ── Detail grid ── */}
      <div className={styles.detailGrid}>
        <DetailItem icon="💧" label="Humidity"    value={`${details.humidity}%`} />
        <DetailItem icon="🌬"  label="Wind"        value={`${displayWind(details.windSpeed)} ${getWindDirection(details.windDeg)}`} />
        <DetailItem icon="🔵" label="Pressure"    value={`${details.pressure} hPa`} />
        <DetailItem icon="☁️" label="Cloud Cover" value={`${details.cloudiness}%`} />
        {details.visibility !== null && (
          <DetailItem icon="👁" label="Visibility" value={`${details.visibility} km`} />
        )}
        <DetailItem icon="🌅" label="Sunrise" value={formatSunTime(sun.sunrise, timezone)} />
        <DetailItem icon="🌇" label="Sunset"  value={formatSunTime(sun.sunset,  timezone)} />
      </div>

    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailIcon}>{icon}</span>
      <div>
        <p className={styles.detailLabel}>{label}</p>
        <p className={styles.detailValue}>{value}</p>
      </div>
    </div>
  );
}
