import { useState, useEffect, useRef, useCallback } from 'react';
import { searchCities } from '../services/weatherApi';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch, loading, recents, onRemoveRecent, onClearRecents }) {
  const [input,       setInput]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [fetching,    setFetching]    = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced city autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.trim().length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const results = await searchCities(input.trim());
        setSuggestions(results);
        setShowDrop(true);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setFetching(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [input]);

  const handleSelect = useCallback((cityLabel) => {
    // Extract just the city name (before first comma)
    const cityName = cityLabel.split(',')[0].trim();
    setInput(cityLabel);
    setSuggestions([]);
    setShowDrop(false);
    onSearch(cityName);
  }, [onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      handleSelect(suggestions[activeIdx].label);
    } else {
      const cityName = input.split(',')[0].trim();
      setSuggestions([]);
      setShowDrop(false);
      onSearch(cityName);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDrop || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowDrop(false);
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) setShowDrop(true);
  };

  const showRecents = !input && recents && recents.length > 0;

  return (
    <div className={styles.container} ref={wrapRef}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <div className={styles.inputWrap}>
          <span className={styles.searchIcon}>
            {fetching ? <span className={styles.miniSpinner} /> : '🔍'}
          </span>
          <input
            className={styles.input}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowDrop(true); }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search for a city... (e.g. Mumbai, London, New York)"
            aria-label="City name"
            aria-autocomplete="list"
            aria-expanded={showDrop}
            autoComplete="off"
            autoFocus
            disabled={loading}
          />
          {input && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setInput(''); setSuggestions([]); setShowDrop(false); }}
              aria-label="Clear"
            >✕</button>
          )}
        </div>
        <button
          type="submit"
          className={styles.searchBtn}
          disabled={loading || !input.trim()}
        >
          {loading ? <span className={styles.btnSpinner} /> : 'Search'}
        </button>
      </form>

      {/* ── Autocomplete dropdown ── */}
      {showDrop && suggestions.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((city, i) => (
            <li
              key={`${city.lat}-${city.lon}`}
              className={`${styles.dropItem} ${activeIdx === i ? styles.dropItemActive : ''}`}
              onMouseDown={() => handleSelect(city.label)}
              role="option"
              aria-selected={activeIdx === i}
            >
              <span className={styles.dropIcon}>📍</span>
              <div>
                <span className={styles.dropCity}>{city.name}</span>
                {city.state && <span className={styles.dropState}>, {city.state}</span>}
                <span className={styles.dropCountry}> {city.country}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Recent searches ── */}
      {showRecents && (
        <div className={styles.recentsWrap}>
          <div className={styles.recentsHeader}>
            <span className={styles.recentsLabel}>Recent Searches</span>
            <button className={styles.clearAllBtn} onClick={onClearRecents}>Clear all</button>
          </div>
          <div className={styles.recentChips}>
            {recents.map((city) => (
              <div key={city} className={styles.recentChip}>
                <button
                  className={styles.recentCityBtn}
                  onClick={() => onSearch(city)}
                >
                  🕐 {city}
                </button>
                <button
                  className={styles.recentRemoveBtn}
                  onClick={() => onRemoveRecent(city)}
                  aria-label={`Remove ${city}`}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
