import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { cn } from "../lib/utils";
import { Button, IconButton, Avatar } from "./ui";
import {
  IconAcademic,
  IconAnnouncements,
  IconAssignments,
  IconAttendance,
  IconDashboard,
  IconExams,
  IconLogout,
  IconMenu,
  IconMoon,
  IconMonitor,
  IconParents,
  IconProfile,
  IconStudents,
  IconSun,
  IconTeacher,
  IconTimetable,
} from "./icons";

type NavItem = { to: string; label: string; icon: React.ReactNode; roles: string[]; group: string };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <IconDashboard className="h-5 w-5" />, group: "Overview", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/students", label: "Students", icon: <IconStudents className="h-5 w-5" />, group: "People", roles: ["ADMIN", "TEACHER"] },
  { to: "/teachers", label: "Teachers", icon: <IconTeacher className="h-5 w-5" />, group: "People", roles: ["ADMIN"] },
  { to: "/parents", label: "Parents", icon: <IconParents className="h-5 w-5" />, group: "People", roles: ["ADMIN"] },
  { to: "/academic", label: "Classes & Subjects", icon: <IconAcademic className="h-5 w-5" />, group: "People", roles: ["ADMIN"] },
  { to: "/attendance", label: "Attendance", icon: <IconAttendance className="h-5 w-5" />, group: "Academics", roles: ["ADMIN", "TEACHER"] },
  { to: "/my-attendance", label: "My Attendance", icon: <IconAttendance className="h-5 w-5" />, group: "Academics", roles: ["STUDENT"] },
  { to: "/exams", label: "Exams & Marks", icon: <IconExams className="h-5 w-5" />, group: "Academics", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/assignments", label: "Assignments", icon: <IconAssignments className="h-5 w-5" />, group: "Academics", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/timetable", label: "Timetable", icon: <IconTimetable className="h-5 w-5" />, group: "Academics", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/announcements", label: "Announcements", icon: <IconAnnouncements className="h-5 w-5" />, group: "Updates", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/profile", label: "Profile", icon: <IconProfile className="h-5 w-5" />, group: "Account", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
];

const GROUP_ORDER = ["Overview", "Academics", "People", "Updates", "Account"];

function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "system" ? IconMonitor : resolved === "dark" ? IconMoon : IconSun;
  return (
    <IconButton
      aria-label={`Theme: ${theme}. Click to switch.`}
      title={`Theme: ${theme}`}
      onClick={() => setTheme(next)}
      className="text-muted-foreground"
    >
      <Icon className="h-5 w-5" />
    </IconButton>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => user && i.roles.includes(user.role));
  const title = NAV.find((i) => location.pathname.startsWith(i.to))?.label ?? "Dashboard";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const nav = (
    <nav className="flex flex-col gap-4 p-3">
      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
            <div className="flex flex-col gap-0.5">
              {groupItems.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  {i.icon}
                  {i.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <IconAcademic className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Student MS</p>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{nav}</div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-3">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">
          {theme_label(resolved)}
        </span>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-full">
      <div className="hidden md:block">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-lg">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <IconButton aria-label="Open menu" className="md:hidden text-muted-foreground" onClick={() => setOpen(true)}>
              <IconMenu className="h-5 w-5" />
            </IconButton>
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={user?.firstName ?? user?.email ?? "?"} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">{user?.firstName ?? "User"}</p>
                <p className="text-xs capitalize text-muted-foreground">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-1.5">
              <IconLogout className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function theme_label(resolved: "light" | "dark") {
  return resolved === "dark" ? "Dark mode" : "Light mode";
}
