import { useWeather }        from '../hooks/useWeather';
import { useUnits }          from '../hooks/useUnits';
import { useRecentSearches } from '../hooks/useRecentSearches';

import Header          from '../components/Header';
import SearchBar       from '../components/SearchBar';
import UnitToggle      from '../components/UnitToggle';
import WeatherCard     from '../components/WeatherCard';
import HourlyForecast  from '../components/HourlyForecast';
import ForecastCard    from '../components/ForecastCard';
import AirQuality      from '../components/AirQuality';
import Loader          from '../components/Loader';
import ErrorMessage    from '../components/ErrorMessage';
import EmptyState      from '../components/EmptyState';

import styles from './WeatherPage.module.css';

export default function WeatherPage() {
  const { weather, forecast, loading, error, search } = useWeather();
  const { unit, toggleUnit, displayTemp, displayWind } = useUnits();
  const { recents, addRecent, removeRecent, clearAll }  = useRecentSearches();

  // Wrap search to also save to recents
  const handleSearch = (city) => {
    addRecent(city);
    search(city);
  };

  const showEmpty   = !loading && !error && !weather;
  const showWeather = !loading && !error && weather;

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        {/* Top bar: header + unit toggle */}
        <div className={styles.topBar}>
          <Header />
          {showWeather && (
            <div className={styles.toggleWrap}>
              <UnitToggle unit={unit} onToggle={toggleUnit} />
            </div>
          )}
        </div>

        {/* Search with autocomplete + recents */}
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          recents={recents}
          onRemoveRecent={removeRecent}
          onClearRecents={clearAll}
        />

        {loading   && <Loader />}
        {error     && <ErrorMessage message={error} />}
        {showEmpty && <EmptyState onSearch={handleSearch} />}

        {showWeather && (
          <>
            <WeatherCard
              weather={weather}
              displayTemp={displayTemp}
              displayWind={displayWind}
            />
            <HourlyForecast
              hourly={weather.hourly}
              displayTemp={displayTemp}
              displayWind={displayWind}
            />
            <AirQuality airQuality={weather.airQuality} />
            <ForecastCard
              forecast={forecast}
              displayTemp={displayTemp}
            />
          </>
        )}

      </div>
      <div className={styles.overlay} />
    </div>
  );
}
