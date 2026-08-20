import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { IconAlert, IconCheckCircle, IconClose, IconInfo, IconWarning } from "./icons";

export type ToastTone = "success" | "error" | "warning" | "info";
type Toast = { id: number; tone: ToastTone; title: string; description?: string };

type ToastValue = {
  toast: (t: { tone?: ToastTone; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

const TONE_STYLES: Record<ToastTone, { icon: typeof IconInfo; ring: string; iconColor: string }> = {
  success: { icon: IconCheckCircle, ring: "border-success/30", iconColor: "text-success" },
  error: { icon: IconAlert, ring: "border-destructive/30", iconColor: "text-destructive" },
  warning: { icon: IconWarning, ring: "border-warning/30", iconColor: "text-warning" },
  info: { icon: IconInfo, ring: "border-info/30", iconColor: "text-info" },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastValue["toast"]>(({ tone = "info", title, description }) => {
    setToasts((list) => [...list, { id: nextId++, tone, title, description }]);
  }, []);

  const success = useCallback<ToastValue["success"]>(
    (title, description) => toast({ tone: "success", title, description }),
    [toast],
  );
  const error = useCallback<ToastValue["error"]>(
    (title, description) => toast({ tone: "error", title, description }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {/* Polite live region: announced by screen readers without stealing focus. */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { icon: Icon, ring, iconColor } = TONE_STYLES[toast.tone];

  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.tone === "error" ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.tone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg animate-slide-in-right",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
