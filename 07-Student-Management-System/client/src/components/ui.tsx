import { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  ghost: "text-foreground hover:bg-muted",
  outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
  subtle: "bg-accent text-accent-foreground hover:bg-accent/80",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
  icon: "h-9 w-9",
};

export function Button({ variant = "primary", size = "md", className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ variant = "ghost", size = "icon", className, type, "aria-label": ariaLabel, ...props }: ButtonProps & { "aria-label": string }) {
  return <Button variant={variant} size={size} type={type} aria-label={ariaLabel} className={cn("shrink-0", className)} {...props} />;
}

/* --------------------------------------------------------------- Form bits */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

type FieldProps = { label?: ReactNode; htmlFor?: string; required?: boolean; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string };

export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? <p className="mt-1 text-sm text-destructive">{children}</p> : null;
}

/* ------------------------------------------------------------------- Card */

type CardProps = HTMLAttributes<HTMLDivElement> & { onClick?: () => void };

export function Card({ className, children, onClick, ...props }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-muted/40",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Badge */

type BadgeTone = "slate" | "green" | "amber" | "red" | "success" | "warning" | "destructive" | "info" | "primary";

const BADGE_TONES: Record<BadgeTone, string> = {
  slate: "bg-muted text-muted-foreground",
  green: "bg-success/10 text-success",
  amber: "bg-warning/10 text-warning",
  red: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  primary: "bg-primary/10 text-primary",
};

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Spinner */

export function Spinner({ full, size = "md", label }: { full?: boolean; size?: "sm" | "md" | "lg"; label?: string }) {
  const dim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <div className={cn("flex items-center justify-center gap-2", full && "h-full min-h-[50vh]")} role="status" aria-live="polite">
      <span className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", dim)} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- Modal */

type ModalSize = "sm" | "md" | "lg";

function Modal({
  title,
  description,
  size = "md",
  onClose,
  children,
}: {
  title: string;
  description?: ReactNode;
  size?: ModalSize;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={cn("w-full rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-lg animate-scale-in", width)} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <IconButton aria-label="Close" onClick={onClose} className="-mr-1 -mt-1 text-muted-foreground">
            ✕
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export { Modal };

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------- Table */

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap border-b border-border px-3 py-2.5 text-left font-medium text-muted-foreground", className)} {...props} />;
}

export function Td({ className, colSpan, ...props }: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("border-b border-border px-3 py-2.5 align-middle", className)} {...props} />;
}

/* ------------------------------------------------------------- Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icon && <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------- Tabs */

export type TabItem = { id: string; label: ReactNode; icon?: ReactNode; count?: number };

export function Tabs({ tabs, value, onChange, className }: { tabs: TabItem[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            value === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.icon}
          {t.label}
          {t.count != null && (
            <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- StatCard */

export function StatCard({ label, value, icon, hint, hintTone = "muted" }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode; hintTone?: "muted" | "success" | "warning" | "destructive" }) {
  const hintColor = hintTone === "success" ? "text-success" : hintTone === "warning" ? "text-warning" : hintTone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className={cn("mt-1 text-xs", hintColor)}>{hint}</p>}
        </div>
        {icon && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- Alert */

type AlertTone = "info" | "success" | "warning" | "destructive";

const ALERT_TONES: Record<AlertTone, string> = {
  info: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Alert({ tone = "info", title, children, icon }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm", ALERT_TONES[tone])}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- PageHeader */

export function PageHeader({ title, description, actions, icon }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">{icon}</div>}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Avatar */

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary", dim)} aria-hidden="true">
      {initials}
    </span>
  );
}

/* --------------------------------------------------------------- Progress */

export function Progress({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : tone === "destructive" ? "bg-destructive" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
