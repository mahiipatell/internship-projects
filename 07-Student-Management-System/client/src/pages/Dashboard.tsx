import { useEffect, useState } from "react";
import { api, ApiError, download } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, EmptyState, ErrorText, PageHeader, Progress, Skeleton, StatCard } from "../components/ui";
import {
  IconAcademic,
  IconAnnouncements,
  IconAttendance,
  IconBook,
  IconClock,
  IconExams,
  IconStudents,
  IconTeacher,
  IconTrendUp,
} from "../components/icons";

type Dash =
  | { totalStudents: number; totalTeachers: number; totalClasses: number; todayAttendancePct: number }
  | {
      todayClasses: { period: number; subject: { name: string }; section: { name: string; class: { name: string } } }[];
      examsNeedingMarks: {
        id: string;
        name: string;
        subject: { name: string };
        section: { name: string; class: { name: string } };
        _count: { marks: number };
      }[];
    }
  | {
      student: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string;
        section: { name: string; class: { name: string } } | null;
      } | null;
      attendance: { pct: number; present: number; absent: number; late: number; total: number };
      attendancePct: number;
      upcomingAssignments: { id: string; title: string; dueDate: string; subject: { name: string } }[];
      todayTimetable: { period: number; subject: { name: string } }[];
      upcomingExams: { id: string; name: string; subject: { name: string }; examDate: string | null; maxMarks: number }[];
      recentMarks: { id: string; marksObtained: number | null; exam: { name: string; maxMarks: number; subject: { name: string } } }[];
      recentAnnouncements: { id: string; title: string; body: string; createdAt: string; scope: string; author: { firstName: string | null; lastName: string | null } }[];
    }
  | {
      children: {
        id: string;
        name: string;
        rollNumber: string;
        section: string;
        attendancePct: number;
        avgMarks: number | null;
      }[];
    };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function daysUntil(d: string) {
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get<Dash>("/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return null;

  const role = user?.role;
  const name = user?.firstName ?? user?.email ?? "there";

  async function exportReport(studentId: string, rollNumber: string) {
    if (exporting) return;
    setExporting(true);
    try {
      await download(`/students/${studentId}/report`, `student-report-${rollNumber}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to export report");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Here is what's happening across your school today."
        icon={<IconTrendUp className="h-5 w-5" />}
      />

      {role === "ADMIN" && "totalStudents" in data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Students" value={data.totalStudents} icon={<IconStudents className="h-5 w-5" />} />
          <StatCard label="Teachers" value={data.totalTeachers} icon={<IconTeacher className="h-5 w-5" />} />
          <StatCard label="Classes" value={data.totalClasses} icon={<IconAcademic className="h-5 w-5" />} />
          <StatCard
            label="Today's Attendance"
            value={`${data.todayAttendancePct}%`}
            icon={<IconAttendance className="h-5 w-5" />}
            hint={data.todayAttendancePct >= 85 ? "Healthy" : "Below target"}
            hintTone={data.todayAttendancePct >= 85 ? "success" : "warning"}
          />
        </div>
      )}

      {role === "TEACHER" && "todayClasses" in data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <IconClock className="h-4 w-4 text-primary" /> Today's Classes
            </h2>
            {data.todayClasses.length === 0 ? (
              <EmptyState icon={<IconClock className="h-5 w-5" />} title="No classes scheduled" description="Enjoy your free periods today." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.todayClasses.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-medium text-foreground">{c.subject.name}</p>
                      <p className="text-muted-foreground">{c.section.class.name} - {c.section.name}</p>
                    </div>
                    <Badge tone="primary">Period {c.period}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <IconExams className="h-4 w-4 text-primary" /> Exams Awaiting Marks
            </h2>
            {data.examsNeedingMarks.length === 0 ? (
              <EmptyState icon={<IconExams className="h-5 w-5" />} title="All caught up" description="No exams are pending marks entry." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.examsNeedingMarks.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-medium text-foreground">{e.name}</p>
                      <p className="text-muted-foreground">{e.subject.name} · {e.section.class.name} - {e.section.name}</p>
                    </div>
                    <Badge tone="warning">{e._count.marks} marks</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {role === "STUDENT" && "attendance" in data && (
        <div className="space-y-4">
          <div className="-mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data.student?.section && <span>{data.student.section.class.name} - {data.student.section.name}</span>}
            {data.student?.rollNumber && <span className="font-mono">Roll {data.student.rollNumber}</span>}
            {data.student && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => exportReport(data.student!.id, data.student!.rollNumber)}
                disabled={exporting}
              >
                {exporting ? "Exporting…" : "Export My Report"}
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Attendance"
              value={`${data.attendance.pct}%`}
              icon={<IconAttendance className="h-5 w-5" />}
              hint={data.attendance.pct >= 75 ? "On track" : "Needs attention"}
              hintTone={data.attendance.pct >= 75 ? "success" : "warning"}
            />
            <StatCard label="Present" value={data.attendance.present} icon={<IconAttendance className="h-5 w-5" />} />
            <StatCard label="Absent" value={data.attendance.absent} icon={<IconAttendance className="h-5 w-5" />} />
            <StatCard label="Late" value={data.attendance.late} icon={<IconAttendance className="h-5 w-5" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <IconBook className="h-4 w-4 text-primary" /> Upcoming Assignments
              </h2>
              {data.upcomingAssignments.length === 0 ? (
                <EmptyState icon={<IconBook className="h-5 w-5" />} title="Nothing due soon" description="You're all caught up." />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {data.upcomingAssignments.map((a) => {
                    const d = daysUntil(a.dueDate);
                    return (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="font-medium text-foreground">{a.title}</p>
                          <p className="text-muted-foreground">{a.subject.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{fmtDate(a.dueDate)}</p>
                          <Badge tone={d <= 2 ? "destructive" : d <= 5 ? "warning" : "slate"}>
                            {d <= 0 ? "Due" : `in ${d}d`}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <IconExams className="h-4 w-4 text-primary" /> Upcoming Exams
              </h2>
              {data.upcomingExams.length === 0 ? (
                <EmptyState icon={<IconExams className="h-5 w-5" />} title="No upcoming exams" description="No exams scheduled ahead." />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {data.upcomingExams.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="font-medium text-foreground">{e.name}</p>
                        <p className="text-muted-foreground">{e.subject.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{e.examDate ? fmtDate(e.examDate) : "Date TBA"}</p>
                        <Badge tone="slate">Max {e.maxMarks}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <IconBook className="h-4 w-4 text-primary" /> Recent Marks
              </h2>
              {data.recentMarks.length === 0 ? (
                <EmptyState icon={<IconBook className="h-5 w-5" />} title="No marks yet" description="Published marks will appear here." />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {data.recentMarks.map((mk) => {
                    const pct = mk.marksObtained != null ? Math.round((mk.marksObtained / mk.exam.maxMarks) * 100) : null;
                    return (
                      <li key={mk.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="font-medium text-foreground">{mk.exam.name}</p>
                          <p className="text-muted-foreground">{mk.exam.subject.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {mk.marksObtained != null ? `${mk.marksObtained} / ${mk.exam.maxMarks}` : "—"}
                          </p>
                          {pct != null && <p className="text-xs text-muted-foreground">{pct}%</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <IconClock className="h-4 w-4 text-primary" /> Today's Classes
              </h2>
              {data.todayTimetable.length === 0 ? (
                <EmptyState icon={<IconClock className="h-5 w-5" />} title="No classes today" description="Enjoy your free day." />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {data.todayTimetable.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="font-medium text-foreground">{c.subject.name}</p>
                      <Badge tone="primary">Period {c.period}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <IconAnnouncements className="h-4 w-4 text-primary" /> Recent Announcements
            </h2>
            {data.recentAnnouncements.length === 0 ? (
              <EmptyState icon={<IconAnnouncements className="h-5 w-5" />} title="No new announcements" description="Check back later for updates." />
            ) : (
              <ul className="space-y-3">
                {data.recentAnnouncements.map((a) => (
                  <li key={a.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <Badge tone={a.scope === "INSTITUTION" ? "primary" : "slate"}>
                        {a.scope === "INSTITUTION" ? "All" : "Section"}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[a.author?.firstName, a.author?.lastName].filter(Boolean).join(" ")} · {fmtDate(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {role === "PARENT" && "children" in data && (
        <div className="space-y-4">
          {data.children.length === 0 ? (
            <EmptyState title="No linked children" description="Children linked to your account will appear here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.children.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.section}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{c.avgMarks != null ? `${c.avgMarks} avg` : "No marks"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => exportReport(c.id, c.rollNumber)} disabled={exporting}>
                        {exporting ? "Exporting…" : "Export"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="font-medium text-foreground">{c.attendancePct}%</span>
                    </div>
                    <Progress value={c.attendancePct} tone={c.attendancePct >= 75 ? "success" : "warning"} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
