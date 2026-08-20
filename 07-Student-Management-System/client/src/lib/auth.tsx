import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, ApiUser, registerRefresh, setAccessToken } from "./api";

type AuthValue = {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh tokens rotate, so parallel 401s must not each spend the cookie —
  // concurrent callers share one in-flight request.
  const inFlight = useRef<Promise<{ accessToken: string; user: ApiUser } | null> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      try {
        // Use the shared API client so it honors VITE_API_URL on cross-origin
        // deployments (the refresh path is excluded from the 401-retry loop).
        const data = await api.post<{ accessToken: string; user: ApiUser }>("/auth/refresh");
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      } catch {
        // Session is gone — drop it so RequireAuth bounces to /login.
        setAccessToken(null);
        setUser(null);
        return null;
      } finally {
        inFlight.current = null;
      }
    })();

    return inFlight.current;
  }, []);

  // Register the refresh hook with the api client so 401s can self-heal.
  useEffect(() => {
    registerRefresh(refresh);
  }, [refresh]);

  // Silent refresh on load (refresh token is in an httpOnly cookie).
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: ApiUser }>("/auth/login", {
      email,
      password,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
