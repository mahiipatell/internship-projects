import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/toast";
import { Badge, Button, Card, EmptyState, ErrorText, Field, Input, PageHeader, Progress, Select, Spinner, Table, Td, Th } from "../components/ui";
import { IconAttendance } from "../components/icons";

type Section = { id: string; name: string; class: { name: string } };
type RosterStudent = { id: string; firstName: string; lastName: string };
type AttendanceRecord = { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" };
type Status = "PRESENT" | "ABSENT" | "LATE";

const STATUS_TONE: Record<Status, "success" | "destructive" | "warning"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Section[]>("/sections").then(setSections).catch(() => setSections([]));
  }, []);

  const load = useCallback(async () => {
    if (!sectionId || !date) return;
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const [rosterRes, existing] = await Promise.all([
        api.get<{ data: RosterStudent[] }>(`/students?sectionId=${sectionId}&pageSize=200`),
        api.get<AttendanceRecord[]>(`/attendance?sectionId=${sectionId}&date=${date}`).catch(() => [] as AttendanceRecord[]),
      ]);
      const roster = rosterRes.data;
      setRoster(roster);
      const map: Record<string, Status> = {};
      for (const s of roster) map[s.id] = "PRESENT";
      for (const rec of existing) map[rec.studentId] = rec.status;
      setStatuses(map);
    } catch (err) {
      setRoster([]);
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [sectionId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function setStatus(studentId: string, status: Status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    setStatuses(Object.fromEntries(roster.map((s) => [s.id, "PRESENT" as Status])));
  }

  async function submit() {
    setError("");
    try {
      await api.post("/attendance", {
        sectionId,
        date,
        records: roster.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "PRESENT" })),
      });
      setSaved(true);
      toast.success("Attendance saved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save attendance");
    }
  }

  const present = roster.filter((s) => statuses[s.id] === "PRESENT").length;
  const percent = roster.length ? Math.round((present / roster.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance" description="Take or review daily attendance by section." icon={<IconAttendance className="h-5 w-5" />} />
      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Section" htmlFor="att-sec" className="min-w-[12rem]">
          <Select id="att-sec" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="att-date" className="min-w-[10rem]">
          <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      {!sectionId ? (
        <EmptyState icon={<IconAttendance className="h-5 w-5" />} title="Select a section and date" description="Choose a section and date to begin taking attendance." />
      ) : loading ? (
        <Spinner full />
      ) : error ? null : roster.length === 0 ? (
        <EmptyState icon={<IconAttendance className="h-5 w-5" />} title="No students in this section" description="Add students to this section to take attendance." />
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-[12rem] flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Present</span>
                <span className="font-semibold text-foreground">{present}/{roster.length} · {percent}%</span>
              </div>
              <Progress value={percent} tone={percent >= 75 ? "success" : "warning"} />
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={markAllPresent}>Mark All Present</Button>
                <Button size="sm" onClick={submit}>Submit</Button>
              </div>
            )}
          </Card>
          {saved && canEdit && <p className="text-sm text-success">Attendance saved.</p>}

          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <Td className="font-medium text-foreground">{s.firstName} {s.lastName}</Td>
                  <Td>
                    {canEdit ? (
                      <Select
                        value={statuses[s.id] ?? "PRESENT"}
                        onChange={(e) => setStatus(s.id, e.target.value as Status)}
                        className="max-w-[10rem]"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                      </Select>
                    ) : (
                      <Badge tone={STATUS_TONE[statuses[s.id] ?? "PRESENT"]}>
                        {statuses[s.id] ?? "PRESENT"}
                      </Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
