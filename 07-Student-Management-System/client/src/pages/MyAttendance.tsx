import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Card, EmptyState, ErrorText, PageHeader, Progress, Spinner } from "../components/ui";
import { IconAttendance } from "../components/icons";

type AttendanceRecord = { id: string; date: string; status: "PRESENT" | "ABSENT" | "LATE" };

const TONE: Record<"PRESENT" | "ABSENT" | "LATE", "success" | "destructive" | "warning"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function MyAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // No params: the server forces studentId = caller.id, so this returns
    // only the logged-in student's own attendance.
    api
      .get<AttendanceRecord[]>("/attendance")
      .then(setRecords)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const total = records.length;
    return { present, absent, late, total, pct: total ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  const byMonth = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    for (const r of records) {
      const key = r.date.slice(0, 7);
      (groups[key] ??= []).push(r);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  if (loading) return <Spinner full />;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Attendance"
        description={user ? `Attendance record for ${user.firstName ?? user.email}` : undefined}
        icon={<IconAttendance className="h-5 w-5" />}
      />

      {records.length === 0 ? (
        <EmptyState
          icon={<IconAttendance className="h-5 w-5" />}
          title="No attendance records yet"
          description="Your attendance will appear here once it's recorded."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Overall</p>
              <p className="text-2xl font-semibold text-foreground">{stats.pct}%</p>
              <div className="mt-2">
                <Progress value={stats.pct} tone={stats.pct >= 75 ? "success" : "warning"} />
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-2xl font-semibold text-success">{stats.present}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-2xl font-semibold text-destructive">{stats.absent}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-2xl font-semibold text-warning">{stats.late}</p>
            </Card>
          </div>

          {byMonth.map(([month, recs]) => {
            const pct = Math.round((recs.filter((r) => r.status === "PRESENT").length / recs.length) * 100);
            return (
              <Card key={month} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">{monthLabel(month)}</h2>
                  <Badge tone={pct >= 75 ? "success" : "warning"}>{pct}%</Badge>
                </div>
                <ul className="divide-y divide-border text-sm">
                  {recs
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-muted-foreground">{fmtDate(r.date)}</span>
                        <Badge tone={TONE[r.status]}>{r.status}</Badge>
                      </li>
                    ))}
                </ul>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
