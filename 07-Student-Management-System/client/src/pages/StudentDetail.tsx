import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError, download } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorText,
  Field,
  IconButton,
  Input,
  Progress,
  Select,
  Spinner,
  Tabs,
  Table,
  Td,
  Th,
} from "../components/ui";
import { IconChevronLeft } from "../components/icons";

type Section = { id: string; name: string; class: { name: string } };
type Parent = { id: string; firstName: string | null; lastName: string | null; email: string };
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  dob: string | null;
  sectionId: string | null;
  parentId: string | null;
  active: boolean;
  section: { name: string; class: { name: string } } | null;
  parent: Parent | null;
  user: { email: string };
};

const parentLabel = (p: Parent) => `${[p.firstName, p.lastName].filter(Boolean).join(" ") || p.email} (${p.email})`;

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [tab, setTab] = useState<"info" | "attendance" | "marks">("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showToggle, setShowToggle] = useState(false);
  const canEdit = user?.role === "ADMIN" || user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";

  async function exportReport() {
    if (!student || exporting) return;
    setExporting(true);
    try {
      await download(`/students/${student.id}/report`, `student-report-${student.rollNumber}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to export report");
    } finally {
      setExporting(false);
    }
  }

  // DELETE /students/:id is a soft-deactivate (sets active=false); reactivating
  // flips it back. Admin only — teachers keep the in-form checkbox instead.
  async function toggleActive() {
    if (!student) return;
    setActionError("");
    try {
      await api.patch(`/students/${student.id}`, { active: !student.active });
      setShowToggle(false);
      load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, secs, pars] = await Promise.all([
        api.get<Student>(`/students/${id}`),
        api.get<Section[]>("/sections").catch(() => [] as Section[]),
        api.get<Parent[]>("/parents").catch(() => [] as Parent[]),
      ]);
      setStudent(s);
      setSections(secs);
      setParents(pars);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load student");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner full />;
  if (error || !student) return <ErrorText>{error || "Student not found"}</ErrorText>;

  return (
    <div className="space-y-5">
      <IconButton aria-label="Back to students" className="text-muted-foreground" onClick={() => navigate(-1)}>
        <IconChevronLeft className="h-5 w-5" />
        <span className="ml-1 text-sm font-medium">Back</span>
      </IconButton>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={`${student.firstName} ${student.lastName}`} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{student.firstName} {student.lastName}</h1>
            <p className="text-sm text-muted-foreground">{student.user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary" className="font-mono">Roll {student.rollNumber}</Badge>
          {student.section && <Badge tone="primary">{student.section.class.name} - {student.section.name}</Badge>}
          {!student.active && <Badge tone="destructive">Inactive</Badge>}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={exportReport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export Report"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => setShowToggle(true)}>
              {student.active ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </Card>

      {actionError && <ErrorText>{actionError}</ErrorText>}

      {isAdmin && showToggle && (
        <ConfirmDialog
          title={student.active ? "Deactivate student" : "Activate student"}
          message={`${student.active ? "Deactivate" : "Activate"} ${student.firstName} ${student.lastName} (${student.user.email}, roll ${student.rollNumber})? A deactivated student is hidden from active rosters and cannot log in.`}
          confirmLabel={student.active ? "Deactivate" : "Activate"}
          onConfirm={toggleActive}
          onClose={() => setShowToggle(false)}
        />
      )}

      <Tabs
        tabs={[
          { id: "info", label: "Info" },
          { id: "attendance", label: "Attendance" },
          { id: "marks", label: "Marks" },
        ]}
        value={tab}
        onChange={(t) => setTab(t as typeof tab)}
      />

      {tab === "info" && <InfoTab student={student} sections={sections} parents={parents} editable={canEdit} onSaved={load} />}
      {tab === "attendance" && <AttendanceTab studentId={student.id} />}
      {tab === "marks" && <MarksTab studentId={student.id} />}
    </div>
  );
}

function InfoTab({
  student,
  sections,
  parents,
  editable,
  onSaved,
}: {
  student: Student;
  sections: Section[];
  parents: Parent[];
  editable: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    rollNumber: student.rollNumber,
    email: student.user.email,
    dob: student.dob ? student.dob.slice(0, 10) : "",
    sectionId: student.sectionId ?? "",
    parentId: student.parentId ?? "",
    active: student.active,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The parent dropdown is fed by the /parents list, which only ADMIN may fetch.
  // Teachers (who can edit students in their sections) get an empty list and would
  // see "— None —" even though GET /students/:id already returns the assigned
  // parent. Surface that parent as an option so it displays without opening
  // /parents to teachers.
  const assignedParent = student.parent;
  const parentOptions =
    assignedParent && !parents.some((p) => p.id === assignedParent.id)
      ? [assignedParent, ...parents]
      : parents;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/students/${student.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber,
        email: form.email,
        dob: form.dob || undefined,
        sectionId: form.sectionId || null,
        parentId: form.parentId || null,
        active: form.active,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!editable) {
    return (
      <Card className="max-w-lg p-5">
        <dl className="divide-y divide-border text-sm">
          <Row label="Name" value={`${student.firstName} ${student.lastName}`} />
          <Row label="Roll number" value={student.rollNumber} />
          <Row label="Email" value={student.user.email} />
          <Row label="Class / Section" value={student.section ? `${student.section.class.name} - ${student.section.name}` : "—"} />
          <Row label="Parent" value={student.parent ? parentLabel(student.parent) : "—"} />
          <Row label="Status" value={student.active ? "Active" : "Inactive"} />
        </dl>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg p-5">
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="d-fn">
            <Input id="d-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name" htmlFor="d-ln">
            <Input id="d-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Roll number" htmlFor="d-roll" hint="Unique within the student's section.">
          <Input id="d-roll" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className="font-mono" />
        </Field>
        <Field label="Email" htmlFor="d-email">
          <Input id="d-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Date of birth" htmlFor="d-dob">
          <Input id="d-dob" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </Field>
        <Field label="Section" htmlFor="d-sec">
          <Select id="d-sec" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
            <option value="">— None —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Parent" htmlFor="d-par">
          <Select id="d-par" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <option value="">— None —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {parentLabel(p)}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          Active
        </label>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

// Shared loader for the read-only tabs — fetch on mount, render a table.
function useList<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<T[]>(path)
      .then((d) => alive && setRows(d))
      .catch((err) => alive && setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [path]);

  return { rows, loading, error };
}

const ATTENDANCE_TONE = { PRESENT: "success", ABSENT: "destructive", LATE: "warning" } as const;

function AttendanceTab({ studentId }: { studentId: string }) {
  const { rows, loading, error } = useList<{ id: string; date: string; status: keyof typeof ATTENDANCE_TONE }>(`/attendance?studentId=${studentId}`);
  if (loading) return <Spinner full />;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (rows.length === 0) return <EmptyState title="No attendance recorded" description="Attendance will appear here once taken." />;

  const present = rows.filter((r) => r.status === "PRESENT").length;
  const pct = Math.round((present / rows.length) * 100);
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Attendance rate</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <Progress value={pct} tone={pct >= 75 ? "success" : "warning"} />
        <p className="mt-1.5 text-xs text-muted-foreground">{present} of {rows.length} sessions present</p>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <Td>{r.date.slice(0, 10)}</Td>
              <Td>
                <Badge tone={ATTENDANCE_TONE[r.status]}>{r.status}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

const MARKS_TONE = { published: "success", draft: "warning" } as const;

function MarksTab({ studentId }: { studentId: string }) {
  const { rows, loading, error } = useList<{
    id: string;
    marksObtained: number | null;
    published: boolean;
    exam: { name: string; maxMarks: number; examDate: string | null; subject: { name: string } };
  }>(`/students/${studentId}/marks`);
  if (loading) return <Spinner full />;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (rows.length === 0) return <EmptyState title="No marks recorded" description="Exam marks will appear here once published." />;

  return (
    <Table>
      <thead>
        <tr>
          <Th>Exam</Th>
          <Th>Subject</Th>
          <Th>Marks</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-border">
            <Td className="font-medium text-foreground">{r.exam.name}</Td>
            <Td className="text-muted-foreground">{r.exam.subject.name}</Td>
            <Td className="text-muted-foreground">
              {r.marksObtained ?? "—"} / {r.exam.maxMarks}
            </Td>
            <Td>
              <Badge tone={MARKS_TONE[r.published ? "published" : "draft"]}>{r.published ? "Published" : "Draft"}</Badge>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
