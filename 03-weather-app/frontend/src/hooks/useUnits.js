import { useState, useCallback } from 'react';

// Converts a Celsius value to Fahrenheit
export const toF = (c) => Math.round((c * 9) / 5 + 32);

// Converts km/h to mph
export const toMph = (kmh) => Math.round(kmh * 0.621371);

export function useUnits() {
  const [unit, setUnit] = useState('C'); // 'C' or 'F'

  const toggleUnit = useCallback(() => {
    setUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  }, []);

  // Convert a temperature value based on current unit
  const displayTemp = useCallback((celsius) => {
    if (celsius == null) return '—';
    return unit === 'C' ? `${celsius}°C` : `${toF(celsius)}°F`;
  }, [unit]);

  // Convert wind speed based on current unit
  const displayWind = useCallback((kmh) => {
    if (kmh == null) return '—';
    return unit === 'C' ? `${kmh} km/h` : `${toMph(kmh)} mph`;
  }, [unit]);

  return { unit, toggleUnit, displayTemp, displayWind };
}
