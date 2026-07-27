import { useState, useCallback } from 'react';

const STORAGE_KEY = 'weather_recent_searches';
const MAX_ITEMS   = 6;

export function useRecentSearches() {
  const [recents, setRecents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const addRecent = useCallback((city) => {
    setRecents((prev) => {
      // Move to top if already exists, otherwise prepend
      const filtered = prev.filter((c) => c.toLowerCase() !== city.toLowerCase());
      const updated  = [city, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeRecent = useCallback((city) => {
    setRecents((prev) => {
      const updated = prev.filter((c) => c !== city);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecents([]);
  }, []);

  return { recents, addRecent, removeRecent, clearAll };
}
