import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { useTheme } from "../lib/theme";
import { Button, Card, ErrorText, Field, Input, IconButton } from "../components/ui";
import { IconAcademic, IconEye, IconEyeOff, IconMoon, IconSun, IconMonitor } from "../components/icons";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, resolved, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const ThemeBtn = (
    <IconButton
      aria-label={`Theme: ${theme}. Click to switch.`}
      title={`Theme: ${theme}`}
      onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
      className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
    >
      {(theme === "system" ? IconMonitor : resolved === "dark" ? IconMoon : IconSun)({ className: "h-5 w-5" })}
    </IconButton>
  );

  return (
    <div className="flex min-h-full">
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <IconAcademic className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold">Student Management System</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">One place for attendance, exams &amp; everything academic.</h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/80">
            Track performance, manage records and stay connected across students, teachers and parents.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} Student Management System</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2">
        <div className="absolute right-4 top-4 lg:hidden">{ThemeBtn}</div>
        <Card className="w-full max-w-sm p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                <IconAcademic className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-semibold">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to continue</p>
              </div>
            </div>
            <div className="hidden lg:block">{ThemeBtn}</div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" autoComplete="username" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <IconButton
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                  type="button"
                >
                  {showPw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </IconButton>
              </div>
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
