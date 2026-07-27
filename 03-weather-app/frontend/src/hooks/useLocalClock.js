import { useState, useEffect } from 'react';

// Ticks every second and returns the current time in the city's timezone offset
export function useLocalClock(timezoneOffsetSeconds) {
  const [time, setTime] = useState('');

  useEffect(() => {
    if (timezoneOffsetSeconds == null) { setTime(''); return; }

    const tick = () => {
      const now         = new Date();
      const utcMs       = now.getTime() + now.getTimezoneOffset() * 60000;
      const localMs     = utcMs + timezoneOffsetSeconds * 1000;
      const localDate   = new Date(localMs);
      setTime(localDate.toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timezoneOffsetSeconds]);

  return time;
}
