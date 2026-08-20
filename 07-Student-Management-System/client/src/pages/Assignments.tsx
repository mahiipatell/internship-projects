import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/toast";
import { Badge, Button, Card, EmptyState, ErrorText, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td, Textarea, Th } from "../components/ui";
import { IconAssignments, IconPlus } from "../components/icons";

type Subject = { id: string; name: string };
type Section = { id: string; name: string; class: { name: string } };
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxMarks: number | null;
  subject: { name: string };
  section: { name: string; class: { name: string } };
  teacher: { user: { firstName: string; lastName: string } };
  _count: { submissions: number };
};
type Submission = {
  id: string;
  studentId: string;
  textContent: string | null;
  submittedAt: string | null;
  marksObtained: number | null;
  feedback: string | null;
  student: { firstName: string; lastName: string };
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
}

export default function Assignments() {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "TEACHER";
  const canCreate = user?.role === "TEACHER";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAssignments(await api.get<Assignment[]>("/assignments"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assignments"
        description={assignments.length ? `${assignments.length} assignment${assignments.length === 1 ? "" : "s"}` : undefined}
        icon={<IconAssignments className="h-5 w-5" />}
        actions={canCreate && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Assignment</Button>}
      />
      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<IconAssignments className="h-5 w-5" />}
          title="No assignments yet"
          description={canCreate ? "Create an assignment for your section." : "Assignments will appear here once posted."}
          action={canCreate && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Assignment</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => {
            const d = daysUntil(a.dueDate);
            return (
              <Card
                key={a.id}
                className={`cursor-pointer p-4 transition-all ${selected?.id === a.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelected(a)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <Badge tone={d <= 0 ? "destructive" : d <= 3 ? "warning" : "slate"}>
                    {d <= 0 ? "Overdue" : d <= 3 ? `Due in ${d}d` : "Upcoming"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.subject.name} · {a.section.class.name} - {a.section.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Due {fmtDate(a.dueDate)} · {a._count.submissions} submissions
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <AssignmentDetail assignment={selected} canEdit={canEdit} toast={toast} onChanged={load} onClose={() => setSelected(null)} />
      )}

      {showAdd && (
        <AddAssignmentModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AssignmentDetail({
  assignment,
  canEdit,
  toast,
  onChanged,
  onClose,
}: {
  assignment: Assignment;
  canEdit: boolean;
  toast: ReturnType<typeof useToast>;
  onChanged: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const subs = await api.get<Submission[]>(`/assignments/${assignment.id}/submissions`);
      setSubmissions(subs);
      if (subs.length && subs[0].textContent) setText(subs[0].textContent);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [assignment.id]);

  useEffect(() => {
    load();
  }, [load]);

  const pastDue = new Date() > new Date(assignment.dueDate);
  const mySubmission = submissions[0];

  async function submit() {
    setError("");
    try {
      await api.post(`/assignments/${assignment.id}/submissions`, { textContent: text });
      toast.success("Submitted");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    }
  }

  async function grade(sub: Submission, marks: string, feedback: string) {
    try {
      await api.patch(`/assignments/${assignment.id}/submissions/${sub.id}`, {
        marksObtained: marks === "" ? null : Number(marks),
        feedback,
      });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to grade");
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{assignment.title}</h2>
          <p className="text-sm text-muted-foreground">
            {assignment.subject.name} · Due {fmtDate(assignment.dueDate)}
            {assignment.maxMarks != null && ` · Max ${assignment.maxMarks}`}
          </p>
          {assignment.description && <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner />
      ) : canEdit ? (
        <SubmissionsTable submissions={submissions} maxMarks={assignment.maxMarks} onGrade={grade} />
      ) : (
        <div className="space-y-3 text-sm">
          {user?.role === "STUDENT" &&
            (mySubmission ? (
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium text-foreground">Your submission</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{mySubmission.textContent}</p>
                <p className="mt-2 text-muted-foreground">
                  Marks:{" "}
                  {mySubmission.marksObtained != null ? (
                    <span className="font-semibold text-foreground">
                      {mySubmission.marksObtained}{assignment.maxMarks != null ? ` / ${assignment.maxMarks}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                  {mySubmission.feedback ? ` · Feedback: ${mySubmission.feedback}` : ""}
                </p>
              </div>
            ) : pastDue ? (
              <p className="text-destructive">Submission deadline has passed.</p>
            ) : (
              <div className="space-y-2">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your submission…" />
                <Button size="sm" onClick={submit}>Submit</Button>
              </div>
            ))}
          {user?.role === "PARENT" && (
            <div className="rounded-md bg-muted p-3">
              {mySubmission ? (
                <p className="text-muted-foreground">
                  Submitted: {mySubmission.textContent ? "yes" : "no"} · Marks:{" "}
                  <span className="font-semibold text-foreground">{mySubmission.marksObtained != null ? mySubmission.marksObtained : "—"}</span>
                </p>
              ) : (
                <p className="text-muted-foreground">No submission yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SubmissionsTable({
  submissions,
  maxMarks,
  onGrade,
}: {
  submissions: Submission[];
  maxMarks: number | null;
  onGrade: (sub: Submission, marks: string, feedback: string) => void;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Student</Th>
          <Th>Submission</Th>
          <Th>Marks</Th>
          <Th>Feedback</Th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <SubmissionRow key={s.id} sub={s} maxMarks={maxMarks} onGrade={onGrade} />
        ))}
        {submissions.length === 0 && (
          <tr>
            <Td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No submissions yet.</Td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function SubmissionRow({
  sub,
  maxMarks,
  onGrade,
}: {
  sub: Submission;
  maxMarks: number | null;
  onGrade: (sub: Submission, marks: string, feedback: string) => void;
}) {
  const [marks, setMarks] = useState(sub.marksObtained != null ? String(sub.marksObtained) : "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");

  return (
    <tr className="border-b border-border align-top">
      <Td className="font-medium text-foreground">
        {sub.student.firstName} {sub.student.lastName}
      </Td>
      <Td className="text-muted-foreground">{sub.textContent ?? (sub.submittedAt ? "submitted" : "—")}</Td>
      <Td>
        <Input
          type="number"
          min={0}
          max={maxMarks ?? undefined}
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          className="max-w-[6rem]"
        />
      </Td>
      <Td>
        <div className="flex gap-1">
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} className="max-w-[12rem]" />
          <Button size="sm" onClick={() => onGrade(sub, marks, feedback)}>Save</Button>
        </div>
      </Td>
    </tr>
  );
}

function AddAssignmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [form, setForm] = useState({ title: "", description: "", subjectId: "", sectionId: "", dueDate: "", maxMarks: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Subject[]>("/subjects").then(setSubjects).catch(() => setSubjects([]));
    api.get<Section[]>("/sections").then(setSections).catch(() => setSections([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/assignments", {
        title: form.title,
        description: form.description || undefined,
        subjectId: form.subjectId,
        sectionId: form.sectionId,
        dueDate: form.dueDate,
        maxMarks: form.maxMarks ? Number(form.maxMarks) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Assignment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" htmlFor="a-title" required>
          <Input id="a-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description" htmlFor="a-desc">
          <Textarea id="a-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Subject" htmlFor="a-sub" required>
          <Select id="a-sub" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Section" htmlFor="a-sec" required>
          <Select id="a-sec" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date" htmlFor="a-due" required>
            <Input id="a-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
          </Field>
          <Field label="Max marks" htmlFor="a-max">
            <Input id="a-max" type="number" min={0} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
