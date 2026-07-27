import styles from './AirQuality.module.css';

const AQI_INFO = {
  1: { label: 'Good',      desc: 'Air quality is satisfactory.', width: '20%'  },
  2: { label: 'Fair',      desc: 'Acceptable air quality.',      width: '40%'  },
  3: { label: 'Moderate',  desc: 'May affect sensitive groups.', width: '60%'  },
  4: { label: 'Poor',      desc: 'Unhealthy for most people.',   width: '80%'  },
  5: { label: 'Very Poor', desc: 'Serious health risk.',         width: '100%' },
};

export default function AirQuality({ airQuality }) {
  if (!airQuality) return null;

  const { aqi, color, components } = airQuality;
  const info = AQI_INFO[aqi] || AQI_INFO[1];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Air Quality Index</h3>
        <span className={styles.badge} style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
          {info.label}
        </span>
      </div>

      {/* AQI bar */}
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: info.width, background: color }}
        />
      </div>
      <p className={styles.desc}>{info.desc}</p>

      {/* Pollutant grid */}
      <div className={styles.grid}>
        <Pollutant label="PM2.5"  value={components.pm2_5} unit="μg/m³" />
        <Pollutant label="PM10"   value={components.pm10}  unit="μg/m³" />
        <Pollutant label="O₃"     value={components.o3}    unit="μg/m³" />
        <Pollutant label="NO₂"    value={components.no2}   unit="μg/m³" />
      </div>
    </div>
  );
}

function Pollutant({ label, value, unit }) {
  return (
    <div className={styles.pollutant}>
      <p className={styles.pollutantVal}>{Math.round(value)}</p>
      <p className={styles.pollutantLabel}>{label}</p>
      <p className={styles.pollutantUnit}>{unit}</p>
    </div>
  );
}
