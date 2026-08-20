import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sms-theme";

type ThemeValue = {
  /** What the user picked (may be "system"). */
  theme: Theme;
  /** What is actually on screen right now. */
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function systemPrefers(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(): Theme {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

function apply(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in index.html has already set the class before paint;
  // we just mirror that same decision into React state.
  const [theme, setThemeState] = useState<Theme>(() => readStored());
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    readStored() === "system" ? systemPrefers() : (readStored() as "light" | "dark"),
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const r = next === "system" ? systemPrefers() : next;
    setResolved(r);
    apply(r);
  }, []);

  // Follow the OS while the user is on "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = systemPrefers();
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Keep the DOM in sync if state ever changes without going through setTheme.
  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
