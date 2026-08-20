import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, Badge, Button, Card, ConfirmDialog, ErrorText, Field, IconButton, Input, Select, Spinner } from "../components/ui";
import { IconBook, IconChevronLeft } from "../components/icons";

type Subject = { id: string; name: string; code: string };
type Section = { id: string; name: string; class: { name: string } };
type Assignment = { id: string; subject: { name: string }; section: { name: string; class: { name: string } } };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  user: { email: string; active: boolean };
  teacherAssignments: Assignment[];
};

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  async function removeAssignment(assignmentId: string) {
    setBusy(true);
    setActionError("");
    try {
      await api.del(`/teachers/${id}/assignments/${assignmentId}`);
      load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to remove assignment");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTeacher() {
    setBusy(true);
    setActionError("");
    try {
      await api.del(`/teachers/${id}`);
      navigate("/teachers");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to delete teacher");
      setShowDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [t, subs, secs] = await Promise.all([
        api.get<Teacher>(`/teachers/${id}`),
        api.get<Subject[]>("/subjects").catch(() => [] as Subject[]),
        api.get<Section[]>("/sections").catch(() => [] as Section[]),
      ]);
      setTeacher(t);
      setSubjects(subs);
      setSections(secs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load teacher");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner full />;
  if (error || !teacher) return <ErrorText>{error || "Teacher not found"}</ErrorText>;

  return (
    <div className="space-y-5">
      <IconButton aria-label="Back to teachers" className="text-muted-foreground" onClick={() => navigate(-1)}>
        <IconChevronLeft className="h-5 w-5" />
        <span className="ml-1 text-sm font-medium">Back</span>
      </IconButton>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={`${teacher.firstName} ${teacher.lastName}`} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{teacher.firstName} {teacher.lastName}</h1>
            <p className="text-sm text-muted-foreground">{teacher.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!teacher.user.active && <Badge tone="destructive">Inactive</Badge>}
          <Badge tone="slate">{teacher.teacherAssignments.length} assignment{teacher.teacherAssignments.length === 1 ? "" : "s"}</Badge>
          {isAdmin && <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>}
        </div>
      </Card>

      {isAdmin && <EditForm teacher={teacher} onSaved={load} />}

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <IconBook className="h-4 w-4 text-primary" /> Assignments
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {teacher.teacherAssignments.map((a) => (
            <Badge key={a.id} tone="primary" className="gap-1.5">
              {a.subject.name} · {a.section.class.name} - {a.section.name}
              {isAdmin && (
                <button
                  type="button"
                  aria-label="Remove assignment"
                  className="ml-0.5 rounded-full px-1 text-xs hover:bg-primary-foreground/20"
                  disabled={busy}
                  onClick={() => removeAssignment(a.id)}
                >
                  ✕
                </button>
              )}
            </Badge>
          ))}
          {teacher.teacherAssignments.length === 0 && (
            <span className="text-sm text-muted-foreground">No assignments yet</span>
          )}
        </div>

        {isAdmin && (
          <AssignmentForm subjects={subjects} sections={sections} teacherId={teacher.id} onAssigned={load} />
        )}
      </Card>

      {showDelete && (
        <ConfirmDialog
          title="Delete teacher"
          message={`Delete ${teacher.firstName} ${teacher.lastName} (${teacher.user.email})? Their login will be removed. Remove their authored assignments and timetable entries first.`}
          confirmLabel="Delete"
          onConfirm={deleteTeacher}
          onClose={() => setShowDelete(false)}
        />
      )}

      {actionError && <ErrorText>{actionError}</ErrorText>}
    </div>
  );
}

function EditForm({ teacher, onSaved }: { teacher: Teacher; onSaved: () => void }) {
  const [form, setForm] = useState({
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.user.email,
    active: teacher.user.active,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/teachers/${teacher.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        active: form.active,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-lg p-5">
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="t-fn">
            <Input id="t-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name" htmlFor="t-ln">
            <Input id="t-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Email" htmlFor="t-email">
          <Input id="t-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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

function AssignmentForm({
  subjects,
  sections,
  teacherId,
  onAssigned,
}: {
  subjects: Subject[];
  sections: Section[];
  teacherId: string;
  onAssigned: () => void;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !sectionId) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/teachers/${teacherId}/assignments`, { subjectId, sectionId });
      setSubjectId("");
      setSectionId("");
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label="Subject" htmlFor="a-sub" className="min-w-[10rem]">
        <Select id="a-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Section" htmlFor="a-sec" className="min-w-[10rem]">
        <Select id="a-sec" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">Select section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.class.name} - {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" disabled={busy || !subjectId || !sectionId}>Assign</Button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
